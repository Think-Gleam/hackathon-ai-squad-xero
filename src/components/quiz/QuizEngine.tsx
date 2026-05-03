import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { requestAdaptiveQuizQuestions, type QuizQuestion } from "@/lib/apiConfig";

type QuizEngineProps = {
  topic: string;
  preferredLanguage?: string | null;
  onSubmit: (result: { scorePercent: number; questionCount: number; correctCount: number }) => Promise<void>;
};

const QuizEngine = ({ topic, preferredLanguage, onSubmit }: QuizEngineProps) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadQuestions = async () => {
      setLoadingQuestions(true);
      setQuestionsError(null);
      setSubmitted(false);
      setSelectedAnswers({});

      try {
        const generated = await requestAdaptiveQuizQuestions(topic, preferredLanguage, 4);
        if (mounted) setQuestions(generated.slice(0, 5));
      } catch (error) {
        if (mounted) {
          setQuestions([]);
          setQuestionsError(error instanceof Error ? error.message : "Could not load quiz questions.");
        }
      } finally {
        if (mounted) setLoadingQuestions(false);
      }
    };

    void loadQuestions();
    return () => {
      mounted = false;
    };
  }, [topic, preferredLanguage]);

  const { correctCount, scorePercent, allAnswered } = useMemo(() => {
    const count = questions.reduce((sum, item) => sum + (selectedAnswers[item.id] === item.correctIndex ? 1 : 0), 0);
    const answered = questions.length > 0 && questions.every((item) => selectedAnswers[item.id] !== undefined);
    const score = questions.length ? Math.round((count / questions.length) * 100) : 0;
    return { correctCount: count, scorePercent: score, allAnswered: answered };
  }, [questions, selectedAnswers]);

  const submit = async () => {
    if (!allAnswered || questions.length === 0 || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({ scorePercent, questionCount: questions.length, correctCount });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingQuestions) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> AI is generating your adaptive quiz...
        </p>
      </div>
    );
  }

  if (questionsError) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-3">
        <p className="text-sm text-destructive">{questionsError}</p>
        <p className="text-xs text-muted-foreground">Try switching module or refreshing the page.</p>
      </div>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-4">
      <h2 className="text-xl font-semibold">Quiz Agent: Adaptive check</h2>
      <div className="space-y-3">
        {questions.map((question) => {
          const selected = selectedAnswers[question.id];
          return (
            <article key={question.id} className="rounded-md border border-border bg-secondary/30 p-3 space-y-2">
              <p className="text-sm font-medium text-foreground">{question.prompt}</p>
              <div className="grid gap-2">
                {question.options.map((option, index) => {
                  const isSelected = selected === index;
                  const isCorrect = submitted && index === question.correctIndex;
                  const isWrong = submitted && isSelected && index !== question.correctIndex;

                  return (
                    <button
                      key={`${question.id}-${option}`}
                      type="button"
                      onClick={() => setSelectedAnswers((prev) => ({ ...prev, [question.id]: index }))}
                      disabled={submitted}
                      className={`flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                        isCorrect
                          ? "border-primary bg-primary/10 text-foreground"
                          : isWrong
                            ? "border-destructive/70 bg-destructive/10 text-foreground"
                            : isSelected
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border bg-background text-muted-foreground"
                      }`}
                    >
                      <span>{option}</span>
                      {isCorrect ? <CheckCircle2 className="h-4 w-4 text-primary" /> : null}
                      {isWrong ? <XCircle className="h-4 w-4 text-destructive" /> : null}
                    </button>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>

      {submitted ? (
        <p className="text-sm text-foreground">
          Final score: <span className="font-semibold">{scorePercent}%</span> ({correctCount}/{questions.length})
        </p>
      ) : null}

      <Button onClick={() => void submit()} disabled={!allAnswered || submitting || submitted}>
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {submitted ? "Quiz submitted" : "Submit adaptive quiz"}
      </Button>
    </section>
  );
};

export default QuizEngine;
