import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Pause, Play, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type VoiceOption = {
  id: string;
  label: string;
};

const VOICES: VoiceOption[] = [
  { id: "JBFqnCBsd6RMkjVDRZzb", label: "George" },
  { id: "EXAVITQu4vr4xnSDxMaL", label: "Sarah" },
  { id: "IKne3meq5aSn9XLyUdCD", label: "Charlie" },
  { id: "XrExE9yKIg1WjnnlVkGX", label: "Matilda" },
];

const defaultPrompt =
  "Welcome to EduMentor. We adapt your learning path based on your pace, performance, and goals so you build mastery with confidence.";

export const VoiceNarrator = () => {
  const [text, setText] = useState(defaultPrompt);
  const [voiceId, setVoiceId] = useState(VOICES[0].id);
  const [status, setStatus] = useState<"idle" | "loading" | "playing" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeUrlRef = useRef<string | null>(null);

  const statusLabel = useMemo(() => {
    if (status === "loading") return "Generating narration...";
    if (status === "playing") return "Playing";
    if (status === "error") return "Could not generate audio";
    return "Ready";
  }, [status]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (activeUrlRef.current) {
        URL.revokeObjectURL(activeUrlRef.current);
      }
    };
  }, []);

  const playNarration = async () => {
    const normalizedText = text.trim();
    if (!normalizedText) {
      setStatus("error");
      setErrorMessage("Add text to narrate.");
      return;
    }

    setStatus("loading");
    setErrorMessage(null);

    const { data, error } = await supabase.functions.invoke("elevenlabs-tts", {
      body: {
        text: normalizedText,
        voiceId,
      },
    });

    if (error || !data) {
      setStatus("error");
      setErrorMessage("Voice generation failed. Please try again.");
      return;
    }

    if (!(data instanceof Blob)) {
      setStatus("error");
      setErrorMessage("Unexpected audio response.");
      return;
    }

    if (activeUrlRef.current) {
      URL.revokeObjectURL(activeUrlRef.current);
    }

    const audioUrl = URL.createObjectURL(data);
    activeUrlRef.current = audioUrl;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onended = () => setStatus("idle");
    audio.onerror = () => {
      setStatus("error");
      setErrorMessage("Audio playback failed.");
    };

    try {
      await audio.play();
      setStatus("playing");
    } catch {
      setStatus("error");
      setErrorMessage("Your browser blocked autoplay. Tap play again.");
    }
  };

  const stopNarration = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setStatus("idle");
  };

  return (
    <section className="surface-card rounded-lg p-6 md:p-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-2xl text-foreground">Voice Mode</h2>
          <p className="text-sm text-muted-foreground">Generate lesson narration with ElevenLabs in real time.</p>
        </div>
        <Badge variant={status === "error" ? "destructive" : "secondary"}>{statusLabel}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="min-h-32 resize-y rounded-lg bg-card text-base"
          placeholder="Type a lesson snippet to narrate..."
        />
        <label className="space-y-2 text-sm font-semibold text-foreground">
          Voice
          <select
            value={voiceId}
            onChange={(event) => setVoiceId(event.target.value)}
            className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {VOICES.map((voice) => (
              <option key={voice.id} value={voice.id}>
                {voice.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button
          variant="hero"
          onClick={playNarration}
          disabled={status === "loading"}
          className="min-w-40"
        >
          {status === "loading" ? <Loader2 className="animate-spin" /> : <Play />}
          Play narration
        </Button>
        <Button variant="glass" onClick={stopNarration} disabled={status !== "playing"} className="min-w-36">
          <Pause />
          Stop
        </Button>
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Volume2 className="h-4 w-4" />
          Accessible voice-first learning
        </div>
      </div>

      {errorMessage ? <p className="mt-3 text-sm text-destructive">{errorMessage}</p> : null}
    </section>
  );
};