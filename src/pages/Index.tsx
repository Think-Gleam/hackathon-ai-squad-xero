import { ArrowRight, Brain, Bot, GraduationCap, Mic, Sparkles, Target } from "lucide-react";
import { VoiceNarrator } from "@/components/VoiceNarrator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const principles = [
  {
    title: "Understanding First",
    description: "Mastery comes before speed with adaptive pacing and targeted reinforcement.",
    icon: Target,
  },
  {
    title: "Adaptive by Design",
    description: "Modules, language complexity, and quiz depth shift with real learner performance.",
    icon: Brain,
  },
  {
    title: "Human + AI Collaboration",
    description: "AI acts as a persistent tutor while preserving learner effort and teacher guidance.",
    icon: Bot,
  },
  {
    title: "Voice-First Inclusion",
    description: "Narrated lessons make quality education accessible for low-literacy and audio-first learners.",
    icon: Mic,
  },
];

const agents = [
  "Planner Agent — builds today's personalized path",
  "Teacher Agent — explains with Pakistani real-life examples",
  "Quiz Agent — adapts challenge and reinforcement",
  "Evaluator Agent — updates mastery and informs all agents",
];

const learnerModes = [
  "10-year-old learner: short, playful 10-minute modules",
  "Grade 12 student: exam-focused practice and career support",
  "University student: dense modules and project-based depth",
  "Working professional: short evening sessions with practical outcomes",
  "Rural learner: simplified language and voice-heavy assistance",
];

const Index = () => {
  return (
    <main className="page-surface min-h-screen overflow-x-hidden">
      <div className="ambient-grid pointer-events-none fixed inset-0 opacity-45" aria-hidden="true" />

      <section className="relative border-b border-border/70">
        <div className="container py-12 md:py-20">
          <div className="glass-card relative overflow-hidden rounded-lg p-6 md:p-10">
            <div className="hero-shimmer absolute inset-x-0 top-0 h-px animate-shimmer" aria-hidden="true" />
            <div className="absolute -right-12 top-8 hidden h-44 w-44 rounded-full bg-primary/10 blur-3xl md:block" aria-hidden="true" />

            <Badge variant="secondary" className="mb-4 w-fit">EduMentor Working Philosophy</Badge>
            <h1 className="title-gradient max-w-4xl text-3xl leading-tight md:text-5xl">
              Personalized Understanding Through Adaptive Intelligence
            </h1>
            <p className="mt-4 max-w-3xl text-base text-muted-foreground md:text-lg">
              EduMentor is an intelligent, empathetic learning companion that adapts to each learner’s pace,
              style, background, and goals—making quality education accessible across Pakistan and beyond.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button variant="hero" size="lg" className="signature-orbit">
                Launch Personalized Path
                <ArrowRight />
              </Button>
              <Button variant="warm" size="lg">
                <Sparkles />
                AI Tutor Ready
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-10 md:py-14">
        <div className="grid gap-4 md:grid-cols-2">
          {principles.map(({ title, description, icon: Icon }) => (
            <article
              key={title}
              className="surface-card rounded-lg p-5 transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary/15 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-xl text-foreground">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container grid gap-6 pb-10 md:grid-cols-2 md:pb-14">
        <article className="surface-card rounded-lg p-6">
          <div className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <GraduationCap className="h-4 w-4" />
            Core Agents
          </div>
          <ul className="space-y-3">
            {agents.map((agent) => (
              <li key={agent} className="rounded-md bg-secondary/55 px-3 py-2 text-sm text-secondary-foreground">
                {agent}
              </li>
            ))}
          </ul>
        </article>

        <article className="surface-card rounded-lg p-6">
          <div className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-accent-foreground">
            <Target className="h-4 w-4 text-accent" />
            Personalized Use Cases
          </div>
          <ul className="space-y-3">
            {learnerModes.map((mode) => (
              <li key={mode} className="rounded-md bg-accent/10 px-3 py-2 text-sm text-foreground">
                {mode}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="container pb-16">
        <VoiceNarrator />
      </section>
    </main>
  );
};

export default Index;
