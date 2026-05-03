import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "@/components/auth/AuthProvider";

export const ProtectedRoute = ({ children }: { children: ReactElement }) => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex min-h-[70vh] items-center justify-center text-muted-foreground">Loading your workspace...</div>;
  }

  if (!session) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
  }

  return children;
};

export const PublicOnlyRoute = ({ children }: { children: ReactElement }) => {
  const { session, loading, profile } = useAuth();

  if (loading) {
    return <div className="flex min-h-[70vh] items-center justify-center text-muted-foreground">Loading...</div>;
  }

  if (session) {
    if (profile && !profile.onboarding_completed) {
      return <Navigate to="/onboarding" replace />;
    }

    return <Navigate to="/" replace />;
  }

  return children;
};

export const OnboardingGate = ({ children }: { children: ReactElement }) => {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return <div className="flex min-h-[70vh] items-center justify-center text-muted-foreground">Preparing onboarding...</div>;
  }

  if (!session) {
    return <Navigate to="/auth/login" replace />;
  }

  if (profile?.onboarding_completed) {
    return <Navigate to="/" replace />;
  }

  return children;
};
