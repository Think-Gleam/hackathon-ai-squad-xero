import { Bot, Loader2, Mic, MicOff, Play, SendHorizontal, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { requestAiTutorReply } from "@/lib/apiConfig";
import { logAgentStep, logVoiceUsage } from "@/lib/learning-flow";
import { logLearningActivity } from "@/lib/gamification";

type ChatMessage = {
  role: "assistant" | "user";
  text: string;
};

const seedMessages: ChatMessage[] = [
  {
    role: "assistant",
    text: "Welcome to your AI Tutor workspace. Ask any concept and I’ll explain it step-by-step.",
  },
];

const AITutor = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>(seedMessages);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const [narrating, setNarrating] = useState(false);
  const [playingMessageIndex, setPlayingMessageIndex] = useState<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (currentAudioRef.current) currentAudioRef.current.pause();
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current);
        currentAudioUrlRef.current = null;
      }
    };
  }, []);

  const getVoiceId = () => {
    if (profile?.preferred_language === "urdu") return "EXAVITQu4vr4xnSDxMaL";
    if (profile?.preferred_language === "bilingual") return "XrExE9yKIg1WjnnlVkGX";
    return "JBFqnCBsd6RMkjVDRZzb";
  };

  const speakMessage = async (messageText: string, messageIndex: number) => {
    if (!profile?.id) return;
    if (currentAudioRef.current) currentAudioRef.current.pause();
    if (currentAudioUrlRef.current) {
      URL.revokeObjectURL(currentAudioUrlRef.current);
      currentAudioUrlRef.current = null;
    }

    setNarrating(true);
    setPlayingMessageIndex(messageIndex);

    const { data, error } = await supabase.functions.invoke("elevenlabs-tts", {
      body: {
        text: messageText,
        voiceId: getVoiceId(),
        language: profile.preferred_language,
      },
    });

    if (error || !data || !(data instanceof Blob)) {
      setNarrating(false);
      setPlayingMessageIndex(null);
      toast({ title: "Narration failed", description: "Could not play this response.", variant: "destructive" });
      await logVoiceUsage({ profileId: profile.id, provider: "elevenlabs", mode: "tts", inputText: messageText, status: "failed" });
      return;
    }

    const audioUrl = URL.createObjectURL(data);
    currentAudioUrlRef.current = audioUrl;
    const audio = new Audio(audioUrl);
    currentAudioRef.current = audio;
    audio.onended = async () => {
      setNarrating(false);
      setPlayingMessageIndex(null);
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current);
        currentAudioUrlRef.current = null;
      }
      await logVoiceUsage({ profileId: profile.id, provider: "elevenlabs", mode: "tts", inputText: messageText, status: "success" });
    };

    try {
      await audio.play();
    } catch {
      setNarrating(false);
      setPlayingMessageIndex(null);
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current);
        currentAudioUrlRef.current = null;
      }
      toast({ title: "Narration blocked", description: "Your browser blocked autoplay. Tap play again.", variant: "destructive" });
      await logVoiceUsage({ profileId: profile.id, provider: "elevenlabs", mode: "tts", inputText: messageText, status: "failed" });
    }
  };

  const toggleListening = async () => {
    const speechCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!speechCtor) {
      toast({ title: "Voice input unavailable", description: "Your browser does not support speech recognition." });
      return;
    }

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    const recognition = new speechCtor();
    recognitionRef.current = recognition;
    recognition.lang = profile?.preferred_language === "urdu" ? "ur-PK" : "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = async (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? "";
      setDraft((prev) => (prev ? `${prev} ${transcript}` : transcript));
      if (profile?.id && transcript) {
        await logVoiceUsage({ profileId: profile.id, provider: "browser-stt", mode: "stt", transcriptText: transcript });
      }
    };

    recognition.onerror = () => {
      setListening(false);
      toast({ title: "Could not capture voice", description: "Please try speaking again." });
    };

    recognition.onend = () => setListening(false);

    setListening(true);
    recognition.start();
  };

  const sendMessage = async () => {
    const content = draft.trim();
    if (!content || thinking || !profile?.id) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", text: content }];
    setMessages(nextMessages);
    setDraft("");
    setThinking(true);

    try {
      const reply = await requestAiTutorReply(
        nextMessages.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.text })),
        profile.preferred_language,
      );

      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);

      await logAgentStep({
        profileId: profile.id,
        agent: "tutor",
        inputPayload: { message: content, language: profile.preferred_language },
        outputPayload: { responseLength: reply.length },
      });

      await logLearningActivity({
        profileId: profile.id,
        activityType: "lesson_interaction",
        metadata: { channel: "ai_tutor", inputLength: content.length },
      });
    } catch (error) {
      toast({
        title: "AI Tutor unavailable",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setThinking(false);
    }
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
            <p className="text-sm text-muted-foreground">Always-available adaptive tutor with voice-first, bilingual support.</p>
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
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none text-foreground dark:prose-invert">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
                    </div>
                  ) : (
                    message.text
                  )}
                </div>
                {message.role === "assistant" && lessonContextExists ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => void speakMessage(message.text, index)}
                    disabled={narrating && playingMessageIndex !== index}
                  >
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
                    {playingMessageIndex === index ? "Audio Agent is synthesizing..." : "Listen to the Tutor"}
                  </Button>
                ) : null}
              </div>
            </div>
          ))}

          {thinking ? (
            <div className="flex justify-start">
              <div className="rounded-md border border-border bg-secondary/35 px-4 py-3 text-sm text-foreground">
                <span className="mr-2">Curriculum Agent is thinking...</span>
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
                  void sendMessage();
                }
              }}
              placeholder="Ask your tutor anything..."
            />
            <Button
              type="button"
              variant={listening ? "destructive" : "outline"}
              size="icon"
              onClick={() => void toggleListening()}
              className={listening ? "animate-pulse" : ""}
              aria-label={listening ? "Stop listening" : "Start listening"}
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button type="button" size="icon" onClick={() => void sendMessage()} disabled={!draft.trim() || thinking} aria-label="Send message">
              {thinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
            </Button>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Volume2 className="h-3.5 w-3.5" /> Voice output: ElevenLabs</span>
            <span className="inline-flex items-center gap-1"><Mic className="h-3.5 w-3.5" /> Voice input: Browser STT</span>
          </div>
        </footer>
      </div>
    </section>
  );
};

export default AITutor;
  const lessonContextExists = messages.some((message) => message.role === "assistant" && message.text.trim().length > 0);
