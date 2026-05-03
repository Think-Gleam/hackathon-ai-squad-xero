import {
  BarChart3,
  BookOpen,
  Bot,
  Lock,
  Mic,
  Play,
  SendHorizontal,
  Settings,
  Sparkles,
  User,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: BarChart3, active: true },
  { label: "My Learning Path", icon: BookOpen, active: false },
  { label: "AI Tutor Chat", icon: Bot, active: false },
  { label: "Settings", icon: Settings, active: false },
];

const messages = [
  {
    role: "ai",
    text: "Welcome back, Areeba. Ready to continue Algebra with real-world examples from Karachi startup budgeting?",
  },
  {
    role: "user",
    text: "Yes, but keep it simple and give me one practice question first.",
  },
  {
    role: "ai",
    text: "Great. If a shop sells 2 notebooks for 240 PKR and 5 notebooks for 510 PKR, can you form the linear equations and solve for unit price?",
  },
];

const Index = () => {
  return (
    <main className="page-surface min-h-screen overflow-x-hidden">
      <div className="ambient-grid pointer-events-none fixed inset-0 opacity-45" aria-hidden="true" />

      <div className="dashboard-shell animate-fade-in">
        <aside className="glass-pane animate-enter p-4 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
          <div className="surface-card mb-4 rounded-lg p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary/15 text-primary">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Areeba Khan</p>
                <p className="text-xs text-muted-foreground">Grade 11 • Lahore</p>
              </div>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">EduMentor AI says: “Small daily wins become mastery.”</p>
          </div>

          <nav className="space-y-1">
            {navItems.map(({ label, icon: Icon, active }) => (
              <button key={label} className={`nav-item w-full ${active ? "nav-item-active" : ""}`}>
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <section className="glass-pane flex min-h-[75vh] flex-col animate-enter">
          <header className="border-b border-border/70 px-5 py-4">
            <h1 className="title-gradient text-2xl md:text-3xl">AI Tutor Chat</h1>
            <p className="mt-1 text-sm text-muted-foreground">Personalized, voice-friendly guidance with adaptive explanations.</p>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[82%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-2`}>
                  <div className={msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai hover-scale"}>{msg.text}</div>
                  {msg.role === "ai" ? (
                    <button className="inline-flex items-center gap-2 rounded-md border border-border bg-card/75 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                      <Play className="h-3.5 w-3.5" />
                      Play Audio
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <footer className="border-t border-border/70 p-4">
            <div className="glass-card flex items-center gap-2 rounded-lg px-2 py-2">
              <input
                type="text"
                placeholder="Ask EduMentor AI anything about today’s topic..."
                className="h-10 w-full rounded-md border-0 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                <Mic className="h-4 w-4" />
              </button>
              <button className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground transition-transform duration-200 hover:scale-105">
                <SendHorizontal className="h-4 w-4" />
              </button>
            </div>
          </footer>
        </section>

        <aside className="glass-pane animate-slide-in-right p-4 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
          <h2 className="mb-3 text-lg text-foreground">Study Context</h2>

          <article className="surface-card mb-4 rounded-lg p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Mastery Score</p>
              <span className="text-sm font-semibold text-primary">65%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[65%] rounded-full bg-primary animate-pulse-soft" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Strong progress this week. Keep consistency for +10% gain.</p>
          </article>

          <article className="surface-card rounded-lg p-4">
            <p className="mb-3 text-sm font-semibold text-foreground">Micro-Syllabus</p>
            <ol className="space-y-3 text-sm">
              <li className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-primary">
                <span className="story-link">Step 1: Understand quadratic intuition</span>
              </li>
              <li className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-muted-foreground">
                <span>Step 2: Practice adaptive problems</span>
                <Lock className="h-4 w-4" />
              </li>
              <li className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-muted-foreground">
                <span>Step 3: Quiz and mastery checkpoint</span>
                <Lock className="h-4 w-4" />
              </li>
            </ol>
            <div className="mt-4 inline-flex items-center gap-2 rounded-md bg-secondary/70 px-3 py-2 text-xs font-semibold text-secondary-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Adaptive mode enabled
            </div>
          </article>
        </aside>
      </div>
    </main>
  );
};

export default Index;
