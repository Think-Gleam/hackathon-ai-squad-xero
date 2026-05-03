import { supabase } from "@/integrations/supabase/client";

export type TutorMessage = {
  role: "user" | "assistant";
  content: string;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
};

type TutorReplyResponse = {
  reply: string;
};

type AdaptiveQuizResponse = {
  questions: QuizQuestion[];
};

export const requestAiTutorReply = async (messages: TutorMessage[], preferredLanguage?: string | null) => {
  const { data, error } = await supabase.functions.invoke("ai-tutor-chat", {
    body: { messages, preferredLanguage: preferredLanguage ?? "english" },
  });

  if (error) {
    throw new Error(error.message || "Unable to reach AI Tutor service.");
  }

  const payload = data as TutorReplyResponse | null;
  if (!payload?.reply) {
    throw new Error("AI Tutor returned an empty response.");
  }

  return payload.reply;
};

export const requestAdaptiveQuizQuestions = async (topic: string, preferredLanguage?: string | null, count = 4) => {
  const { data, error } = await supabase.functions.invoke("adaptive-quiz", {
    body: { topic, preferredLanguage: preferredLanguage ?? "english", questionCount: count },
  });

  if (error) {
    throw new Error(error.message || "Unable to generate adaptive quiz.");
  }

  const payload = data as AdaptiveQuizResponse | null;
  if (!payload?.questions?.length) {
    throw new Error("Adaptive quiz service returned no questions.");
  }

  return payload.questions;
};
