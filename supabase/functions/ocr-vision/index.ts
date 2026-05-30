import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import OpenAI from "npm:openai@4.60.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("[OCR] No valid Authorization header");
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // The Supabase Edge Runtime gateway already verified the JWT signature.
    // We just need to extract the user ID from the payload.
    const token = authHeader.replace("Bearer ", "");
    let userId: string;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      userId = payload.sub;
      if (!userId) throw new Error("No sub claim in JWT");
    } catch (e) {
      console.error("[OCR] Failed to decode JWT:", e);
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log(`[Edge Function] Authenticated user: ${userId}`);
    const { image } = await req.json();
    if (
      !image || typeof image !== "string" || !image.startsWith("data:image/")
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing image payload" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Initialize OpenAI
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      console.error("OPENAI_API_KEY secret is not set!");
      return new Response(
        JSON.stringify({
          error:
            "Server configuration error: OPENAI_API_KEY is not set. Set it via `supabase secrets set OPENAI_API_KEY=sk-...`",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const openai = new OpenAI({
      apiKey,
    });

    console.log("[Edge Function] Relaying to OpenAI Vision API...");

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            `You are an expert receipt parser. Analyze the image and extract structured receipt data according to the schema.
- If the image is NOT a valid receipt (e.g. a person, wall, blank image), set is_receipt to false.
- Do NOT include 'Subtotal', 'Tax', 'Tip', or 'Total' as items.
- Price MUST be the LINE TOTAL for that item.
- Categorize every item: drink (any beverage), appetizer (starters/small plates), entree (main courses), side (fries/rice/extras), dessert (sweets), other (fees/add-ons/unclear).`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all purchased items, tax, tip, and grand total.",
            },
            { type: "image_url", image_url: { url: image } },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.1,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "receipt_extraction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              is_receipt: { type: "boolean", description: "True if image is a valid receipt." },
              reason: { type: "string", description: "If is_receipt is false, briefly explain what the image is." },
              items: {
                type: "array",
                description: "Every individual item purchased. NEVER include Subtotal, Tax, Tip, or Total.",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string", description: "Cleaned item name" },
                    price: { type: "number", description: "The LINE TOTAL using only numbers" },
                    quantity: { type: "number", description: "The number of items shown. Default 1" },
                    category: {
                      type: "string",
                      enum: ["drink", "appetizer", "entree", "dessert", "side", "other"],
                      description: "Categorize the item into one of the allowed types. Use 'other' if unclear or for fees/upcharges."
                    }
                  },
                  required: ["id", "name", "price", "quantity", "category"],
                  additionalProperties: false
                }
              },
              tax: { type: "number", description: "Exact tax amount. 0 if none." },
              tip: { type: "number", description: "Exact tip amount. 0 if none." },
              total: { type: "number", description: "The grand total. 0 if none." }
            },
            required: ["is_receipt", "reason", "items", "tax", "tip", "total"],
            additionalProperties: false
          }
        }
      },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    const usage = response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    
    // Cost calculation (gpt-4o-mini: $0.150/1M input, $0.600/1M output)
    const costInCents = ((usage.prompt_tokens / 1_000_000) * 0.15 + (usage.completion_tokens / 1_000_000) * 0.60) * 100;
    console.log(`[OCR] Usage: ${usage.total_tokens} tokens | Cost: ¢${costInCents.toFixed(4)}`);

    // ── Receipt validation gate ─────────────────────────────
    if (result.is_receipt === false) {
      console.log(`[OCR] Not a receipt: ${result.reason}`);
      return new Response(
        JSON.stringify({ 
          error: "NOT_RECEIPT", 
          reason: result.reason || "This image does not appear to be a receipt." 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!result.items || !Array.isArray(result.items)) {
      throw new Error("Invalid response format: missing items array");
    }

    // Expand items based on quantity
    const expandedItems: any[] = [];
    result.items.forEach((item: any, index: number) => {
      const quantity = typeof item.quantity === "number" && item.quantity > 0
        ? item.quantity
        : 1;
      const lineTotal = typeof item.price === "number" ? item.price : 0;
      const unitPrice = quantity > 1 ? lineTotal / quantity : lineTotal;
      const itemName = item.name || `Item ${index + 1}`;

      for (let i = 0; i < quantity; i++) {
        expandedItems.push({
          id: crypto.randomUUID(), // Deno Web API
          name: itemName,
          price: Math.round(unitPrice * 100) / 100,
          category: item.category ?? "other",
        });
      }
    });

    // ── Math validation ──────────────────────────────────────
    const itemsSum = expandedItems.reduce((sum: number, item: any) => sum + item.price, 0);
    const computedTotal = itemsSum + (result.tax || 0) + (result.tip || 0);
    const reportedTotal = result.total || 0;
    const discrepancy = reportedTotal > 0
      ? Math.abs(computedTotal - reportedTotal) / reportedTotal
      : 0;

    // If items + tax + tip differs from reported total by >10%, flag it
    const confidence = discrepancy > 0.10 ? "low" : "high";
    if (confidence === "low") {
      console.warn(
        `[OCR] Math mismatch: items(${itemsSum.toFixed(2)}) + tax(${(result.tax || 0).toFixed(2)}) + tip(${(result.tip || 0).toFixed(2)}) = ${computedTotal.toFixed(2)}, but total = ${reportedTotal.toFixed(2)} (${(discrepancy * 100).toFixed(1)}% off)`
      );
    }

    return new Response(
      JSON.stringify({
        items: expandedItems,
        tax: result.tax || 0,
        tip: result.tip || 0,
        total: result.total || 0,
        confidence,
        source: "openai-vision-edge",
        usage: {
          totalTokens: usage.total_tokens,
          costCents: costInCents,
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("OCR Edge Function Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
