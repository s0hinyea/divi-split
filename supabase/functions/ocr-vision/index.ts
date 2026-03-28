import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import OpenAI from "npm:openai@4.28.0";

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
            `You are an expert receipt parser. Your job is to analyze images and extract structured receipt data.

STEP 1 — VALIDATION:
First, determine if this image is an actual receipt, bill, or check from a restaurant/store.
- A valid receipt has printed item names with prices, and usually a total.
- If the image is NOT a receipt (e.g. a wall, a person, a menu without prices, a random document, a blank image), immediately return:
  {"is_receipt": false, "reason": "Brief explanation of what the image actually shows"}
- Do NOT attempt to extract items from non-receipt images. Do NOT hallucinate data.

STEP 2 — EXTRACTION (only if it IS a receipt):
If the image IS a valid receipt, set "is_receipt": true and extract the data:

1. Return valid JSON only, exactly matching the format below.
2. ITEMS: Extract EVERY individual item purchased (food, drinks). 
   - NEVER include "Subtotal", "Tax", "Tip", or "Total" as an item in the items array.
   - For names: Clean text, remove extra characters/symbols, but keep the item name descriptive.
   - For quantity: Extract the number of items if shown (e.g., "2x Burgers" = quantity 2). If not specified, default to 1.
   - Price MUST be the LINE TOTAL. (e.g., "2 Burgers @ 10.00 = 20.00" -> price: 20.00, quantity: 2).
   - Use only numbers for prices (e.g., 12.99, not $12.99).
3. TAX: Find the line explicitly labeled Tax (e.g. "Sales Tax", "Tax", "State Tax"). Enter the EXACT number. If no tax is found, use 0.
4. TIP/GRATUITY: Find lines labeled "Tip", "Gratuity", or "Service Charge". Sum them up. If none, use 0.
5. TOTAL: Find the Grand Total or Total. Enter the EXACT number.
6. Verify your math: The sum of all item prices + tax + tip MUST roughly equal the Total. If it does not, re-scan carefully.

RESPONSE FORMAT (valid receipt):
{
  "is_receipt": true,
  "items": [
    {"id": "unique-id", "name": "Item Name", "price": 20.00, "quantity": 2}
  ],
  "tax": 2.50,
  "tip": 0,
  "total": 22.50
}

RESPONSE FORMAT (not a receipt):
{
  "is_receipt": false,
  "reason": "Image shows a restaurant menu, not a receipt."
}`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Analyze this image. First determine if it is a receipt. If yes, extract all purchased items, tax, tip, and grand total. If not, explain what the image shows instead.",
            },
            { type: "image_url", image_url: { url: image } },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.1,
      response_format: { type: "json_object" },
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
