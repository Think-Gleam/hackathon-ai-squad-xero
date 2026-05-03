import { Bell, Shield, User2 } from "lucide-react";

import { Switch } from "@/components/ui/switch";

const SettingsPage = () => {
  return (
    <section className="mx-auto w-full max-w-4xl space-y-6 animate-fade-in">
      <header className="space-y-2">
        <h1 className="text-3xl font-display">Settings</h1>
        <p className="text-sm text-muted-foreground">Control notifications, privacy, and learning preferences.</p>
      </header>

      <div className="space-y-4">
        <article className="flex items-center justify-between rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <User2 className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Profile visibility</p>
              <p className="text-sm text-muted-foreground">Show your learning streak on your profile.</p>
            </div>
          </div>
          <Switch defaultChecked />
        </article>

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