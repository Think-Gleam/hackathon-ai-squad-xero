import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, UserPlus } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { PublicOnly } from "@/components/auth-gate";
import { educationLevels, languageOptions, learnerSegments } from "@/lib/auth-options";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name is required."),
    email: z.string().trim().email("Please enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Please confirm your password."),
    dateOfBirth: z.string().optional(),
    learnerSegment: z.string().min(1, "Please select who you are."),
    preferredLanguage: z.string().min(1, "Please select a preferred language."),
    educationLevel: z.string().min(1, "Please select your education level."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const Route = createFileRoute("/signup")({
  component: SignUpPage,
});

function SignUpPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [learnerSegment, setLearnerSegment] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsed = signupSchema.safeParse({
      fullName,
      email,
      password,
      confirmPassword,
      dateOfBirth,
      learnerSegment,
      preferredLanguage,
      educationLevel,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your form values.");
      return;
    }

    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: parsed.data.fullName,
          date_of_birth: parsed.data.dateOfBirth || null,
          learner_segment: parsed.data.learnerSegment,
          preferred_language: parsed.data.preferredLanguage,
          education_level: parsed.data.educationLevel,
        },
      },
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    toast.success("Account created. Complete onboarding to personalize your learning.");
    navigate({ to: "/onboarding" });
  };

  return (
    <PublicOnly>
      <div className="auth-page">
        <div className="auth-card auth-card-wide">
          <p className="auth-kicker">Create your EduMentor account</p>
          <h1 className="auth-title">Sign Up</h1>
          <p className="auth-subtitle">Set up your learner profile in one secure step.</p>

          <form className="auth-form" onSubmit={handleSignup}>
            <div className="auth-grid-two">
              <div>
                <label className="auth-label" htmlFor="signup-full-name">
                  Full Name
                </label>
                <input
                  id="signup-full-name"
                  className="auth-input"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Emma Adams"
                />
              </div>

              <div>
                <label className="auth-label" htmlFor="signup-email">
                  Email Address
                </label>
                <input
                  id="signup-email"
                  className="auth-input"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="auth-grid-two">
              <div>
                <label className="auth-label" htmlFor="signup-password">
                  Create Password
                </label>
                <input
                  id="signup-password"
                  className="auth-input"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>

              <div>
                <label className="auth-label" htmlFor="signup-confirm-password">
                  Confirm Password
                </label>
                <input
                  id="signup-confirm-password"
                  className="auth-input"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
            </div>

            <label className="auth-label" htmlFor="signup-dob">
              Date of Birth (Optional)
            </label>
            <input
              id="signup-dob"
              className="auth-input"
              type="date"
              value={dateOfBirth}
              onChange={(event) => setDateOfBirth(event.target.value)}
            />

            <fieldset className="auth-fieldset">
              <legend className="auth-label">I am a:</legend>
              <div className="auth-radio-grid">
                {learnerSegments.map((segment) => (
                  <label key={segment.value} className="auth-radio-item">
                    <input
                      type="radio"
                      name="learner-segment"
                      value={segment.value}
                      checked={learnerSegment === segment.value}
                      onChange={(event) => setLearnerSegment(event.target.value)}
                    />
                    <span>{segment.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="auth-grid-two">
              <div>
                <label className="auth-label" htmlFor="signup-language">
                  Preferred Language
                </label>
                <select
                  id="signup-language"
                  className="auth-input"
                  value={preferredLanguage}
                  onChange={(event) => setPreferredLanguage(event.target.value)}
                >
                  <option value="">Select language</option>
                  {languageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="auth-label" htmlFor="signup-education-level">
                  Current Education Level
                </label>
                <select
                  id="signup-education-level"
                  className="auth-input"
                  value={educationLevel}
                  onChange={(event) => setEducationLevel(event.target.value)}
                >
                  <option value="">Select level</option>
                  {educationLevels.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error ? <p className="auth-error">{error}</p> : null}

            <button className="auth-primary-btn" type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Create Account
            </button>
          </form>

          <p className="auth-footer-text">
            Already have an account?{" "}
            <Link to="/login" className="auth-link">
              Login
            </Link>
          </p>
        </div>
      </div>
    </PublicOnly>
  );
}