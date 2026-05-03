import { Loader2, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const resetSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password is too long"),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isRecoveryFlow = useMemo(() => {
    const hash = window.location.hash;
    const query = new URLSearchParams(hash.replace(/^#/, ""));
    return query.get("type") === "recovery";
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    const parsed = resetSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? "Please review your password");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    toast({ title: "Password updated", description: "You can now login with your new password." });
    navigate("/auth/login", { replace: true });
  };

  if (!isRecoveryFlow) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm text-center">
          <h1 className="text-2xl font-display">Invalid reset session</h1>
          <p className="mt-2 text-sm text-muted-foreground">Open the latest reset link from your email to continue securely.</p>
          <Button asChild className="mt-5">
            <Link to="/auth/forgot-password">Request new reset link</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-display">Set new password</h1>
        <p className="mt-1 text-sm text-muted-foreground">Choose a strong password to secure your account.</p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
          </div>

          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Update password
          </Button>
        </form>
      </div>
    </section>
  );
};

export default ResetPasswordPage;