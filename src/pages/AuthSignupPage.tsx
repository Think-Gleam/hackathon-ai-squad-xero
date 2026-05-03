import { Loader2, UserPlus } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const roleOptions = [
  { label: "Kid/Primary", value: "kid_primary" },
  { label: "Middle School", value: "middle_school" },
  { label: "High School", value: "high_school" },
  { label: "University Student", value: "university_student" },
  { label: "Working Professional", value: "working_professional" },
  { label: "Parent", value: "parent" },
] as const;

const languageOptions = [
  { label: "English", value: "english" },
  { label: "Urdu", value: "urdu" },
  { label: "Bilingual", value: "bilingual" },
] as const;

const educationOptions = [
  { label: "Primary", value: "primary" },
  { label: "Middle", value: "middle" },
  { label: "Secondary", value: "secondary" },
  { label: "Higher Secondary", value: "higher_secondary" },
  { label: "Undergraduate", value: "undergraduate" },
  { label: "Postgraduate", value: "postgraduate" },
  { label: "Other", value: "other" },
] as const;

const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name is required").max(120, "Name is too long"),
    email: z.string().trim().email("Enter a valid email").max(255, "Email is too long"),
    password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password is too long"),
    confirmPassword: z.string(),
    dateOfBirth: z.string().optional(),
    learnerStage: z.enum(["kid_primary", "middle_school", "high_school", "university_student", "working_professional", "parent"]),
    preferredLanguage: z.enum(["english", "urdu", "bilingual"]),
    educationLevel: z.enum(["primary", "middle", "secondary", "higher_secondary", "undergraduate", "postgraduate", "other"]),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

const AuthSignupPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
    learnerStage: "high_school",
    preferredLanguage: "english",
    educationLevel: "secondary",
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    const parsed = signupSchema.safeParse(form);
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? "Please review your details.");
      return;
    }

    setLoading(true);

    const payload = parsed.data;
    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: payload.fullName,
        },
      },
    });

    if (error) {
      setLoading(false);
      setErrorMessage(error.message);
      return;
    }

    if (data.user && data.session) {
      await supabase
        .from("profiles")
        .update({
          full_name: payload.fullName,
          date_of_birth: payload.dateOfBirth || null,
          learner_stage: payload.learnerStage,
          preferred_language: payload.preferredLanguage,
          current_education_level: payload.educationLevel,
        })
        .eq("id", data.user.id);

      toast({ title: "Welcome to EduMentor", description: "Let’s personalize your journey." });
      setLoading(false);
      navigate("/onboarding", { replace: true });
      return;
    }

    setLoading(false);
    toast({
      title: "Check your email",
      description: "Confirm your account from your inbox, then login to continue.",
    });
    navigate("/auth/login", { replace: true });
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-2xl rounded-lg border border-border bg-card p-6 shadow-sm md:p-7">
        <h1 className="text-2xl font-display">Create your EduMentor account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Professional signup flow with personalized learner setup.</p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth (Optional)</Label>
              <Input id="dob" type="date" value={form.dateOfBirth} onChange={(e) => setForm((p) => ({ ...p, dateOfBirth: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Create Password</Label>
              <Input id="password" type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              />
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">I am a</legend>
            <div className="grid gap-2 md:grid-cols-2">
              {roleOptions.map((option) => (
                <label key={option.value} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                  <input
                    type="radio"
                    name="learnerStage"
                    value={option.value}
                    checked={form.learnerStage === option.value}
                    onChange={(e) => setForm((p) => ({ ...p, learnerStage: e.target.value }))}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="preferredLanguage">Preferred Language</Label>
              <select
                id="preferredLanguage"
                value={form.preferredLanguage}
                onChange={(e) => setForm((p) => ({ ...p, preferredLanguage: e.target.value }))}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="educationLevel">Current Education Level</Label>
              <select
                id="educationLevel"
                value={form.educationLevel}
                onChange={(e) => setForm((p) => ({ ...p, educationLevel: e.target.value }))}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {educationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Create Account
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/auth/login" className="font-semibold text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </section>
  );
};

export default AuthSignupPage;