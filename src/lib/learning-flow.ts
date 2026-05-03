import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { COURSE_BY_SLUG } from "@/lib/course-catalog";
import { buildAdaptiveModules, buildQuizDraft, getAdaptiveModes } from "@/lib/adaptive-learning";

type Profile = Tables<"profiles">;

export const ensureEnrollmentAndModules = async (profile: Profile, courseSlug: string) => {
  const course = COURSE_BY_SLUG[courseSlug];
  if (!course) {
    throw new Error("Selected course is unavailable.");
  }

  const modes = getAdaptiveModes(profile);

  const { data: existingEnrollment, error: existingEnrollmentError } = await supabase
    .from("course_enrollments")
    .select("*")
    .eq("profile_id", profile.id)
    .eq("course_slug", courseSlug)
    .maybeSingle();

  if (existingEnrollmentError) {
    throw new Error(existingEnrollmentError.message);
  }

  const enrollment =
    existingEnrollment ??
    (
      await supabase
        .from("course_enrollments")
        .insert({
          profile_id: profile.id,
          course_slug: courseSlug,
          course_title: course.title,
          preferred_language: profile.preferred_language,
          pace_mode: modes.paceMode,
          complexity_mode: modes.complexityMode,
          current_module_index: 1,
          status: "active",
        })
        .select("*")
        .single()
    ).data;

  if (!enrollment) {
    throw new Error("Could not create learning enrollment.");
  }

  const generatedModules = buildAdaptiveModules(course, profile);

  const modulePayload = generatedModules.map((module, idx) => ({
    enrollment_id: enrollment.id,
    module_index: module.moduleIndex,
    module_title: module.moduleTitle,
    module_goal: module.moduleGoal,
    estimated_minutes: module.estimatedMinutes,
    difficulty_level: module.difficultyLevel,
    unlock_state: idx === 0 ? "unlocked" : "locked",
    lesson_content: module.lessonContent,
    lesson_summary: module.lessonSummary,
    pakistan_context_examples: module.pakistanContextExamples,
    voice_script: module.voiceScript,
  }));

  const { error: moduleUpsertError } = await supabase
    .from("learning_modules")
    .upsert(modulePayload, { onConflict: "enrollment_id,module_index", ignoreDuplicates: false });

  if (moduleUpsertError) {
    throw new Error(moduleUpsertError.message);
  }

  return { enrollment, adaptiveModes: modes };
};

export const fetchEnrollmentModules = async (enrollmentId: string) => {
  const { data, error } = await supabase
    .from("learning_modules")
    .select("*")
    .eq("enrollment_id", enrollmentId)
    .order("module_index", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
};

export const fetchCourseLearningState = async (profileId: string, courseSlug: string) => {
  const { data: enrollment, error: enrollmentError } = await supabase
    .from("course_enrollments")
    .select("*")
    .eq("profile_id", profileId)
    .eq("course_slug", courseSlug)
    .maybeSingle();

  if (enrollmentError) {
    throw new Error(enrollmentError.message);
  }

  if (!enrollment) {
    return { enrollment: null, modules: [] };
  }

  const modules = await fetchEnrollmentModules(enrollment.id);
  return { enrollment, modules };
};

export const submitAdaptiveQuiz = async (profileId: string, moduleId: string, scorePercent: number, questionCount: number) => {
  const correctCount = Math.round((scorePercent / 100) * questionCount);

  const { data, error } = await supabase.rpc("apply_module_evaluation", {
    _profile_id: profileId,
    _module_id: moduleId,
    _score_percent: scorePercent,
    _question_count: questionCount,
    _correct_count: correctCount,
    _feedback: scorePercent >= 75 ? "Strong understanding. Keep momentum." : "Reinforce fundamentals before next unlock.",
  });

  if (error) {
    throw new Error(error.message);
  }

  const evaluator = Array.isArray(data) ? data[0] : data;
  return evaluator;
};

export const createPlannerEntry = async (profileId: string, courseSlug: string, moduleIds: string[], focusMinutes: number) => {
  const { error } = await supabase.from("daily_learning_plans").upsert(
    {
      profile_id: profileId,
      plan_date: new Date().toISOString().slice(0, 10),
      course_slug: courseSlug,
      module_ids: moduleIds,
      focus_minutes: focusMinutes,
      planner_notes: "Understanding-first study plan generated with adaptive pacing.",
      status: "pending",
    },
    { onConflict: "profile_id,plan_date,course_slug" },
  );

  if (error) {
    throw new Error(error.message);
  }
};

export const logVoiceUsage = async (params: {
  profileId: string;
  courseSlug?: string;
  moduleId?: string;
  provider: string;
  mode: "tts" | "stt" | "duplex";
  inputText?: string;
  transcriptText?: string;
  status?: string;
}) => {
  const { error } = await supabase.from("voice_sessions").insert({
    profile_id: params.profileId,
    course_slug: params.courseSlug ?? null,
    module_id: params.moduleId ?? null,
    provider: params.provider,
    mode: params.mode,
    input_text: params.inputText ?? null,
    transcript_text: params.transcriptText ?? null,
    status: params.status ?? "success",
  });

  if (error) {
    throw new Error(error.message);
  }
};

export const logAgentStep = async (params: {
  profileId: string;
  courseSlug?: string;
  moduleId?: string;
  agent: "planner" | "teacher" | "quiz" | "evaluator" | "tutor";
  inputPayload?: Record<string, unknown>;
  outputPayload?: Record<string, unknown>;
}) => {
  const { error } = await supabase.from("agent_execution_logs").insert({
    profile_id: params.profileId,
    course_slug: params.courseSlug ?? null,
    module_id: params.moduleId ?? null,
    agent: params.agent,
    input_payload: params.inputPayload ?? {},
    output_payload: params.outputPayload ?? {},
  });

  if (error) {
    throw new Error(error.message);
  }
};

export const generateQuizForModule = (moduleTitle: string, profile: Profile) => {
  const modes = getAdaptiveModes(profile);
  return buildQuizDraft(moduleTitle, modes.quizQuestionCount);
};