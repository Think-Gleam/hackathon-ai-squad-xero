import { Bot, Mic, Play, SendHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ChatMessage = {
  role: "ai" | "user";
  text: string;
};

const seedMessages: ChatMessage[] = [
  {
    role: "ai",
    text: "Welcome to your AI Tutor workspace. Ask any concept and I’ll explain it step-by-step.",
  },
];

const AiTutorPage = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(seedMessages);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const [playingMessageIndex, setPlayingMessageIndex] = useState<number | null>(null);
  const thinkingTimeoutRef = useRef<number | null>(null);
  const audioTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (thinkingTimeoutRef.current) window.clearTimeout(thinkingTimeoutRef.current);
      if (audioTimeoutRef.current) window.clearTimeout(audioTimeoutRef.current);
    };
  }, []);

  const sendMessage = () => {
    const content = draft.trim();
    if (!content || thinking) return;

    setMessages((prev) => [...prev, { role: "user", text: content }]);
    setDraft("");
    setThinking(true);

    thinkingTimeoutRef.current = window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "That is a great question! Let me break that down for you step-by-step based on your current level...",
        },
      ]);
      setThinking(false);
    }, 1800);
  };

  const toggleAudio = (index: number) => {
    if (audioTimeoutRef.current) window.clearTimeout(audioTimeoutRef.current);
    if (playingMessageIndex === index) {
      setPlayingMessageIndex(null);
      return;
    }
    setPlayingMessageIndex(index);
    audioTimeoutRef.current = window.setTimeout(() => setPlayingMessageIndex(null), 2400);
  };

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-5 animate-fade-in">
      <header className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Bot className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-display">AI Tutor</h1>
            <p className="text-sm text-muted-foreground">Personalized guidance with text and voice support.</p>
          </div>
        </div>
      </header>

      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="max-h-[60vh] space-y-4 overflow-y-auto p-5">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[85%] space-y-2">
                <div
                  className={`rounded-md px-4 py-3 text-sm ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-secondary/35 text-foreground"
                  }`}
                >
                  {message.text}
                </div>
                {message.role === "ai" ? (
                  <Button variant="outline" size="sm" className="h-8" onClick={() => toggleAudio(index)}>
                    {playingMessageIndex === index ? (
                      <span className="audio-equalizer" aria-label="Audio playing animation">
                        <span />
                        <span />
                        <span />
                        <span />
                      </span>
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                    {playingMessageIndex === index ? "Reading..." : "Play Audio"}
                  </Button>
                ) : null}
              </div>
            </div>
          ))}

          {thinking ? (
            <div className="flex justify-start">
              <div className="rounded-md border border-border bg-secondary/35 px-4 py-3 text-sm text-foreground">
                <span className="mr-2">AI is thinking</span>
                <span className="typing-dots" aria-label="AI typing indicator">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            </div>
          ) : null}
        </div>

        <footer className="border-t border-border p-4">
          <div className="flex items-center gap-2">
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask your tutor anything..."
            />
            <Button
              type="button"
              variant={listening ? "destructive" : "outline"}
              size="icon"
              onClick={() => setListening((previous) => !previous)}
              className={listening ? "animate-pulse" : ""}
              aria-label={listening ? "Stop listening" : "Start listening"}
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Button type="button" size="icon" onClick={sendMessage} disabled={!draft.trim() || thinking} aria-label="Send message">
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </footer>
      </div>
    </section>
  );
};

export default AiTutorPage;