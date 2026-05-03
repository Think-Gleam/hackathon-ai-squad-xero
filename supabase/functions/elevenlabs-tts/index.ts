const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_TEXT_LENGTH = 5000;

function getApiKey(): string {
  const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
  if (!apiKey) {
    throw new Error("Missing ELEVENLABS_API_KEY");
  }
  return apiKey;
}

function getAzureConfig() {
  const endpoint = Deno.env.get("AZURE_SPEECH_ENDPOINT")?.trim();
  const key = Deno.env.get("AZURE_SPEECH_KEY")?.trim();
  const region = Deno.env.get("AZURE_SPEECH_REGION")?.trim();
  return { endpoint, key, region };
}

function buildSsml(text: string, language?: string) {
  const normalizedLanguage = language === "urdu" ? "ur-PK" : language === "bilingual" ? "en-US" : "en-US";
  const voiceName = normalizedLanguage === "ur-PK" ? "ur-PK-UzmaNeural" : "en-US-JennyNeural";

  return `<speak version='1.0' xml:lang='${normalizedLanguage}'><voice xml:lang='${normalizedLanguage}' name='${voiceName}'>${text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</voice></speak>`;
}

async function synthesizeWithAzure(text: string, language?: string) {
  const { endpoint, key, region } = getAzureConfig();
  if (!endpoint || !key) {
    throw new Error("Azure Speech is not configured");
  }

  const azureUrl = endpoint.endsWith("/") ? `${endpoint}cognitiveservices/v1` : `${endpoint}/cognitiveservices/v1`;
  const headers: Record<string, string> = {
    "Content-Type": "application/ssml+xml",
    "Ocp-Apim-Subscription-Key": key,
    "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
    "User-Agent": "EduMentor-Voice",
  };

  if (region) {
    headers["Ocp-Apim-Subscription-Region"] = region;
  }

  const response = await fetch(azureUrl, {
    method: "POST",
    headers,
    body: buildSsml(text, language),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.arrayBuffer();
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

  let payload: { text?: string; voiceId?: string; modelId?: string; language?: "english" | "urdu" | "bilingual" };
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
    try {
      const azureAudio = await synthesizeWithAzure(text, payload.language);
      return new Response(azureAudio, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/octet-stream",
          "Cache-Control": "no-store",
          "X-Voice-Provider": "azure",
        },
      });
    } catch {
      return new Response(JSON.stringify({ error: "Voice providers unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  let audioBytes: ArrayBuffer;
  let provider = "elevenlabs";

  try {
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
      throw new Error(await response.text());
    }

    audioBytes = await response.arrayBuffer();
  } catch {
    try {
      audioBytes = await synthesizeWithAzure(text, payload.language);
      provider = "azure";
    } catch {
      return new Response(JSON.stringify({ error: "TTS generation failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response(audioBytes, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/octet-stream",
      "Cache-Control": "no-store",
      "X-Voice-Provider": provider,
    },
  });
});
