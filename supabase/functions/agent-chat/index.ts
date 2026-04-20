import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import OpenAI from "npm:openai@4.60.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Types (mirror frontend splitStore) ──────────────────────────────────────

type ReceiptItem = { id: string; name: string; price: number };
type ContactState = { id: string; name: string; items: ReceiptItem[] };

type ReceiptState = {
  items: ReceiptItem[];
  contacts: ContactState[];
  userItems: ReceiptItem[];
  tax: number;
  tip: number;
  total: number;
};

export type AgentAction =
  | { type: "assign_item"; item_id: string; contact_id: string }
  | { type: "assign_to_user"; item_id: string }
  | { type: "unassign_from_contact"; item_id: string; contact_id: string }
  | { type: "split_item_between"; item_id: string; assignees: [string, string] };

// ── Tool definitions for GPT-4o ──────────────────────────────────────────────

const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "assign_item",
      description:
        "Assign an unassigned receipt item to a specific contact by ID.",
      parameters: {
        type: "object",
        properties: {
          item_id: { type: "string", description: "Exact ID of the item to assign" },
          contact_id: { type: "string", description: "Exact ID of the contact" },
        },
        required: ["item_id", "contact_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "assign_to_user",
      description:
        'Assign an item to the current user ("me", "I", "myself").',
      parameters: {
        type: "object",
        properties: {
          item_id: { type: "string", description: "Exact ID of the item" },
        },
        required: ["item_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "unassign_from_contact",
      description:
        "Remove an item from a contact's tab, returning it to the unassigned pool.",
      parameters: {
        type: "object",
        properties: {
          item_id: { type: "string", description: "Exact ID of the item to unassign" },
          contact_id: {
            type: "string",
            description: "Exact ID of the contact, or 'user' for the current user",
          },
        },
        required: ["item_id", "contact_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "split_item_between",
      description:
        "Split a receipt item evenly in half and assign one half to each of exactly 2 people.",
      parameters: {
        type: "object",
        properties: {
          item_id: { type: "string", description: "Exact ID of the item to split" },
          assignees: {
            type: "array",
            description:
              "Exactly 2 contact IDs (or 'user' for the current user) to split between",
            items: { type: "string" },
            minItems: 2,
            maxItems: 2,
          },
        },
        required: ["item_id", "assignees"],
        additionalProperties: false,
      },
    },
  },
];

// ── System prompt builder ────────────────────────────────────────────────────

function buildSystemPrompt(state: ReceiptState): string {
  const assignedIds = new Set([
    ...state.contacts.flatMap((c) => c.items.map((i) => i.id)),
    ...state.userItems.map((i) => i.id),
  ]);
  const unassigned = state.items.filter((i) => !assignedIds.has(i.id));

  const fmtItems = (items: ReceiptItem[]) =>
    items.length > 0
      ? items.map((i) => `    • ${i.name} $${i.price.toFixed(2)} [id:${i.id}]`).join("\n")
      : "    (none)";

  const contactBlock = state.contacts
    .map((c) => `  ${c.name} [id:${c.id}]\n${fmtItems(c.items)}`)
    .join("\n");

  return `You are Divi's receipt-splitting assistant. Help the user assign receipt items to the correct people using the available tools.

RECEIPT TOTALS: $${state.total.toFixed(2)} total | tax $${state.tax.toFixed(2)} | tip $${state.tip.toFixed(2)}

UNASSIGNED ITEMS (these need to be assigned):
${fmtItems(unassigned)}

CONTACTS AND THEIR CURRENT ITEMS:
${contactBlock || "  (no contacts)"}

CURRENT USER'S ITEMS:
${fmtItems(state.userItems)}

RULES:
- Use EXACT item IDs and contact IDs from the lists above — never invent IDs.
- "me", "I", "myself", "my" → use assign_to_user.
- Splitting an item → use split_item_between with exactly 2 assignees.
- Always call tools BEFORE responding. Confirm what you did in 1–2 short sentences.
- If a name is ambiguous (multiple contacts with similar names), ask for clarification.
- If the user says something unrelated to splitting, gently redirect.`;
}

// ── Stateful simulation of tool effects ─────────────────────────────────────
// The edge function simulates state changes locally so GPT can reason about
// multi-step operations (e.g. split → then refer to new halves). The real
// mutations happen on the frontend via the returned actions list.

function simulateTool(
  name: string,
  args: Record<string, unknown>,
  state: ReceiptState,
  actions: AgentAction[],
): { result: string; state: ReceiptState } {
  // Deep-clone so each step sees the latest state
  const s: ReceiptState = {
    items: state.items.map((i) => ({ ...i })),
    contacts: state.contacts.map((c) => ({ ...c, items: c.items.map((i) => ({ ...i })) })),
    userItems: state.userItems.map((i) => ({ ...i })),
    tax: state.tax,
    tip: state.tip,
    total: state.total,
  };

  switch (name) {
    case "assign_item": {
      const { item_id, contact_id } = args as { item_id: string; contact_id: string };
      const item = s.items.find((i) => i.id === item_id);
      const contact = s.contacts.find((c) => c.id === contact_id);
      if (!item) return { result: `Error: item ${item_id} not found.`, state: s };
      if (!contact) return { result: `Error: contact ${contact_id} not found.`, state: s };
      if (!contact.items.some((i) => i.id === item_id)) contact.items.push(item);
      actions.push({ type: "assign_item", item_id, contact_id });
      return { result: `Assigned "${item.name}" to ${contact.name}.`, state: s };
    }

    case "assign_to_user": {
      const { item_id } = args as { item_id: string };
      const item = s.items.find((i) => i.id === item_id);
      if (!item) return { result: `Error: item ${item_id} not found.`, state: s };
      if (!s.userItems.some((i) => i.id === item_id)) s.userItems.push(item);
      actions.push({ type: "assign_to_user", item_id });
      return { result: `Assigned "${item.name}" to you.`, state: s };
    }

    case "unassign_from_contact": {
      const { item_id, contact_id } = args as { item_id: string; contact_id: string };
      if (contact_id === "user") {
        const item = s.userItems.find((i) => i.id === item_id);
        s.userItems = s.userItems.filter((i) => i.id !== item_id);
        actions.push({ type: "unassign_from_contact", item_id, contact_id: "user" });
        return { result: `Removed "${item?.name ?? item_id}" from your items.`, state: s };
      }
      const contact = s.contacts.find((c) => c.id === contact_id);
      if (!contact) return { result: `Error: contact ${contact_id} not found.`, state: s };
      const item = contact.items.find((i) => i.id === item_id);
      contact.items = contact.items.filter((i) => i.id !== item_id);
      actions.push({ type: "unassign_from_contact", item_id, contact_id });
      return { result: `Removed "${item?.name ?? item_id}" from ${contact.name}.`, state: s };
    }

    case "split_item_between": {
      const { item_id, assignees } = args as { item_id: string; assignees: [string, string] };
      const item = s.items.find((i) => i.id === item_id);
      if (!item) return { result: `Error: item ${item_id} not found.`, state: s };

      // Simulate the split with deterministic placeholder IDs so GPT can reference them
      const half1Price = Math.ceil((item.price / 2) * 100) / 100;
      const half2Price = Math.floor((item.price / 2) * 100) / 100;
      const half1: ReceiptItem = { id: `${item_id}__split_0`, name: item.name, price: half1Price };
      const half2: ReceiptItem = { id: `${item_id}__split_1`, name: item.name, price: half2Price };

      const idx = s.items.findIndex((i) => i.id === item_id);
      s.items.splice(idx, 1, half1, half2);

      for (let i = 0; i < 2; i++) {
        const half = i === 0 ? half1 : half2;
        const assignee = assignees[i];
        if (assignee === "user") {
          s.userItems.push(half);
        } else {
          const contact = s.contacts.find((c) => c.id === assignee);
          if (contact) contact.items.push(half);
        }
      }

      actions.push({ type: "split_item_between", item_id, assignees });

      const nameFor = (id: string) =>
        id === "user" ? "you" : (s.contacts.find((c) => c.id === id)?.name ?? id);
      return {
        result: `Split "${item.name}" between ${nameFor(assignees[0])} and ${nameFor(assignees[1])}.`,
        state: s,
      };
    }

    default:
      return { result: `Unknown tool: ${name}`, state: s };
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY not set" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json() as {
      message: string;
      history?: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
      state: ReceiptState;
    };

    const { message, history = [], state } = body;

    if (!message?.trim() || !state) {
      return new Response(JSON.stringify({ error: "Missing message or state" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openai = new OpenAI({ apiKey });
    const actions: AgentAction[] = [];
    let currentState = state;

    // Build message thread
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: buildSystemPrompt(currentState) },
      ...history,
      { role: "user", content: message.trim() },
    ];

    // Agentic loop — run until GPT produces a terminal text response
    let iterations = 0;
    const MAX_ITERATIONS = 6;
    let finalReply = "";

    while (iterations < MAX_ITERATIONS) {
      iterations++;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        tools: TOOLS,
        tool_choice: "auto",
        temperature: 0.2,
        max_tokens: 400,
      });

      const choice = response.choices[0];
      const assistantMsg = choice.message;
      messages.push(assistantMsg as OpenAI.Chat.Completions.ChatCompletionMessageParam);

      // No more tool calls → we have the final reply
      if (choice.finish_reason === "stop" || !assistantMsg.tool_calls?.length) {
        finalReply = assistantMsg.content ?? "";
        break;
      }

      // Execute each tool call (simulated), collect actions
      for (const toolCall of assistantMsg.tool_calls) {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(toolCall.function.arguments);
        } catch {
          args = {};
        }

        const { result, state: newState } = simulateTool(
          toolCall.function.name,
          args,
          currentState,
          actions,
        );
        currentState = newState;

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        });
      }
    }

    return new Response(
      JSON.stringify({ reply: finalReply || "Done!", actions }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    console.error("[Agent] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
