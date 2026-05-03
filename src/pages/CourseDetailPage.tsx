import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2, Play, Volume2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useAuth } from "@/components/auth/AuthProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import QuizEngine from "@/components/quiz/QuizEngine";
import { supabase } from "@/integrations/supabase/client";
import { fetchAvailableCourseBySlug, type EduCourse } from "@/lib/course-catalog";
import { logLearningActivity } from "@/lib/gamification";
import {
  createPlannerEntry,
  ensureEnrollmentAndModules,
  fetchCourseLearningState,
  logAgentStep,
  logVoiceUsage,
  submitAdaptiveQuiz,
} from "@/lib/learning-flow";

const db = supabase as any;

const primaryVoiceByLanguage = {
  english: "JBFqnCBsd6RMkjVDRZzb",
  urdu: "EXAVITQu4vr4xnSDxMaL",
  bilingual: "XrExE9yKIg1WjnnlVkGX",
} as const;

type LearningModule = {
  id: string;
  module_index: number;
  module_title: string;
  module_goal: string;
  estimated_minutes: number;
  difficulty_level: "beginner" | "intermediate" | "advanced";
  unlock_state: "locked" | "unlocked" | "completed";
  lesson_content: string | null;
  lesson_summary: string | null;
  voice_script: string | null;
};

