import { supabase } from "@/integrations/supabase/client";

export type GamificationSummary = {
  streak: number;
  xp: number;
  badges: number;
};

const XP_BY_ACTIVITY: Record<string, number> = {
  login: 5,
  module_completed: 120,
  quiz_completed: 60,
  lesson_interaction: 15,
};

export const resolveXpDelta = (activityType: string) => XP_BY_ACTIVITY[activityType] ?? 0;

export const getGamificationSummary = async (profileId: string): Promise<GamificationSummary> => {
  const { data, error } = await (supabase as any).rpc("compute_gamification_summary", { _profile_id: profileId });

  if (error) {
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    streak: Number(row?.current_streak ?? 0),
    xp: Number(row?.total_xp ?? 0),
    badges: Number(row?.total_badges ?? 0),
  };
};

export const logLearningActivity = async (params: {
  profileId: string;
  activityType: "login" | "module_completed" | "quiz_completed" | "lesson_interaction";
  xpDelta?: number;
  referenceModuleId?: string;
  metadata?: Record<string, unknown>;
}) => {
  const { error } = await (supabase as any).from("user_activity_logs").insert({
    profile_id: params.profileId,
    activity_type: params.activityType,
    xp_delta: params.xpDelta ?? resolveXpDelta(params.activityType),
    reference_module_id: params.referenceModuleId ?? null,
    metadata: params.metadata ?? {},
  });

  if (error) {
    throw new Error(error.message);
  }
};