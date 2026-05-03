import { Bell, Loader2, Shield, User2 } from "lucide-react";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";

const SettingsPage = () => {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState<"english" | "urdu" | "bilingual">("english");
  const [educationLevel, setEducationLevel] = useState<
    "primary" | "middle" | "secondary" | "higher_secondary" | "undergraduate" | "postgraduate" | "other"
  >("other");

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setCity(profile.city ?? "");
    setPreferredLanguage(profile.preferred_language ?? "english");
    setEducationLevel(profile.current_education_level ?? "other");
  }, [profile]);

  const saveProfile = async () => {
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      toast({ title: "Name is required", description: "Please enter your full name.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        full_name: trimmedName,
        city: city.trim() || null,
        preferred_language: preferredLanguage,
        current_education_level: educationLevel,
      });
      toast({ title: "Profile updated", description: "Your profile details were saved successfully." });
    } catch (error) {
      toast({
        title: "Could not save profile",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6 animate-fade-in">
      <header className="space-y-2">
        <h1 className="text-3xl font-display">Settings</h1>
        <p className="text-sm text-muted-foreground">Control profile details, notifications, privacy, and learning preferences.</p>
      </header>

      <article className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <User2 className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">Profile details</p>
            <p className="text-sm text-muted-foreground">Update your name and preferences anytime.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-foreground">
            Full name
            <Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your full name" />
          </label>

          <label className="space-y-2 text-sm font-medium text-foreground">
            City
            <Input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Optional city" />
          </label>

          <label className="space-y-2 text-sm font-medium text-foreground">
            Preferred language
            <select
              value={preferredLanguage}
              onChange={(event) => setPreferredLanguage(event.target.value as "english" | "urdu" | "bilingual")}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
            >
              <option value="english">English</option>
              <option value="urdu">Urdu</option>
              <option value="bilingual">Bilingual</option>
            </select>
          </label>

          <label className="space-y-2 text-sm font-medium text-foreground">
            Education level
            <select
              value={educationLevel}
              onChange={(event) =>
                setEducationLevel(
                  event.target.value as "primary" | "middle" | "secondary" | "higher_secondary" | "undergraduate" | "postgraduate" | "other",
                )
              }
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
            >
              <option value="primary">Primary</option>
              <option value="middle">Middle</option>
              <option value="secondary">Secondary</option>
              <option value="higher_secondary">Higher Secondary</option>
              <option value="undergraduate">Undergraduate</option>
              <option value="postgraduate">Postgraduate</option>
              <option value="other">Other</option>
            </select>
          </label>
        </div>

        <Button onClick={saveProfile} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save profile
        </Button>
      </article>

      <div className="space-y-4">
        <article className="flex items-center justify-between rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Daily reminders</p>
              <p className="text-sm text-muted-foreground">Receive reminders for your scheduled sessions.</p>
            </div>
          </div>
          <Switch defaultChecked />
        </article>

        <article className="flex items-center justify-between rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Privacy-safe learning analytics</p>
              <p className="text-sm text-muted-foreground">Allow adaptive recommendations based on progress.</p>
            </div>
          </div>
          <Switch defaultChecked />
        </article>
      </div>
    </section>
  );
};

export default SettingsPage;