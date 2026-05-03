import { Flame, Medal, PlayCircle, Sparkles, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getGamificationSummary, logLearningActivity, type GamificationSummary } from "@/lib/gamification";

type EnrollmentRow = {
  id: string;
  course_slug: string;
  course_title: string;
  current_module_index: number;
  mastery_score: number;
  status: "active" | "completed" | "paused";
};

type AccomplishmentRow = {
  id: string;
  title: string;
  description: string;
  accomplishment_type: "certificate" | "milestone";
  issued_at: string;
};

const initialStats: GamificationSummary = { streak: 0, xp: 0, badges: 0 };

const DashboardPage = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<GamificationSummary>(initialStats);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [accomplishments, setAccomplishments] = useState<AccomplishmentRow[]>([]);

  const loadDashboardData = async (profileId: string) => {
    const [{ data: availableCourses }, { data: enrollmentRows }, { data: accomplishmentsRows }, summary] = await Promise.all([
      (supabase as any).from("course_catalog").select("slug").eq("is_available", true),
      supabase
        .from("course_enrollments")
        .select("id,course_slug,course_title,mastery_score,current_module_index,status")
        .eq("profile_id", profileId)
        .eq("status", "active"),
      supabase
        .from("accomplishments")
        .select("id,title,description,accomplishment_type,issued_at")
        .eq("profile_id", profileId)
        .order("issued_at", { ascending: false })
        .limit(6),
      getGamificationSummary(profileId),
    ]);

    const availableSlugs = new Set((availableCourses ?? []).map((item: { slug: string }) => item.slug));
    setEnrollments(((enrollmentRows ?? []) as EnrollmentRow[]).filter((item) => availableSlugs.has(item.course_slug)));
    setAccomplishments((accomplishmentsRows ?? []) as AccomplishmentRow[]);
    setStats(summary);
  };

  useEffect(() => {
    const load = async () => {
      if (!profile?.id) return;

      await logLearningActivity({
        profileId: profile.id,
        activityType: "login",
        metadata: { source: "dashboard_open" },
      });
      await loadDashboardData(profile.id);

      const profileChannel = supabase
        .channel(`dashboard-live-${profile.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "course_enrollments", filter: `profile_id=eq.${profile.id}` }, () => {
          void loadDashboardData(profile.id);
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "user_activity_logs", filter: `profile_id=eq.${profile.id}` }, () => {
          void loadDashboardData(profile.id);
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "earned_badges", filter: `profile_id=eq.${profile.id}` }, () => {
          void loadDashboardData(profile.id);
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "accomplishments", filter: `profile_id=eq.${profile.id}` }, () => {
          void loadDashboardData(profile.id);
        })
        .subscribe();

      return () => {
        void supabase.removeChannel(profileChannel);
      };
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

      {enrollments.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-display">Continue Where You Left Off</h2>
          <div className="space-y-4">
            {enrollments.map((item) => {
              const progress = Math.max(0, Math.min(100, Math.round(Number(item.mastery_score ?? 0))));
              return (
                <article
                  key={item.id}
                  className="rounded-lg border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/30"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="max-w-2xl space-y-2">
                      <h3 className="text-lg font-semibold">{item.course_title}</h3>
                      <p className="text-sm leading-6 text-muted-foreground">Adaptive module {item.current_module_index} · Active</p>
                      <div className="pt-2">
                        <div className="mb-1 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-2 w-full max-w-xl overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    </div>

                    <Button asChild className="h-10 gap-2 self-start md:self-center">
                      <Link to={`/courses/${item.course_slug}`}>
                        <PlayCircle className="h-4 w-4" />
                        Resume Learning
                      </Link>
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="text-2xl font-display">Start Your First Course</h2>
          <p className="mt-2 text-sm text-muted-foreground">You have no active enrollments yet. Explore available courses and begin your personalized learning journey.</p>
          <Button asChild className="mt-4">
            <Link to="/courses">Explore Courses</Link>
          </Button>
        </section>
      )}

      <section className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-4">
        <h2 className="text-2xl font-display">My Accomplishments</h2>
        {accomplishments.length > 0 ? (
          <div className="space-y-3">
            {accomplishments.map((item) => (
              <article key={item.id} className="rounded-md border border-border/80 bg-secondary/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                  <span className="text-xs text-muted-foreground">{new Date(item.issued_at).toLocaleDateString()}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Complete modules and milestones to unlock certificates and achievements here.</p>
        )}
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