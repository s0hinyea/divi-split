import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import OpenAI from "npm:openai@4.60.0";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ReceiptItem = { id: string; name: string; price: number };
type Contact = { id: string; name: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY not set" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json() as {
      transcript: string;
      items: ReceiptItem[];
      contacts: Contact[];
    };

    const { transcript, items, contacts } = body;

    if (!transcript?.trim() || !items || !contacts) {
      return new Response(JSON.stringify({ error: "Missing transcript, items, or contacts" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Server-side sanitization: strip anything outside safe name characters,
    // truncate long names, enforce contact cap. Defense in depth on top of client.
    const safeContacts: Contact[] = contacts
      .slice(0, 500)
      .map((c) => ({
        id: c.id,
        name: c.name.slice(0, 60).replace(/[^a-zA-Z0-9\s\-'.\u00C0-\u024F]/g, "").trim(),
      }))
      .filter((c) => c.name.length > 0);

    const safeItems: ReceiptItem[] = items
      .slice(0, 200)
      .map((i) => ({
        id: i.id,
        name: i.name.slice(0, 80),
        price: Math.max(0, Number(i.price) || 0),
      }));

    const fmtItems = safeItems.length > 0
      ? safeItems.map((i) => `  [${i.id}] ${i.name} $${i.price.toFixed(2)}`).join("\n")
      : "  (none)";

    const fmtContacts = safeContacts.length > 0
      ? safeContacts.map((c) => `  [${c.id}] ${c.name}`).join("\n")
      : "  (none)";

    const systemPrompt = `You are Divi's bill splitting assistant. The user scanned a receipt and will tell you verbally who is splitting the bill and who got what items.

RECEIPT ITEMS (use exact IDs):
${fmtItems}

CONTACTS (use exact IDs):
${fmtContacts}

"I", "me", "myself", or "I'll take" refers to the bill payer (not in the contacts list).

Parse the user's statement and return ONLY a JSON object with this exact structure:
{
  "selected_contact_ids": ["contact_id_1", "contact_id_2"],
  "assignments": [
    { "contact_id": "contact_id_1", "item_ids": ["item_id_a", "item_id_b"] },
    { "contact_id": "contact_id_2", "item_ids": ["item_id_c"] }
  ],
  "user_item_ids": ["item_id_d"],
  "receipt_corrections": [
    { "action": "edit", "id": "item_id", "name": "corrected name", "price": 12.50 },
    { "action": "add", "name": "missing item", "price": 5.00 },
    { "action": "delete", "id": "item_id" }
  ],
  "unmatched_names": ["name that didnt match any contact"]
}

RULES:
- selected_contact_ids: every contact mentioned by the user (excluding "me/I")
- assignments: only include entries where the user explicitly assigned items to someone
- user_item_ids: item IDs the user assigned to themselves
- receipt_corrections: only when user explicitly says to fix an item (rename, add missing, remove wrong)
- unmatched_names: names spoken that did not match any contact in the list
- Fuzzy name matching: "Mike" can match "Michael Johnson", "Alex" matches "Alexandra Kim", nicknames OK
- If ambiguous between two contacts, pick the closest match and leave out of unmatched_names
- Return empty arrays [] for sections with no data, never null
- Do not invent contact IDs or item IDs — only use exact IDs from the lists above`;

    const startedAt = Date.now();
    const openai = new OpenAI({ apiKey });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: transcript.trim().slice(0, 500) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 800,
    });

    const content = response.choices[0].message.content ?? "{}";
    let result: Record<string, unknown>;
    try {
      result = JSON.parse(content);
    } catch {
      result = {};
    }

    return new Response(
      JSON.stringify({ ...result, duration_ms: Date.now() - startedAt }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    console.error("[OrchestratorAgent] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
