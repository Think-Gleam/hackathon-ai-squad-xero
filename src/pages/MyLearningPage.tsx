import { BookMarked, CalendarClock, Target } from "lucide-react";

const MyLearningPage = () => {
  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 animate-fade-in">
      <header className="space-y-2">
        <h1 className="text-3xl font-display">My Learning</h1>
        <p className="text-sm text-muted-foreground">Track goals, scheduled sessions, and your personalized learning path.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <Target className="h-5 w-5 text-primary" />
          <h2 className="mt-3 text-lg font-semibold">Weekly Goal</h2>
          <p className="mt-1 text-sm text-muted-foreground">Complete 4 focused sessions this week.</p>
        </article>

        <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <CalendarClock className="h-5 w-5 text-primary" />
          <h2 className="mt-3 text-lg font-semibold">Next Session</h2>
          <p className="mt-1 text-sm text-muted-foreground">Today at 7:30 PM · Machine Learning Essentials.</p>
        </article>

        <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <BookMarked className="h-5 w-5 text-primary" />
          <h2 className="mt-3 text-lg font-semibold">Path Status</h2>
          <p className="mt-1 text-sm text-muted-foreground">3 active modules in progress.</p>
        </article>
      </div>
    </section>
  );
};

export default MyLearningPage;