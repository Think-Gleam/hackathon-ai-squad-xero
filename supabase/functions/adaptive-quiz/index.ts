const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
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

const fallbackQuestions = (topic: string, count: number): QuizQuestion[] =>
  Array.from({ length: count }).map((_, index) => ({
    id: `${topic.replace(/\s+/g, "-").toLowerCase()}-${index + 1}`,
    prompt: `Q${index + 1}: Which option best represents core understanding in ${topic}?`,
    options: [
      "Use the concept in a real scenario with clear reasoning",
      "Memorize terms without context",
      "Skip foundational steps",
      "Guess without checking understanding",
    ],
    correctIndex: 0,
    explanation: "Mastery means applying understanding, not memorizing in isolation.",
  }));

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
    const topic = typeof body?.topic === "string" ? body.topic.trim() : "General Topic";
    const preferredLanguage = typeof body?.preferredLanguage === "string" ? body.preferredLanguage : "english";
    const questionCountRaw = Number(body?.questionCount ?? 4);
    const questionCount = Number.isFinite(questionCountRaw) ? Math.max(3, Math.min(5, Math.round(questionCountRaw))) : 4;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ questions: fallbackQuestions(topic, questionCount) }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `Generate ${questionCount} MCQ questions for topic: ${topic}. Language: ${preferredLanguage}. Return strict JSON with this shape: {"questions":[{"id":"q1","prompt":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"..."}]}. Ensure exactly 4 options and one correct answer.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You create valid adaptive quiz JSON only. No markdown or extra text.",
          },
          { role: "user", content: prompt },
        ],
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
      return new Response(JSON.stringify({ questions: fallbackQuestions(topic, questionCount) }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;

    if (typeof content !== "string") {
      return new Response(JSON.stringify({ questions: fallbackQuestions(topic, questionCount) }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(content);
    const questions = Array.isArray(parsed?.questions) ? parsed.questions : [];
    const normalized = questions
      .map((q: any, index: number) => ({
        id: typeof q?.id === "string" ? q.id : `q-${index + 1}`,
        prompt: typeof q?.prompt === "string" ? q.prompt : `Question ${index + 1}`,
        options: Array.isArray(q?.options) ? q.options.filter((o: unknown) => typeof o === "string").slice(0, 4) : [],
        correctIndex: Number.isInteger(q?.correctIndex) ? q.correctIndex : 0,
        explanation: typeof q?.explanation === "string" ? q.explanation : undefined,
      }))
      .filter((q: QuizQuestion) => q.options.length === 4 && q.correctIndex >= 0 && q.correctIndex <= 3)
      .slice(0, 5);

    const safeQuestions = normalized.length >= 3 ? normalized : fallbackQuestions(topic, questionCount);

    return new Response(JSON.stringify({ questions: safeQuestions }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ questions: fallbackQuestions("General Topic", 4) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
