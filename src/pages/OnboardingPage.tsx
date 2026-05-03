import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

const learningOptions = ["AI Fundamentals", "Machine Learning", "Python Programming"];

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, refreshProfile } = useAuth();

  const [selectedGoals, setSelectedGoals] = useState<string[]>(["AI Fundamentals"]);
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleGoal = (goal: string) => {
    setSelectedGoals((previous) =>
      previous.includes(goal) ? previous.filter((item) => item !== goal) : [...previous, goal],
    );
  };

  const handleFinish = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!session?.user?.id) {
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        city: city.trim() || null,
        learning_goals: selectedGoals,
        onboarding_interests: selectedGoals,
        onboarding_completed: true,
      })
      .eq("id", session.user.id);

    setLoading(false);

    if (error) {
      toast({ title: "Could not save onboarding", description: error.message, variant: "destructive" });
      return;
    }

    await refreshProfile();
    toast({ title: "Onboarding complete", description: "Your personalized dashboard is ready." });
    navigate("/", { replace: true });
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-2xl rounded-lg border border-border bg-card p-6 shadow-sm md:p-7">
        <h1 className="text-2xl font-display">Let&apos;s personalize your learning</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pick what you want to focus on and we’ll adapt your dashboard.</p>

        <form className="mt-6 space-y-5" onSubmit={handleFinish}>
          <div className="space-y-3">
            <Label>What do you want to learn?</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {learningOptions.map((goal) => {
                const selected = selectedGoals.includes(goal);
                return (
                  <button
                    type="button"
                    key={goal}
                    onClick={() => toggleGoal(goal)}
                    className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                      selected ? "border-primary bg-primary/10 text-foreground" : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    {goal}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">Your City (Optional)</Label>
            <Input id="city" value={city} onChange={(event) => setCity(event.target.value)} placeholder="Lahore" maxLength={120} />
          </div>

          <Button type="submit" disabled={loading || selectedGoals.length === 0} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Finish Onboarding
          </Button>
        </form>
      </div>
    </section>
  );
};

export default OnboardingPage;