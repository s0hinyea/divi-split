import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import OpenAI from "npm:openai@4.60.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Types ─────────────────────────────────────────────────────────────────────

type ReceiptItem = { id: string; name: string; price: number };

type ResultState = {
  items: ReceiptItem[];
  tax: number;
  tip: number;
};

export type ResultAction =
  | { type: "add_item"; name: string; price: number }
  | { type: "edit_item"; id: string; name: string; price: number }
  | { type: "delete_item"; id: string }
  | { type: "set_tax"; amount: number }
  | { type: "set_tip"; amount: number }
  | { type: "split_item"; id: string };

// ── Tool definitions ──────────────────────────────────────────────────────────

const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "add_item",
      description: "Add a new item to the receipt.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "The item name" },
          price: { type: "number", description: "The item price in dollars (e.g. 12.50)" },
        },
        required: ["name", "price"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "edit_item",
      description: "Edit an existing item's name and/or price.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "Exact ID of the item to edit" },
          name: { type: "string", description: "The new name for the item" },
          price: { type: "number", description: "The new price in dollars" },
        },
        required: ["id", "name", "price"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_item",
      description: "Delete an item from the receipt.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "Exact ID of the item to delete" },
        },
        required: ["id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_tax",
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
      name: "set_tip",
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
      name: "split_item",
      description: "Split a receipt item evenly in half (creates two equal halves in place of the original).",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "Exact ID of the item to split" },
        },
        required: ["id"],
        additionalProperties: false,
      },
    },
  },
];

// ── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(state: ResultState): string {
  const fmtItems = (items: ReceiptItem[]) =>
    items.length > 0
      ? items.map((i) => `  • ${i.name} $${i.price.toFixed(2)} [id:${i.id}]`).join("\n")
      : "  (none)";

  const subtotal = state.items.reduce((s, i) => s + i.price, 0);
  const total = subtotal + state.tax + state.tip;

  return `You are Divi's receipt editor assistant. Help the user modify their receipt before splitting it with others.

CURRENT ITEMS:
${fmtItems(state.items)}

TAX: $${state.tax.toFixed(2)}
TIP: $${state.tip.toFixed(2)}
TOTAL: $${total.toFixed(2)}

WHAT YOU CAN DO:
- Add a new item → add_item
- Edit an item's name or price → edit_item
- Delete an item → delete_item
- Split an item evenly in half → split_item
- Update tax amount → set_tax
- Update tip amount → set_tip

RULES:
- Use EXACT item IDs from the list above — never invent IDs.
- Always call tools BEFORE responding. Confirm what you did in 1–2 short sentences.
- For edits, preserve the existing name or price if the user only specifies one of them.
- If something is ambiguous, ask for clarification before acting.`;
}

// ── Stateful tool simulation ──────────────────────────────────────────────────

function simulateTool(
  name: string,
  args: Record<string, unknown>,
  state: ResultState,
  actions: ResultAction[],
): { result: string; state: ResultState } {
  const s: ResultState = {
    items: state.items.map((i) => ({ ...i })),
    tax: state.tax,
    tip: state.tip,
  };

  switch (name) {
    case "add_item": {
      const { name: itemName, price } = args as { name: string; price: number };
      const newItem: ReceiptItem = { id: `new_${Date.now()}`, name: itemName, price };
      s.items.push(newItem);
      actions.push({ type: "add_item", name: itemName, price });
      return { result: `Added "${itemName}" at $${price.toFixed(2)}.`, state: s };
    }

    case "edit_item": {
      const { id, name: newName, price: newPrice } = args as { id: string; name: string; price: number };
      const item = s.items.find((i) => i.id === id);
      if (!item) return { result: `Error: item ${id} not found.`, state: s };
      const oldName = item.name;
      item.name = newName;
      item.price = newPrice;
      actions.push({ type: "edit_item", id, name: newName, price: newPrice });
      return { result: `Updated "${oldName}" → "${newName}" at $${newPrice.toFixed(2)}.`, state: s };
    }

    case "delete_item": {
      const { id } = args as { id: string };
      const item = s.items.find((i) => i.id === id);
      if (!item) return { result: `Error: item ${id} not found.`, state: s };
      s.items = s.items.filter((i) => i.id !== id);
      actions.push({ type: "delete_item", id });
      return { result: `Deleted "${item.name}".`, state: s };
    }

    case "set_tax": {
      const { amount } = args as { amount: number };
      s.tax = amount;
      actions.push({ type: "set_tax", amount });
      return { result: `Tax set to $${amount.toFixed(2)}.`, state: s };
    }

    case "set_tip": {
      const { amount } = args as { amount: number };
      s.tip = amount;
      actions.push({ type: "set_tip", amount });
      return { result: `Tip set to $${amount.toFixed(2)}.`, state: s };
    }

    case "split_item": {
      const { id } = args as { id: string };
      const item = s.items.find((i) => i.id === id);
      if (!item) return { result: `Error: item ${id} not found.`, state: s };
      if (item.price <= 0.01) return { result: `Error: "${item.name}" is too small to split.`, state: s };
      const half1Price = Math.ceil((item.price / 2) * 100) / 100;
      const half2Price = Math.floor((item.price / 2) * 100) / 100;
      const idx = s.items.findIndex((i) => i.id === id);
      s.items.splice(idx, 1,
        { id: `${id}__split_0`, name: item.name, price: half1Price },
        { id: `${id}__split_1`, name: item.name, price: half2Price },
      );
      actions.push({ type: "split_item", id });
      return { result: `Split "${item.name}" into two halves ($${half1Price.toFixed(2)} and $${half2Price.toFixed(2)}).`, state: s };
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
      state: ResultState;
    };

    const { message, history = [], state } = body;

    if (!message?.trim() || !state) {
      return new Response(JSON.stringify({ error: "Missing message or state" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openai = new OpenAI({ apiKey });
    const actions: ResultAction[] = [];
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
    console.error("[ResultAgent] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
