import { Flame, Medal, PlayCircle, Sparkles, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

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
  const { profile } = useAuth();
  const [stats, setStats] = useState({ streak: 0, xp: 0, badges: 0 });
  const [enrollments, setEnrollments] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!profile?.id) return;

      const [{ data: enrollmentRows }, { data: planRows }] = await Promise.all([
        supabase.from("course_enrollments").select("id,course_slug,course_title,mastery_score,current_module_index,status").eq("profile_id", profile.id),
        supabase.from("daily_learning_plans").select("id,status").eq("profile_id", profile.id),
      ]);

      const cleanEnrollments = enrollmentRows ?? [];
      setEnrollments(cleanEnrollments);

      const activePlans = (planRows ?? []).filter((item) => item.status === "completed").length;
      setStats({
        streak: Math.max(1, activePlans),
        xp: Math.round(cleanEnrollments.reduce((sum, item) => sum + Number(item.mastery_score ?? 0), 0) * 10),
        badges: cleanEnrollments.filter((item) => item.status === "completed").length,
      });
    };

    void load();
  }, [profile?.id]);

  const learnerName = useMemo(() => profile?.full_name?.split(" ")[0] ?? "Learner", [profile?.full_name]);

  return (
    <section className="mx-auto w-full max-w-6xl space-y-8 animate-fade-in">
      <header className="space-y-2">
        <h1 className="text-3xl font-display md:text-4xl">Good morning, {learnerName}! 👋 What would you like to understand deeply today?</h1>
        <p className="text-sm text-muted-foreground">Personalized understanding through adaptive intelligence — mastery first, speed second.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-muted-foreground">
            <Flame className="h-4 w-4 text-accent" />
            <span className="text-sm">Current Streak</span>
          </div>
          <p className="text-2xl font-semibold">{stats.streak} days</p>
        </article>

        <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-muted-foreground">
            <Star className="h-4 w-4 text-primary" />
            <span className="text-sm">XP Points</span>
          </div>
          <p className="text-2xl font-semibold">{stats.xp} XP</p>
        </article>

        <article className="rounded-lg border border-border bg-card p-4 shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="mb-3 flex items-center gap-2 text-muted-foreground">
            <Medal className="h-4 w-4 text-primary" />
            <span className="text-sm">Badges</span>
          </div>
          <p className="text-2xl font-semibold">{stats.badges} earned</p>
        </article>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-display">Continue Where You Left Off</h2>
        <div className="space-y-4">
          {(enrollments.length > 0
            ? enrollments.map((item) => ({
                title: item.course_title,
                description: `Adaptive module ${item.current_module_index} · Status: ${item.status}`,
                progress: Math.max(5, Math.round(Number(item.mastery_score ?? 0))),
                slug: item.course_slug,
              }))
            : enrolledCourses.map((item) => ({ ...item, slug: "courses" }))
          ).map((course) => (
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

                <Button asChild className="h-10 gap-2 self-start md:self-center">
                  <Link to={`/courses/${course.slug}`}>
                  <PlayCircle className="h-4 w-4" />
                  Resume Learning
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-display">EduMentor Philosophy</h2>
            <p className="text-sm text-muted-foreground">Voice-first, culturally relevant, and adaptive for every learner journey in Pakistan and beyond.</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/my-learning">
              <Sparkles className="h-4 w-4" /> View adaptive plan
            </Link>
          </Button>
        </div>
      </section>
    </section>
  );
};

export default DashboardPage;