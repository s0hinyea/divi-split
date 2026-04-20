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

    const { audio } = await req.json() as { audio: string };

    if (!audio) {
      return new Response(JSON.stringify({ error: "Missing audio" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decode base64 → Uint8Array → File
    const audioBytes = Uint8Array.from(atob(audio), (c) => c.charCodeAt(0));
    const audioFile = new File([audioBytes], "recording.m4a", { type: "audio/m4a" });

    const openai = new OpenAI({ apiKey });

    const transcription = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file: audioFile,
      language: "en",
    });

    return new Response(
      JSON.stringify({ transcript: transcription.text }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    console.error("[voice-transcribe] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
