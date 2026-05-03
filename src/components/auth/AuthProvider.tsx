import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (!error && data) {
      setProfile(data);
      return;
    }

    if (!data) {
      const fallbackName = session?.user?.user_metadata?.full_name ?? "Learner";
      const { data: created } = await supabase
        .from("profiles")
        .insert({ id: userId, full_name: typeof fallbackName === "string" ? fallbackName : "Learner" })
        .select("*")
        .single();

      setProfile(created ?? null);
      return;
    }

    setProfile(null);
  };

  const refreshProfile = async () => {
    if (!session?.user?.id) return;
    await loadProfile(session.user.id);
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user?.id) {
        void loadProfile(nextSession.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    void supabase.auth.getSession().then(({ data }) => {
      const nextSession = data.session;
      setSession(nextSession);
      if (nextSession?.user?.id) {
        void loadProfile(nextSession.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      loading,
      refreshProfile,
    }),
    [session, profile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
