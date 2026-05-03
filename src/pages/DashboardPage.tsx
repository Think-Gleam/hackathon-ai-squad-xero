import { Flame, Medal, PlayCircle, Star } from "lucide-react";

import { Button } from "@/components/ui/button";

const enrolledCourses = [
  {
    title: "Mathematics",
    description: "Strengthen algebra and advanced problem-solving with step-by-step practice.",
    progress: 40,
  },
  {
    title: "Computer Science",
    description: "Build confidence in coding logic, data structures, and practical mini-projects.",
    progress: 15,
  },
  {
    title: "AI Fundamentals",
    description: "Understand modern AI systems, safe usage, and foundational applications.",
    progress: 62,
  },
];

const DashboardPage = () => {
  return (
    <section className="mx-auto w-full max-w-6xl space-y-8 animate-fade-in">
      <header className="space-y-2">
        <h1 className="text-3xl font-display md:text-4xl">Good morning, Emma! 👋 What would you like to learn today?</h1>
        <p className="text-sm text-muted-foreground">Stay consistent, keep momentum, and continue your professional learning journey.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-muted-foreground">
            <Flame className="h-4 w-4 text-accent" />
            <span className="text-sm">Current Streak</span>
          </div>
          <p className="text-2xl font-semibold">14 days</p>
        </article>

        <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-muted-foreground">
            <Star className="h-4 w-4 text-primary" />
            <span className="text-sm">XP Points</span>
          </div>
          <p className="text-2xl font-semibold">2,980 XP</p>
        </article>

        <article className="rounded-lg border border-border bg-card p-4 shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="mb-3 flex items-center gap-2 text-muted-foreground">
            <Medal className="h-4 w-4 text-primary" />
            <span className="text-sm">Badges</span>
          </div>
          <p className="text-2xl font-semibold">6 earned</p>
        </article>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-display">Continue Where You Left Off</h2>
        <div className="space-y-4">
          {enrolledCourses.map((course) => (
            <article
              key={course.title}
              className="rounded-lg border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/30"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="max-w-2xl space-y-2">
                  <h3 className="text-lg font-semibold">{course.title}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">{course.description}</p>
                  <div className="pt-2">
                    <div className="mb-1 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                      <span>Progress</span>
                      <span>{course.progress}%</span>
                    </div>
                    <div className="h-2 w-full max-w-xl overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${course.progress}%` }} />
                    </div>
                  </div>
                </div>

                <Button className="h-10 gap-2 self-start md:self-center">
                  <PlayCircle className="h-4 w-4" />
                  Resume Learning
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
};

export default DashboardPage;