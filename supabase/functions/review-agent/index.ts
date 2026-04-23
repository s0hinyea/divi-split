import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import OpenAI from "npm:openai@4.60.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Types ─────────────────────────────────────────────────────────────────────

type ReceiptItem = { id: string; name: string; price: number };
type ContactState = { id: string; name: string; items: ReceiptItem[] };

type ReviewState = {
  receiptName: string;
  receiptDate: string;
  contacts: ContactState[];
  userItems: ReceiptItem[];
  tax: number;
  tip: number;
  total: number;
};

type ReviewAction =
  | { type: "set_receipt_name"; name: string }
  | { type: "set_receipt_date"; date: string }
  | { type: "rename_contact"; contact_id: string; new_name: string }
  | { type: "update_tax"; amount: number }
  | { type: "update_tip"; amount: number }
  | { type: "move_item"; item_id: string; from_contact_id: string; to_contact_id: string }
  | { type: "trigger_dispatch" };

// ── Tool definitions ──────────────────────────────────────────────────────────

const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "set_receipt_name",
      description: "Update the receipt name.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "The new receipt name" },
        },
        required: ["name"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_receipt_date",
      description: "Update the receipt date.",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "ISO date string YYYY-MM-DD (e.g. 2024-03-15)" },
        },
        required: ["date"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "rename_contact",
      description: "Rename a contact in the split.",
      parameters: {
        type: "object",
        properties: {
          contact_id: { type: "string", description: "Exact ID of the contact to rename" },
          new_name: { type: "string", description: "The new name for the contact" },
        },
        required: ["contact_id", "new_name"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_tax",
      description: "Set the tax amount for the receipt.",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number", description: "Tax amount in dollars (e.g. 4.50)" },
        },
        required: ["amount"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_tip",
      description: "Set the tip amount for the receipt.",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number", description: "Tip amount in dollars (e.g. 8.00)" },
        },
        required: ["amount"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "move_item",
      description:
        "Move a receipt item from one person to another. Use 'user' for the current user.",
      parameters: {
        type: "object",
        properties: {
          item_id: { type: "string", description: "Exact ID of the item to move" },
          from_contact_id: {
            type: "string",
            description: "ID of the current owner, or 'user' for the current user",
          },
          to_contact_id: {
            type: "string",
            description: "ID of the new owner, or 'user' for the current user",
          },
        },
        required: ["item_id", "from_contact_id", "to_contact_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "trigger_dispatch",
      description:
        "Send the split summary to all contacts via SMS and complete the receipt split.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
];

// ── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(state: ReviewState): string {
  const fmtItems = (items: ReceiptItem[]) =>
    items.length > 0
      ? items.map((i) => `    • ${i.name} $${i.price.toFixed(2)} [id:${i.id}]`).join("\n")
      : "    (none)";

  const contactBlock = state.contacts
    .map((c) => `  ${c.name} [id:${c.id}]\n${fmtItems(c.items)}`)
    .join("\n");

  return `You are Divi's review assistant. Help the user finalize their receipt split before sending.

RECEIPT: "${state.receiptName || "(unnamed)"}" | Date: ${state.receiptDate}
TOTALS: $${state.total.toFixed(2)} total | tax $${state.tax.toFixed(2)} | tip $${state.tip.toFixed(2)}

CONTACTS AND THEIR CURRENT ITEMS:
${contactBlock || "  (no contacts)"}

CURRENT USER'S ITEMS:
${fmtItems(state.userItems)}

WHAT YOU CAN DO:
- Rename the receipt → set_receipt_name
- Change the date → set_receipt_date (ISO format YYYY-MM-DD)
- Rename a contact → rename_contact
- Adjust tax or tip amounts → update_tax / update_tip
- Move an item between people → move_item
- Send the summary and finish → trigger_dispatch

RULES:
- Use EXACT item IDs and contact IDs from the lists above — never invent IDs.
- "me", "I", "myself", "my" → use 'user' as the contact ID.
- Always call tools BEFORE responding in text. Confirm what you did in 1–2 short sentences.
- If the user says "send", "dispatch", "done", "finish", or "go" → call trigger_dispatch.
- If something is ambiguous, ask for clarification before acting.`;
}

// ── Stateful tool simulation ──────────────────────────────────────────────────

function simulateTool(
  name: string,
  args: Record<string, unknown>,
  state: ReviewState,
  actions: ReviewAction[],
): { result: string; state: ReviewState } {
  const s: ReviewState = {
    ...state,
    contacts: state.contacts.map((c) => ({ ...c, items: c.items.map((i) => ({ ...i })) })),
    userItems: state.userItems.map((i) => ({ ...i })),
  };

  switch (name) {
    case "set_receipt_name": {
      const { name: newName } = args as { name: string };
      s.receiptName = newName;
      actions.push({ type: "set_receipt_name", name: newName });
      return { result: `Receipt renamed to "${newName}".`, state: s };
    }

    case "set_receipt_date": {
      const { date } = args as { date: string };
      s.receiptDate = date;
      actions.push({ type: "set_receipt_date", date });
      return { result: `Receipt date updated to ${date}.`, state: s };
    }

    case "rename_contact": {
      const { contact_id, new_name } = args as { contact_id: string; new_name: string };
      const contact = s.contacts.find((c) => c.id === contact_id);
      if (!contact) return { result: `Error: contact ${contact_id} not found.`, state: s };
      const oldName = contact.name;
      contact.name = new_name;
      actions.push({ type: "rename_contact", contact_id, new_name });
      return { result: `Renamed "${oldName}" to "${new_name}".`, state: s };
    }

    case "update_tax": {
      const { amount } = args as { amount: number };
      s.tax = amount;
      actions.push({ type: "update_tax", amount });
      return { result: `Tax set to $${amount.toFixed(2)}.`, state: s };
    }

    case "update_tip": {
      const { amount } = args as { amount: number };
      s.tip = amount;
      actions.push({ type: "update_tip", amount });
      return { result: `Tip set to $${amount.toFixed(2)}.`, state: s };
    }

    case "move_item": {
      const { item_id, from_contact_id, to_contact_id } = args as {
        item_id: string;
        from_contact_id: string;
        to_contact_id: string;
      };

      let item: ReceiptItem | undefined;

      if (from_contact_id === "user") {
        item = s.userItems.find((i) => i.id === item_id);
        s.userItems = s.userItems.filter((i) => i.id !== item_id);
      } else {
        const fromContact = s.contacts.find((c) => c.id === from_contact_id);
        if (!fromContact)
          return { result: `Error: contact ${from_contact_id} not found.`, state: s };
        item = fromContact.items.find((i) => i.id === item_id);
        fromContact.items = fromContact.items.filter((i) => i.id !== item_id);
      }

      if (!item) return { result: `Error: item ${item_id} not found on ${from_contact_id}.`, state: s };

      if (to_contact_id === "user") {
        s.userItems.push(item);
      } else {
        const toContact = s.contacts.find((c) => c.id === to_contact_id);
        if (!toContact)
          return { result: `Error: contact ${to_contact_id} not found.`, state: s };
        toContact.items.push(item);
      }

      actions.push({ type: "move_item", item_id, from_contact_id, to_contact_id });

      const nameFor = (id: string) =>
        id === "user" ? "you" : (s.contacts.find((c) => c.id === id)?.name ?? id);
      return {
        result: `Moved "${item.name}" from ${nameFor(from_contact_id)} to ${nameFor(to_contact_id)}.`,
        state: s,
      };
    }

    case "trigger_dispatch": {
      actions.push({ type: "trigger_dispatch" });
      return { result: "Triggering dispatch — sending the split summary.", state: s };
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

    const body = (await req.json()) as {
      message: string;
      history?: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
      state: ReviewState;
    };

    const { message, history = [], state } = body;

    if (!message?.trim() || !state) {
      return new Response(JSON.stringify({ error: "Missing message or state" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openai = new OpenAI({ apiKey });
    const actions: ReviewAction[] = [];
    let currentState = state;

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: buildSystemPrompt(currentState) },
      ...history,
      { role: "user", content: message.trim() },
    ];

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

      if (choice.finish_reason === "stop" || !assistantMsg.tool_calls?.length) {
        finalReply = assistantMsg.content ?? "";
        break;
      }

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

    return new Response(JSON.stringify({ reply: finalReply || "Done!", actions }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    console.error("[ReviewAgent] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
