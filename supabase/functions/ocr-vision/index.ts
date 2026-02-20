import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import OpenAI from "npm:openai@4.28.0"
import { createClient } from "npm:@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing auth header' }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      })
    }

    // Initialize Supabase Client with the user's auth token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verify the user is authenticated securely
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized user' }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      })
    }

    const { image } = await req.json()
    if (!image || typeof image !== 'string' || !image.startsWith('data:image/')) {
       return new Response(JSON.stringify({ error: 'Invalid or missing image payload' }), { 
         status: 400, 
         headers: { ...corsHeaders, "Content-Type": "application/json" } 
       })
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    })

    console.log('[Edge Function] Relaying to OpenAI Vision API...')

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert receipt parser. Analyze receipt images and extract structured data.

CRITICAL REQUIREMENTS:
- Return valid JSON only
- For prices: Use only numbers (e.g., 12.99, not $12.99)
- For names: Clean text, remove extra characters and quantity prefixes
- For quantity: Extract the number of items if shown (e.g., "2 Burgers" = quantity 2)
- For tax: Single number representing total tax amount
- If quantity not specified, default to 1
- Price should be the LINE TOTAL (e.g., "2 Burgers $20.00" means price: 20.00, quantity: 2)
- If information is unclear, make best estimate

RESPONSE FORMAT:
{
  "items": [
    {"id": "unique-id", "name": "Item Name", "price": 20.00, "quantity": 2}
  ],
  "tax": 2.50,
  "tip": 0,
  "total": 22.50
}`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Parse this receipt and extract all menu items with their prices, plus tax amount. Return as JSON." },
            { type: "image_url", image_url: { url: image } }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.1,
      response_format: { type: "json_object" }
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')
    if (!result.items || !Array.isArray(result.items)) {
      throw new Error('Invalid response format: missing items array')
    }

    // Expand items based on quantity
    const expandedItems: any[] = []
    result.items.forEach((item: any, index: number) => {
        const quantity = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1
        const lineTotal = typeof item.price === 'number' ? item.price : 0
        const unitPrice = quantity > 1 ? lineTotal / quantity : lineTotal
        const itemName = item.name || `Item ${index + 1}`

        for (let i = 0; i < quantity; i++) {
            expandedItems.push({
                id: crypto.randomUUID(), // Deno Web API
                name: itemName,
                price: Math.round(unitPrice * 100) / 100
            })
        }
    })

    return new Response(
      JSON.stringify({
        items: expandedItems,
        tax: result.tax || 0,
        tip: result.tip || 0,
        total: result.total || 0,
        source: 'openai-vision-edge'
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (error: any) {
    console.error('OCR Edge Function Error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    })
  }
})
