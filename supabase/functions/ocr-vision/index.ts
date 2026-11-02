import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import OpenAI from "npm:openai@4.60.0";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const FREE_SCAN_LIMIT = 5;
const MAX_REQUEST_BYTES = 8_000_000;
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function readLimitedJson(req: Request): Promise<unknown> {
  const reader = req.body?.getReader();
  if (!reader) throw new Error("INVALID_IMAGE_PAYLOAD");
  const decoder = new TextDecoder();
  let body = "";
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_REQUEST_BYTES) {
      await reader.cancel();
      throw new Error("IMAGE_TOO_LARGE");
    }
    body += decoder.decode(value, { stream: true });
  }
  body += decoder.decode();
  try {
    return JSON.parse(body);
  } catch {
    throw new Error("INVALID_IMAGE_PAYLOAD");
  }
}

async function hasActivePro(userId: string): Promise<boolean> {
  const secret = Deno.env.get("REVENUECAT_SECRET_API_KEY");
  if (!secret) throw new Error("Subscription verification is not configured");
  const response = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`,
    {
      headers: {
        Authorization: `Bearer ${secret}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(8000),
    },
  );
  if (!response.ok) {
    throw new Error(`Subscription verification failed (${response.status})`);
  }
  const customer = await response.json();
  const entitlement = customer?.subscriber?.entitlements?.["Divi Pro"];
  if (!entitlement) return false;
  const expiry = entitlement.expires_date;
  const graceExpiry = entitlement.grace_period_expires_date;
  return expiry === null ||
    (typeof expiry === "string" && Date.parse(expiry) > Date.now()) ||
    (typeof graceExpiry === "string" && Date.parse(graceExpiry) > Date.now());
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let reservation: { userId: string; id: string } | null = null;
  let committed = false;
  try {
    if (req.method !== "GET" && req.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }
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

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      token,
    );
    if (authError || !user) {
      console.error("[OCR] Invalid JWT:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    if (req.method === "POST") {
      const rate = await admin.rpc("allow_scan_request", {
        p_user_id: user.id,
      });
      if (rate.error) throw new Error("Could not check scan rate");
      if (!rate.data) return json({ error: "SCAN_RATE_LIMITED" }, 429);
    }
    const [isPro, quotaResult] = await Promise.all([
      hasActivePro(user.id),
      admin.rpc("scan_quota_status", { p_user_id: user.id }),
    ]);
    if (quotaResult.error || typeof quotaResult.data !== "number") {
      throw new Error("Could not check scan allowance");
    }
    if (req.method === "GET") {
      return json({
        isPro,
        scansUsed: quotaResult.data,
        scansRemaining: isPro
          ? null
          : Math.max(0, FREE_SCAN_LIMIT - quotaResult.data),
        freeScanLimit: FREE_SCAN_LIMIT,
      });
    }
    if (!isPro && quotaResult.data >= FREE_SCAN_LIMIT) {
      return json({ error: "SCAN_LIMIT_REACHED", scansRemaining: 0 }, 403);
    }
    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > MAX_REQUEST_BYTES) {
      return json({ error: "Image is too large" }, 413);
    }
    const payload = await readLimitedJson(req);
    const image = (payload && typeof payload === "object" && "image" in payload)
      ? payload.image
      : null;
    if (
      !image || typeof image !== "string" ||
      !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(image)
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing image payload" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    if (image.length > MAX_REQUEST_BYTES) {
      return json({ error: "Image is too large" }, 413);
    }

    if (!isPro) {
      const claim = await admin.rpc("reserve_free_scan", {
        p_user_id: user.id,
      });
      if (claim.error) throw new Error("Could not reserve a free scan");
      if (!claim.data) {
        return json({ error: "SCAN_LIMIT_REACHED", scansRemaining: 0 }, 403);
      }
      reservation = { userId: user.id, id: claim.data };
    }

    // Initialize OpenAI
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      console.error("OPENAI_API_KEY secret is not set!");
      return new Response(
        JSON.stringify({
          error: "Scanning is temporarily unavailable",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const openai = new OpenAI({ apiKey, timeout: 45000, maxRetries: 0 });

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
- Price MUST be the LINE TOTAL (the total cost for all units of that item combined), never the unit price.
- Quantity rules: A number printed BEFORE or AFTER an item name is the quantity purchased. Set the quantity field to that number. NEVER duplicate an item in the array to represent quantity — use the quantity field instead. Example: "2 APPLE 1.00" means quantity=2, price=1.00 (line total). "APPLE x2 1.00" also means quantity=2, price=1.00. If no quantity is shown, set quantity to 1.
- The total, tax, and tip fields MUST be copied from the printed text on the receipt. Do NOT compute or estimate them from the items — read the exact numbers printed next to the words "Total", "Tax", and "Tip". If a field is not printed, use 0.
- Categorize every item: drink (any beverage), appetizer (starters/small plates), entree (main courses), side (fries/rice/extras), dessert (sweets), other (fees/add-ons/unclear).`,
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
      max_tokens: 2000,
      temperature: 0.1,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "receipt_extraction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              is_receipt: {
                type: "boolean",
                description: "True if image is a valid receipt.",
              },
              reason: {
                type: "string",
                description:
                  "If is_receipt is false, briefly explain what the image is.",
              },
              items: {
                type: "array",
                description:
                  "Every individual item purchased. NEVER include Subtotal, Tax, Tip, or Total.",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string", description: "Cleaned item name" },
                    price: {
                      type: "number",
                      description: "The LINE TOTAL using only numbers",
                    },
                    quantity: {
                      type: "number",
                      description: "The number of items shown. Default 1",
                    },
                    category: {
                      type: "string",
                      enum: [
                        "drink",
                        "appetizer",
                        "entree",
                        "dessert",
                        "side",
                        "other",
                      ],
                      description:
                        "Categorize the item into one of the allowed types. Use 'other' if unclear or for fees/upcharges.",
                    },
                  },
                  required: ["id", "name", "price", "quantity", "category"],
                  additionalProperties: false,
                },
              },
              tax: {
                type: "number",
                description: "Exact tax amount. 0 if none.",
              },
              tip: {
                type: "number",
                description: "Exact tip amount. 0 if none.",
              },
              total: {
                type: "number",
                description: "The grand total. 0 if none.",
              },
            },
            required: ["is_receipt", "reason", "items", "tax", "tip", "total"],
            additionalProperties: false,
          },
        },
      },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    const usage = response.usage ||
      { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    // Cost calculation (gpt-4o-mini: $0.150/1M input, $0.600/1M output)
    const costInCents = ((usage.prompt_tokens / 1_000_000) * 0.15 +
      (usage.completion_tokens / 1_000_000) * 0.60) * 100;
    console.log(
      `[OCR] Usage: ${usage.total_tokens} tokens | Cost: ¢${
        costInCents.toFixed(4)
      }`,
    );

    // ── Receipt validation gate ─────────────────────────────
    if (result.is_receipt === false) {
      console.log(`[OCR] Not a receipt: ${result.reason}`);
      return new Response(
        JSON.stringify({
          error: "NOT_RECEIPT",
          reason: result.reason ||
            "This image does not appear to be a receipt.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!Array.isArray(result.items) || result.items.length > 200) {
      throw new Error("Invalid response format: missing items array");
    }

    // Expand items based on quantity
    const expandedItems: {
      id: string;
      name: string;
      price: number;
      category: string;
    }[] = [];
    result.items.forEach(
      (
        item: {
          quantity?: number;
          price?: number;
          name?: string;
          category?: string;
        },
        index: number,
      ) => {
        const quantity =
          Number.isInteger(item.quantity) && item.quantity! > 0 &&
            item.quantity! <= 100
            ? item.quantity!
            : 1;
        const lineTotal =
          typeof item.price === "number" && Number.isFinite(item.price) &&
            item.price >= 0
            ? item.price
            : 0;
        const unitPrice = quantity > 1 ? lineTotal / quantity : lineTotal;
        const itemName = typeof item.name === "string"
          ? item.name.slice(0, 120)
          : `Item ${index + 1}`;

        for (let i = 0; i < quantity; i++) {
          if (expandedItems.length >= 200) break;
          expandedItems.push({
            id: crypto.randomUUID(), // Deno Web API
            name: itemName,
            price: Math.round(unitPrice * 100) / 100,
            category: item.category ?? "other",
          });
        }
      },
    );
    if (
      expandedItems.length === 0 ||
      expandedItems.every((item) => item.price <= 0)
    ) {
      return json({ error: "NO_ITEMS" }, 422);
    }

    // ── Duplicate name detection ─────────────────────────────
    // If the AI listed the same item multiple times with qty=1 instead of
    // using the quantity field, the name count will exceed 1. Flag as low
    // confidence regardless of whether the math check passes.
    const nameCounts = new Map<string, number>();
    for (const item of expandedItems) {
      const key = item.name.toLowerCase().trim();
      nameCounts.set(key, (nameCounts.get(key) ?? 0) + 1);
    }
    const hasDuplicateNames = [...nameCounts.values()].some((n) => n > 1);
    if (hasDuplicateNames) {
      const dupes = [...nameCounts.entries()]
        .filter(([, n]) => n > 1)
        .map(([name, n]) => `${name}×${n}`)
        .join(", ");
      console.warn(`[OCR] Duplicate item names detected: ${dupes}`);
    }

    // ── Math validation ──────────────────────────────────────
    const itemsSum = expandedItems.reduce(
      (sum, item) => sum + item.price,
      0,
    );
    const computedTotal = itemsSum + (result.tax || 0) + (result.tip || 0);
    const reportedTotal = result.total || 0;
    const discrepancy = reportedTotal > 0
      ? Math.abs(computedTotal - reportedTotal) / reportedTotal
      : 0;

    // Flag low confidence if math is off by >10% OR duplicate names were found
    const confidence = (discrepancy > 0.10 || hasDuplicateNames) ? "low" : "high";
    if (confidence === "low") {
      console.warn(
        `[OCR] Low confidence — math mismatch: items(${itemsSum.toFixed(2)}) + tax(${
          (result.tax || 0).toFixed(2)
        }) + tip(${(result.tip || 0).toFixed(2)}) = ${
          computedTotal.toFixed(2)
        }, reported total = ${reportedTotal.toFixed(2)} (${
          (discrepancy * 100).toFixed(1)
        }% off), duplicates=${hasDuplicateNames}`,
      );
    }

    if (reservation) {
      const finish = await admin.rpc("finish_free_scan", {
        p_user_id: reservation.userId,
        p_attempt_id: reservation.id,
        p_success: true,
      });
      if (finish.error || finish.data !== true) {
        throw new Error("Could not complete scan allowance update");
      }
      committed = true;
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
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: unknown) {
    console.error("OCR Edge Function Error:", error);
    if (error instanceof Error && error.message === "IMAGE_TOO_LARGE") {
      return json({ error: "Image is too large" }, 413);
    }
    if (error instanceof Error && error.message === "INVALID_IMAGE_PAYLOAD") {
      return json({ error: "Invalid image payload" }, 400);
    }
    return json({
      error: "Scanning is temporarily unavailable. Please try again.",
    }, 503);
  } finally {
    if (reservation && !committed) {
      try {
        const admin = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );
        await admin.rpc("finish_free_scan", {
          p_user_id: reservation.userId,
          p_attempt_id: reservation.id,
          p_success: false,
        });
      } catch (error) {
        console.error("Could not release scan reservation:", error);
      }
    }
  }
});
