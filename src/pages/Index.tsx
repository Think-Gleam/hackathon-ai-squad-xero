import {
  BarChart3,
  BookOpen,
  Bot,
  CheckCircle2,
  Flame,
  Lock,
  Medal,
  Mic,
  Play,
  SendHorizontal,
  Settings,
  Sparkles,
  Star,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ViewMode = "dashboard" | "chat";

const navItems: { label: string; icon: typeof BarChart3; view?: ViewMode }[] = [
  { label: "Dashboard", icon: BarChart3, view: "dashboard" },
  { label: "My Learning Path", icon: BookOpen },
  { label: "AI Tutor Chat", icon: Bot, view: "chat" },
  { label: "Settings", icon: Settings },
];

type ChatMessage = {
  role: "ai" | "user";
  text: string;
};

const initialMessages: ChatMessage[] = [
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

const activeSubjects = [
  {
    name: "Mathematics",
    description: "Build confidence in algebra and problem-solving with guided examples and adaptive practice.",
    progress: 40,
  },
  {
    name: "Physics",
    description: "Understand motion, forces, and energy through practical scenarios and exam-ready drills.",
    progress: 15,
  },
  {
    name: "Computer Science",
    description: "Strengthen core concepts with coding logic, structured exercises, and real project mini-tasks.",
    progress: 80,
  },
];

const Index = () => {
  const [activeView, setActiveView] = useState<ViewMode>("chat");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [playingMessageIndex, setPlayingMessageIndex] = useState<number | null>(null);
  const responseTimeoutRef = useRef<number | null>(null);
  const audioTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (responseTimeoutRef.current) {
        window.clearTimeout(responseTimeoutRef.current);
      }

      if (audioTimeoutRef.current) {
        window.clearTimeout(audioTimeoutRef.current);
      }
    };
  }, []);

  const handleSendMessage = () => {
    const trimmedMessage = inputValue.trim();
    if (!trimmedMessage || isThinking) return;

    setChatMessages((prev) => [...prev, { role: "user", text: trimmedMessage }]);
    setInputValue("");
    setIsThinking(true);

    responseTimeoutRef.current = window.setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "That is a great question! Let me break that down for you step-by-step based on your current level...",
        },
      ]);
      setIsThinking(false);
    }, 2000);
  };

  const handleToggleAudio = (messageIndex: number) => {
    if (audioTimeoutRef.current) {
      window.clearTimeout(audioTimeoutRef.current);
    }

    if (playingMessageIndex === messageIndex) {
      setPlayingMessageIndex(null);
      return;
    }

    setPlayingMessageIndex(messageIndex);
    audioTimeoutRef.current = window.setTimeout(() => {
      setPlayingMessageIndex(null);
    }, 2400);
  };

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
            {navItems.map(({ label, icon: Icon, view }) => (
              <button
                key={label}
                onClick={() => {
                  if (view) {
                    setActiveView(view);
                  }
                }}
                className={`nav-item w-full ${activeView === view ? "nav-item-active" : ""}`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {activeView === "dashboard" ? (
          <section className="glass-pane animate-enter p-5 lg:col-span-2">
            <header className="surface-card rounded-lg p-6 md:p-8">
              <h1 className="title-gradient text-3xl md:text-4xl">Welcome back, Learner! 🚀</h1>
              <p className="mt-2 text-sm md:text-base text-muted-foreground">
                Your personalized momentum is building — continue your journey with focused consistency.
              </p>
            </header>

            <section className="mt-5 grid gap-4 md:grid-cols-3">
              <article className="glass-card rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-accent/15 text-accent">
                    <Flame className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Current Streak</p>
                    <p className="text-xs text-muted-foreground">No of Days User logged in and studied</p>
                  </div>
                </div>
                <p className="mt-3 text-2xl font-semibold text-foreground">12 Days</p>
              </article>

              <article className="glass-card rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary/15 text-primary">
                    <Star className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Total Mastery Points</p>
                    <p className="text-xs text-muted-foreground">Score based on commitment XP</p>
                  </div>
                </div>
                <p className="mt-3 text-2xl font-semibold text-foreground">2,450 XP</p>
              </article>

              <article className="glass-card rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                    <Medal className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Recent Badges</p>
                    <p className="text-xs text-muted-foreground">Badge Name: Issue based on performance</p>
                  </div>
                </div>
                <p className="mt-3 text-base font-semibold text-foreground">Consistency Champion</p>
              </article>
            </section>

            <section className="mt-6">
              <h2 className="text-xl text-foreground">My Active Subjects</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {activeSubjects.map((subject) => (
                  <article key={subject.name} className="surface-card rounded-lg p-4 hover-scale">
                    <h3 className="text-lg text-foreground">{subject.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{subject.description}</p>
                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                        <span>Progress</span>
                        <span>{subject.progress}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${subject.progress}%` }} />
                      </div>
                    </div>
                    <button className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:scale-105">
                      Resume
                    </button>
                  </article>
                ))}
              </div>
            </section>
          </section>
        ) : (
          <>
            <section className="glass-pane flex min-h-[75vh] flex-col animate-enter">
              <header className="border-b border-border/70 px-5 py-4">
                <h1 className="title-gradient text-2xl md:text-3xl">AI Tutor Chat</h1>
                <p className="mt-1 text-sm text-muted-foreground">Personalized, voice-friendly guidance with adaptive explanations.</p>
              </header>

              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[82%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-2`}>
                      <div className={msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai hover-scale"}>
                        {msg.role === "ai" ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                          </div>
                        ) : (
                          msg.text
                        )}
                      </div>
                      {msg.role === "ai" && lessonContextExists ? (
                        <button
                          onClick={() => handleToggleAudio(idx)}
                          className="inline-flex items-center gap-2 rounded-md border border-primary/35 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-all duration-200 hover:bg-primary/20"
                        >
                          {playingMessageIndex === idx ? (
                            <span className="audio-equalizer" aria-label="Audio playing animation">
                              <span />
                              <span />
                              <span />
                              <span />
                            </span>
                          ) : (
                            <Play className="h-3.5 w-3.5" />
                          )}
                          {playingMessageIndex === idx ? "Reading..." : "Listen to the Tutor"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}

                {isThinking ? (
                  <div className="flex justify-start">
                    <div className="max-w-[82%]">
                      <div className="chat-bubble-ai flex items-center gap-2">
                        <span className="text-sm text-card-foreground">Curriculum Agent is thinking...</span>
                        <span className="typing-dots" aria-label="AI typing indicator">
                          <span />
                          <span />
                          <span />
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <footer className="border-t border-border/70 p-4">
                <div className="glass-card flex items-center gap-2 rounded-lg px-2 py-2">
                  <input
                    type="text"
                    placeholder="Ask EduMentor AI anything about today’s topic..."
                    className="h-10 w-full rounded-md border-0 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <button
                    onClick={() => setIsListening((prev) => !prev)}
                    aria-pressed={isListening}
                    aria-label={isListening ? "Stop listening" : "Start listening"}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-md border transition-colors ${
                      isListening
                        ? "border-destructive/40 bg-destructive/15 text-destructive animate-pulse"
                        : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleSendMessage}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground transition-transform duration-200 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!inputValue.trim() || isThinking}
                  >
                    <SendHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </footer>
            </section>

            <aside className="glass-pane context-panel animate-slide-in-right p-4 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
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
                <ol className="stepper-list">
                  <li className="stepper-item is-complete">
                    <span className="stepper-marker" aria-hidden="true">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <div className="stepper-content">
                      <p className="stepper-title">Assess Current Knowledge</p>
                    </div>
                  </li>

                  <li className="stepper-item is-active">
                    <span className="stepper-marker" aria-hidden="true">2</span>
                    <div className="stepper-content">
                      <div className="flex items-center justify-between gap-3">
                        <p className="stepper-title">Learn Core Concepts</p>
                        <span className="rounded-md bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">Active</span>
                      </div>
                    </div>
                  </li>

                  <li className="stepper-item is-locked">
                    <span className="stepper-marker" aria-hidden="true">
                      <Lock className="h-3.5 w-3.5" />
                    </span>
                    <div className="stepper-content">
                      <p className="stepper-title">Practice Quiz</p>
                    </div>
                  </li>
                </ol>
                <div className="mt-4 inline-flex items-center gap-2 rounded-md bg-secondary/70 px-3 py-2 text-xs font-semibold text-secondary-foreground">
                  <Sparkles className="h-3.5 w-3.5" />
                  Adaptive mode enabled
                </div>
              </article>
            </aside>
          </>
        )}
      </div>
    </main>
  );
};

export default Index;
  const lessonContextExists = chatMessages.some((message) => message.role === "ai" && message.text.trim().length > 0);