const CourseDetailPage = () => {
  const { courseSlug } = useParams<{ courseSlug: string }>();
  const { profile } = useAuth();
  const { toast } = useToast();

  const [course, setCourse] = useState<EduCourse | null>(null);
  const [loading, setLoading] = useState(false);
  const [enrollment, setEnrollment] = useState<any | null>(null);
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [moduleStartPending, setModuleStartPending] = useState(false);
  const [listening, setListening] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const loadCourse = async () => {
      if (!courseSlug) return;
      const availableCourse = await fetchAvailableCourseBySlug(courseSlug);
      setCourse(availableCourse);
    };

    void loadCourse();
  }, [courseSlug]);

  const activeModule = modules.find((item) => item.id === activeModuleId) ?? modules.find((item) => item.unlock_state === "unlocked") ?? null;
  const quizTopic = useMemo(() => activeModule?.module_title ?? "", [activeModule?.module_title]);

  const loadLearningState = async () => {
    if (!profile?.id || !courseSlug) return;
    const state = await fetchCourseLearningState(profile.id, courseSlug);
    setEnrollment(state.enrollment);
    setModules((state.modules as unknown as LearningModule[]) ?? []);
    const firstActionable = (state.modules as LearningModule[]).find((item) => item.unlock_state === "unlocked");
    if (firstActionable) setActiveModuleId(firstActionable.id);
  };

  useEffect(() => {
    const initialize = async () => {
      if (!profile || !courseSlug || !course) return;
      setLoading(true);
      try {
        const setup = await ensureEnrollmentAndModules(profile, courseSlug);
        setEnrollment(setup.enrollment);

        await createPlannerEntry(profile.id, courseSlug, [], setup.adaptiveModes.defaultMinutes);
        await logAgentStep({
          profileId: profile.id,
          courseSlug,
          agent: "planner",
          inputPayload: { learnerStage: profile.learner_stage, preferredLanguage: profile.preferred_language },
          outputPayload: { paceMode: setup.adaptiveModes.paceMode, complexityMode: setup.adaptiveModes.complexityMode },
        });

        await loadLearningState();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to prepare learning flow.";
        toast({ title: "Could not initialize adaptive path", description: message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    void initialize();
  }, [profile?.id, courseSlug]);

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  const playLessonNarration = async () => {
    if (!profile || !activeModule) return;
    const voiceId = primaryVoiceByLanguage[(profile.preferred_language ?? "english") as keyof typeof primaryVoiceByLanguage];
    const script = activeModule.voice_script || activeModule.lesson_summary || `Let's study ${activeModule.module_title}.`;

    setListening(true);
    try {
      const { data, error } = await db.functions.invoke("elevenlabs-tts", {
        body: { text: script, voiceId },
      });

      if (error || !data || !(data instanceof Blob)) {
        setListening(false);
        toast({ title: "Audio Agent failed", description: "Please try again.", variant: "destructive" });
        await logVoiceUsage({ profileId: profile.id, courseSlug, moduleId: activeModule.id, provider: "elevenlabs", mode: "tts", status: "failed" });
        return;
      }

      const audio = new Audio(URL.createObjectURL(data));
      audioRef.current = audio;
      audio.onended = () => setListening(false);
      await audio.play();
      await logVoiceUsage({
        profileId: profile.id,
        courseSlug,
        moduleId: activeModule.id,
        provider: "elevenlabs",
        mode: "tts",
        inputText: script,
      });
    } catch {
      setListening(false);
      toast({ title: "Audio Agent blocked", description: "Playback was blocked or unavailable.", variant: "destructive" });
      await logVoiceUsage({ profileId: profile.id, courseSlug, moduleId: activeModule.id, provider: "elevenlabs", mode: "tts", status: "failed" });
    }
  };

  const submitQuiz = async (result: { scorePercent: number; questionCount: number; correctCount: number }) => {
    if (!profile || !activeModule) return;

    const score = result.scorePercent;
    try {
      const evaluator = await submitAdaptiveQuiz(profile.id, activeModule.id, score, result.questionCount);
      await logAgentStep({
        profileId: profile.id,
        courseSlug,
        moduleId: activeModule.id,
        agent: "quiz",
        inputPayload: { questionCount: result.questionCount },
        outputPayload: { score },
      });
      await logAgentStep({
        profileId: profile.id,
        courseSlug,
        moduleId: activeModule.id,
        agent: "evaluator",
        inputPayload: { score },
        outputPayload: { nextAction: evaluator?.next_action },
      });

      await logLearningActivity({
        profileId: profile.id,
        activityType: "quiz_completed",
        metadata: { moduleId: activeModule.id, score, correctAnswers: result.correctCount },
      });

      if (score >= 75) {
        await logLearningActivity({
          profileId: profile.id,
          activityType: "module_completed",
          referenceModuleId: activeModule.id,
          metadata: { moduleTitle: activeModule.module_title },
        });
      }

      await loadLearningState();

      toast({
        title: `Score ${score}%`,
        description:
          evaluator?.next_action === "proceed_to_next_module"
            ? "Great work — next module unlocked."
            : evaluator?.next_action === "course_completed"
              ? "Excellent — you completed this course path."
              : "We adapted your path for stronger understanding.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Evaluation failed.";
      toast({ title: "Could not submit quiz", description: message, variant: "destructive" });
      throw error;
    }
  };

  const startAdaptiveModule = async () => {
    if (!profile?.id || !enrollment?.id || !activeModule) return;
    setModuleStartPending(true);
    try {
      await db.from("course_enrollments").update({ status: "active" }).eq("id", enrollment.id).eq("profile_id", profile.id);
      await logLearningActivity({
        profileId: profile.id,
        activityType: "lesson_interaction",
        referenceModuleId: activeModule.id,
        metadata: { action: "start_adaptive_module", moduleTitle: activeModule.module_title },
      });
      toast({ title: "Adaptive module started", description: `${activeModule.module_title} is now active.` });
      await loadLearningState();
    } catch (error) {
      toast({
        title: "Could not start module",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setModuleStartPending(false);
    }
  };

  if (!course) {
    return (
      <section className="mx-auto w-full max-w-3xl rounded-lg border border-border bg-card p-6 text-center shadow-sm">
        <h1 className="text-2xl font-display">Course not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">Please return to the focused course catalog.</p>
        <Button asChild className="mt-5">
          <Link to="/courses">Back to Courses</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 animate-fade-in">
      <header className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium text-primary">{course.level}</p>
        <h1 className="mt-1 text-3xl font-display">{course.title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{course.shortDescription}</p>
        <p className="mt-3 text-sm text-muted-foreground">Duration: {course.durationEstimate}</p>
        {enrollment ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="secondary">Pace: {enrollment.pace_mode}</Badge>
            <Badge variant="secondary">Complexity: {enrollment.complexity_mode}</Badge>
            <Badge variant="secondary">Mastery: {enrollment.mastery_score}%</Badge>
          </div>
        ) : null}
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="text-xl font-semibold">What you'll learn</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {course.whatYouWillLearn.map((item) => (
              <li key={item} className="rounded-md bg-secondary/40 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Curriculum</h2>
          <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
            {course.curriculum.map((module) => (
              <li key={module} className="rounded-md bg-secondary/40 px-3 py-2">
                {module}
              </li>
            ))}
          </ol>
        </article>

        <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Adaptive modules</h2>
          {loading ? (
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Building your personalized path...
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {modules.map((module) => (
                <li key={module.id}>
                  <button
                    type="button"
                    onClick={() => setActiveModuleId(module.id)}
                    disabled={module.unlock_state === "locked"}
                    className="w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-left disabled:opacity-50"
                  >
                    <p className="font-medium text-foreground">Module {module.module_index}: {module.module_title}</p>
                    <p className="text-xs">{module.unlock_state} · {module.estimated_minutes} min · {module.difficulty_level}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>

      {activeModule ? (
        <section className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-semibold">Teacher Agent: {activeModule.module_title}</h2>
            <Button variant="outline" size="sm" onClick={playLessonNarration} disabled={listening}>
              {listening ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />} {listening ? "Audio Agent is synthesizing..." : "Listen to the Tutor"}
            </Button>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeModule.lesson_content ?? activeModule.lesson_summary ?? ""}</ReactMarkdown>
          </div>
          <p className="text-sm text-foreground"><span className="font-semibold">Mastery rule:</span> Score 75%+ to unlock the next module.</p>
        </section>
      ) : null}

      {activeModule ? <QuizEngine topic={quizTopic} preferredLanguage={profile?.preferred_language} onSubmit={submitQuiz} /> : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => void startAdaptiveModule()} disabled={!activeModule || moduleStartPending}>
          {moduleStartPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Start adaptive module
        </Button>
        <Button variant="outline" asChild>
          <Link to="/courses">Back to Courses</Link>
        </Button>
      </div>
    </section>
  );
};

export default CourseDetailPage;
