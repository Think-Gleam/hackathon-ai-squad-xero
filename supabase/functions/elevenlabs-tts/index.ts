import { corsHeaders } from "@supabase/supabase-js/cors";

const MAX_TEXT_LENGTH = 5000;

function getApiKey(): string {
  const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
  if (!apiKey) {
    throw new Error("Missing ELEVENLABS_API_KEY");
  }
  return apiKey;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: { text?: string; voiceId?: string; modelId?: string };
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const text = payload.text?.trim();
  const voiceId = payload.voiceId?.trim();
  const modelId = payload.modelId?.trim() || "eleven_multilingual_v2";

  if (!text || text.length > MAX_TEXT_LENGTH) {
    return new Response(JSON.stringify({ error: `text is required and must be 1-${MAX_TEXT_LENGTH} chars` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!voiceId) {
    return new Response(JSON.stringify({ error: "voiceId is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let apiKey = "";
  try {
    apiKey = getApiKey();
  } catch {
    return new Response(JSON.stringify({ error: "Server missing ElevenLabs key" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.35,
          use_speaker_boost: true,
          speed: 1,
        },
      }),
    },
  );

  if (!response.ok) {
    const err = await response.text();
    return new Response(JSON.stringify({ error: err || "TTS generation failed" }), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const audioBytes = await response.arrayBuffer();

  return new Response(audioBytes, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/octet-stream",
      "Cache-Control": "no-store",
    },
  });
});
