import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { AuthGate } from "@/components/auth-gate";
import { useAuth } from "@/components/auth-provider";
import { courses } from "@/lib/courses";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const onboardingSchema = z.object({
  interests: z.array(z.string()).min(1, "Select at least one learning interest."),
  city: z.string().max(120, "City must be 120 characters or less.").optional(),
});

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((item) => item !== interest) : [...prev, interest],
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsed = onboardingSchema.safeParse({
      interests: selectedInterests,
      city,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please complete onboarding details.");
      return;
    }

    if (!user) {
      setError("You need to be logged in to complete onboarding.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        city: parsed.data.city?.trim() || null,
        learning_interests: parsed.data.interests,
        onboarding_completed: true,
      })
      .eq("id", user.id);
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    toast.success("Onboarding completed. Welcome to EduMentor!");
    navigate({ to: "/" });
  };

  return (
    <AuthGate>
      <div className="auth-page">
        <div className="auth-card auth-card-wide">
          <p className="auth-kicker">Personalize your learning</p>
          <h1 className="auth-title">Quick Onboarding</h1>
          <p className="auth-subtitle">Tell us what you want to learn, and we’ll adapt your dashboard.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-label">What do you want to learn?</label>
            <div className="auth-tag-grid">
              {courses.map((course) => {
                const isSelected = selectedInterests.includes(course.title);
                return (
                  <button
                    key={course.id}
                    type="button"
                    className={`auth-tag ${isSelected ? "is-selected" : ""}`}
                    onClick={() => toggleInterest(course.title)}
                  >
                    {course.title}
                  </button>
                );
              })}
            </div>

            <label className="auth-label" htmlFor="onboarding-city">
              Your City (Optional)
            </label>
            <input
              id="onboarding-city"
              className="auth-input"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="Lahore"
            />

            {error ? <p className="auth-error">{error}</p> : null}

            <button className="auth-primary-btn" type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Continue to Dashboard
            </button>
          </form>
        </div>
      </div>
    </AuthGate>
  );
}