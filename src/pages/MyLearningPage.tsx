import { BookMarked, CalendarClock, Languages, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

const MyLearningPage = () => {
  const { profile } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!profile?.id) return;
      const [{ data: planRows }, { data: enrollmentRows }] = await Promise.all([
        supabase.from("daily_learning_plans").select("*").eq("profile_id", profile.id).order("plan_date", { ascending: false }),
        supabase.from("course_enrollments").select("*").eq("profile_id", profile.id),
      ]);
      setPlans(planRows ?? []);
      setEnrollments(enrollmentRows ?? []);
    };
    void load();
  }, [profile?.id]);

  const activeCount = useMemo(() => enrollments.filter((item) => item.status === "active").length, [enrollments]);

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 animate-fade-in">
      <header className="space-y-2">
        <h1 className="text-3xl font-display">My Learning</h1>
        <p className="text-sm text-muted-foreground">Planner Agent schedules, adaptive pacing, and culturally relevant learning guidance.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <Target className="h-5 w-5 text-primary" />
          <h2 className="mt-3 text-lg font-semibold">Weekly Goal</h2>
          <p className="mt-1 text-sm text-muted-foreground">Complete {Math.max(3, activeCount + 2)} focused sessions this week.</p>
        </article>

        <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <CalendarClock className="h-5 w-5 text-primary" />
          <h2 className="mt-3 text-lg font-semibold">Next Session</h2>
          <p className="mt-1 text-sm text-muted-foreground">{plans[0] ? `${plans[0].plan_date} · ${plans[0].course_slug}` : "No session yet. Start a course to generate today’s plan."}</p>
        </article>

        <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <BookMarked className="h-5 w-5 text-primary" />
          <h2 className="mt-3 text-lg font-semibold">Path Status</h2>
          <p className="mt-1 text-sm text-muted-foreground">{activeCount} active enrollments in adaptive progress.</p>
        </article>
      </div>

      <section className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-foreground">
          <Languages className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold">Language & accessibility focus</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Preferred language: <span className="font-medium text-foreground">{profile?.preferred_language ?? "english"}</span>. Voice narration is prioritized to support inclusive learning.
        </p>
      </section>
    </section>
  );
};

export default MyLearningPage;