import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  BookOpen,
  BrainCircuit,
  GraduationCap,
  Home,
  Search,
  Settings,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/integrations/supabase/client";

type MentorLayoutProps = {
  children: ReactNode;
};

export function MentorLayout({ children }: MentorLayoutProps) {
  const { user, loading } = useAuth();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const [profileChecked, setProfileChecked] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setProfileChecked(true);
      return;
    }

    supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (cancelled) return;
        setOnboardingCompleted(Boolean(data?.onboarding_completed));
        setProfileChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading || !profileChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
          Please <Link to="/login" className="auth-link">login</Link> to continue.
        </div>
      </div>
    );
  }

  if (!onboardingCompleted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
          Complete your <Link to="/onboarding" className="auth-link">onboarding</Link> to access your dashboard.
        </div>
      </div>
    );
  }

  return (
    <div className="mentor-shell">
      <aside className="mentor-sidebar">
        <div className="mentor-logo">
          <span className="mentor-logo-mark">E</span>
          <div>
            <p className="text-sm font-semibold text-foreground">EduMentor</p>
            <p className="text-xs text-muted-foreground">Learning Companion</p>
          </div>
        </div>

        <nav className="mentor-nav" aria-label="Main Navigation">
          <Link to="/" className={`mentor-nav-item ${pathname === "/" ? "is-active" : ""}`}>
            <Home className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>

          <button className="mentor-nav-item" type="button">
            <GraduationCap className="h-4 w-4" />
            <span>My Learning</span>
          </button>

          <Link to="/courses" className={`mentor-nav-item ${pathname.startsWith("/courses") ? "is-active" : ""}`}>
            <BookOpen className="h-4 w-4" />
            <span>Courses</span>
          </Link>

          <button className="mentor-nav-item" type="button">
            <BrainCircuit className="h-4 w-4" />
            <span>AI Tutor</span>
          </button>

          <button className="mentor-nav-item" type="button">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
        </nav>
      </aside>

      <section className="mentor-main">
        <header className="mentor-topbar">
          <label className="mentor-search" htmlFor="dashboard-search">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input id="dashboard-search" type="search" placeholder="Search courses, topics, or resources..." />
          </label>

          <div className="mentor-user-card">
            <div className="mentor-avatar">EA</div>
            <div>
              <p className="text-sm font-semibold text-foreground">Emma Adams</p>
              <p className="text-xs text-muted-foreground">Grade 12 • STEM Track</p>
            </div>
          </div>
        </header>

        <main className="mentor-content">{children}</main>
      </section>
    </div>
  );
}