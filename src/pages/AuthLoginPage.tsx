import { Loader2, LogIn } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255, "Email is too long"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password is too long"),
});

const AuthLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const redirectPath = (location.state as { from?: string } | null)?.from || "/";

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? "Please check your input.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    toast({ title: "Logged in", description: "Welcome back to EduMentor." });
    navigate(redirectPath, { replace: true });
  };

  const handleGoogleSignIn = async () => {
    setOauthLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
      extraParams: { prompt: "select_account" },
    });
    setOauthLoading(false);

    if (result.error) {
      setErrorMessage(result.error.message);
      return;
    }

    if (!result.redirected) {
      navigate(redirectPath, { replace: true });
    }
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm md:p-7">
        <h1 className="text-2xl font-display">Login to EduMentor</h1>
        <p className="mt-1 text-sm text-muted-foreground">Continue your adaptive learning journey.</p>

        <form className="mt-6 space-y-4" onSubmit={handleLogin}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link to="/auth/forgot-password" className="text-xs font-medium text-primary hover:underline">
                Forgot Password?
              </Link>
            </div>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />} Login
          </Button>
        </form>

        <Button variant="outline" className="mt-3 w-full" onClick={handleGoogleSignIn} disabled={oauthLoading}>
          {oauthLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in with Google"}
        </Button>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link to="/auth/signup" className="font-semibold text-primary hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </section>
  );
};

export default AuthLoginPage;