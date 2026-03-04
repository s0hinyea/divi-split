import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import OpenAI from "npm:openai@4.28.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Manual auth verification (gateway JWT check is disabled via --no-verify-jwt)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: invalid or expired token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log(`[Edge Function] Authenticated user: ${user.id}`);
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
            `You are an expert receipt parser. Analyze receipt images and extract structured data.

CRITICAL REQUIREMENTS:
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
6. Verify your math: The sum of all item arrays + tax + tip MUST roughly equal the Total. If it does not, re-scan carefully.

RESPONSE FORMAT:
{
  "items": [
    {"id": "unique-id", "name": "Item Name", "price": 20.00, "quantity": 2}
  ],
  "tax": 2.50,
  "tip": 0,
  "total": 22.50
}`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Analyze this receipt image. Extract all purchased items into the array, and extract the tax, tip, and grand total separately. Do not guess; use exactly what is printed.",
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

    return new Response(
      JSON.stringify({
        items: expandedItems,
        tax: result.tax || 0,
        tip: result.tip || 0,
        total: result.total || 0,
        source: "openai-vision-edge",
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
