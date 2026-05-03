const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Message = { role: "user" | "assistant"; content: string };

const sanitizeMessages = (messages: unknown): Message[] => {
  if (!Array.isArray(messages)) return [];

  return messages
    .map((entry) => {
      const role = (entry as any)?.role;
      const content = (entry as any)?.content;
      if ((role === "user" || role === "assistant") && typeof content === "string" && content.trim()) {
        return { role, content: content.trim().slice(0, 2000) } as Message;
      }
      return null;
    })
    .filter((m): m is Message => Boolean(m))
    .slice(-20);
};

const verifyUser = async (authHeader: string | null) => {
  if (!authHeader) return null;

  const projectUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!projectUrl || !anonKey) return null;

  const response = await fetch(`${projectUrl}/auth/v1/user`, {
    headers: {
      Authorization: authHeader,
      apikey: anonKey,
    },
  });

  if (!response.ok) return null;
  return response.json();
};

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

  try {
    const authHeader = req.headers.get("Authorization");
    const user = await verifyUser(authHeader);
    if (!user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const preferredLanguage = typeof body?.preferredLanguage === "string" ? body.preferredLanguage : "english";
    const messages = sanitizeMessages(body?.messages);

    if (!messages.length) {
      return new Response(JSON.stringify({ error: "At least one user message is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt =
      preferredLanguage === "urdu"
        ? "You are EduMentor AI Tutor. Reply clearly in Urdu with short practical explanations and mastery-first guidance."
        : preferredLanguage === "bilingual"
          ? "You are EduMentor AI Tutor. Reply in bilingual English+Urdu naturally with practical examples from Pakistan."
          : "You are EduMentor AI Tutor. Reply clearly in English with practical examples from Pakistan and mastery-first teaching.";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again shortly." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits are exhausted. Please add workspace credits." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!response.ok) {
      const detail = await response.text();
      return new Response(JSON.stringify({ error: `AI request failed: ${detail || response.statusText}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await response.json();
    const reply = payload?.choices?.[0]?.message?.content;

    if (!reply || typeof reply !== "string") {
      return new Response(JSON.stringify({ error: "AI response was empty." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ reply: reply.trim() }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
