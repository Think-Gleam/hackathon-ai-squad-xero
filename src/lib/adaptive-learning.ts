import type { EduCourse } from "@/lib/course-catalog";

type LearnerStage =
  | "kid_primary"
  | "middle_school"
  | "high_school"
  | "university_student"
  | "working_professional"
  | "parent";

type PreferredLanguage = "english" | "urdu" | "bilingual";

export type AdaptiveProfile = {
  full_name?: string | null;
  learner_stage?: LearnerStage | null;
  preferred_language?: PreferredLanguage | null;
  learning_goals?: string[] | null;
};

export type AdaptiveModes = {
  paceMode: "supportive" | "balanced" | "accelerated";
  complexityMode: "simple" | "standard" | "advanced";
  defaultMinutes: number;
  quizQuestionCount: number;
};

export type GeneratedModule = {
  moduleIndex: number;
  moduleTitle: string;
  moduleGoal: string;
  estimatedMinutes: number;
  difficultyLevel: "beginner" | "intermediate" | "advanced";
  lessonContent: string;
  lessonSummary: string;
  pakistanContextExamples: string[];
  voiceScript: string;
};

const stagePresets: Record<LearnerStage, AdaptiveModes> = {
  kid_primary: { paceMode: "supportive", complexityMode: "simple", defaultMinutes: 10, quizQuestionCount: 3 },
  middle_school: { paceMode: "supportive", complexityMode: "simple", defaultMinutes: 15, quizQuestionCount: 4 },
  high_school: { paceMode: "balanced", complexityMode: "standard", defaultMinutes: 20, quizQuestionCount: 5 },
  university_student: { paceMode: "accelerated", complexityMode: "advanced", defaultMinutes: 30, quizQuestionCount: 7 },
  working_professional: { paceMode: "balanced", complexityMode: "standard", defaultMinutes: 18, quizQuestionCount: 5 },
  parent: { paceMode: "supportive", complexityMode: "simple", defaultMinutes: 15, quizQuestionCount: 4 },
};

export const getAdaptiveModes = (profile: AdaptiveProfile | null): AdaptiveModes => {
  const stage = (profile?.learner_stage ?? "high_school") as LearnerStage;
  return stagePresets[stage] ?? stagePresets.high_school;
};

const toDifficulty = (complexityMode: AdaptiveModes["complexityMode"]): GeneratedModule["difficultyLevel"] => {
  if (complexityMode === "advanced") return "advanced";
  if (complexityMode === "standard") return "intermediate";
  return "beginner";
};

export const buildAdaptiveModules = (course: EduCourse, profile: AdaptiveProfile | null): GeneratedModule[] => {
  const modes = getAdaptiveModes(profile);
  const language = profile?.preferred_language ?? "english";
  const difficultyLevel = toDifficulty(modes.complexityMode);

  return course.curriculum.map((topic, index) => {
    const moduleIndex = index + 1;
    const moduleTitle = topic;
    const moduleGoal = `Build clear understanding of ${topic} and apply it in practical scenarios.`;
    const lessonSummary = `Mastery-first lesson for ${topic} with adaptive depth and guided practice.`;
    const pakistanContextExamples = [
      "Use local school exam preparation examples to explain planning and revision cycles.",
      "Relate concepts to daily use cases like digital payments, transport apps, and local business workflows.",
      "Frame problem-solving with examples from Pakistani classrooms, universities, and entry-level jobs.",
    ];

    const lessonContent = [
      `### ${moduleTitle}`,
      `This module is tailored for your pace (${modes.paceMode}) and complexity level (${modes.complexityMode}).`,
      "",
      "**Why it matters**",
      `${moduleGoal}`,
      "",
      "**Core explanation**",
      `We break this topic into smaller ideas, then connect them through local examples so understanding comes before speed.`,
      "",
      "**Pakistani context examples**",
      ...pakistanContextExamples.map((item) => `- ${item}`),
      "",
      "**Practice focus**",
      "- Explain the idea in your own words",
      "- Solve one guided scenario",
      "- Reflect what was easy and what needs repetition",
      "",
      `Language mode: **${language}**`,
    ].join("\n");

    const voiceScript = `Welcome to module ${moduleIndex}. ${moduleTitle}. We will learn this step by step with real examples from Pakistan, and make sure your understanding is strong before moving to the next module.`;

    return {
      moduleIndex,
      moduleTitle,
      moduleGoal,
      estimatedMinutes: modes.defaultMinutes,
      difficultyLevel,
      lessonContent,
      lessonSummary,
      pakistanContextExamples,
      voiceScript,
    };
  });
};

export const buildQuizDraft = (moduleTitle: string, questionCount: number) =>
  Array.from({ length: questionCount }).map((_, index) => ({
    id: `${moduleTitle}-${index + 1}`,
    prompt: `Q${index + 1}: Which statement best reflects the core idea of ${moduleTitle}?`,
    options: [
      "A clear, practical understanding with local examples",
      "Memorizing definitions without application",
      "Skipping foundations and moving quickly",
      "Ignoring feedback after mistakes",
    ],
    correctIndex: 0,
  }));