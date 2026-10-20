"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { answerQuestionAction, finishAttemptAction } from "@/actions/questions";
import { Button } from "@/components/Button";
import { Card, CardTitle } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { ProgressBar } from "@/components/Feedback";

type RunnerQuestion = {
  id: string;
  statement: string;
  type: string;
  options: string[];
  subjectId: string | null;
};

export function QuizRunner({
  attemptId,
  title,
  mode,
  timeLimitSeconds,
  questions,
  startedAt,
}: {
  attemptId: string;
  quizId: string;
  title: string;
  mode: string;
  timeLimitSeconds: number;
  questions: RunnerQuestion[];
  startedAt: string;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<Record<string, number | null>>({});
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const questionStarted = useRef<number>(Date.now());
  const elapsedRef = useRef<number>(0);

  const remaining =
    timeLimitSeconds > 0
      ? Math.max(
          0,
          timeLimitSeconds - Math.round((Date.now() - new Date(startedAt).getTime()) / 1000),
        )
      : null;

  const [secondsLeft, setSecondsLeft] = useState<number | null>(remaining);

  useEffect(() => {
    if (timeLimitSeconds <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null) return prev;
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(id);
          finish(true);
        }
        return Math.max(0, next);
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLimitSeconds]);

  const q = questions[index];
  const answeredCount = Object.values(chosen).filter((v) => v !== null && v !== undefined).length;

  function select(optionIndex: number) {
    if (!q) return;
    const secondsSpent = Math.round((Date.now() - questionStarted.current) / 1000);
    elapsedRef.current += secondsSpent;
    questionStarted.current = Date.now();
    setChosen({ ...chosen, [q.id]: optionIndex });
    startTransition(async () => {
      const state = await answerQuestionAction({
        attemptId,
        questionId: q.id,
        chosenIndex: optionIndex,
        secondsSpent,
      });
      if (!state.ok) setError(state.error ?? "Erro ao registrar resposta.");
    });
  }

  function finish(auto = false) {
    startTransition(async () => {
      const state = await finishAttemptAction({ attemptId });
      if (!state.ok) {
        setError(state.error ?? "Erro ao finalizar.");
        return;
      }
      router.push(`/simulados/resultado/${attemptId}${auto ? "?tempo=esgotado" : ""}`);
    });
  }

  if (!q) {
    return (
      <Card>
        <CardTitle>Nenhuma questão neste simulado.</CardTitle>
        <Button className="mt-3" variant="primario" onClick={() => finish()}>
          Finalizar
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-latao">{mode === "simulado" ? "Simulado" : "Prática"}</p>
          <h1 className="font-titulo text-2xl font-bold">{title}</h1>
        </div>
        <div className="text-right">
          <p className="text-sm text-cinza">
            Questão {index + 1} de {questions.length}
          </p>
          {secondsLeft !== null ? (
            <p className={`font-titulo text-xl ${secondsLeft < 60 ? "text-alerta-claro" : "text-latao"}`}>
              {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
            </p>
          ) : (
            <Badge tone="neutro">sem limite de tempo</Badge>
          )}
        </div>
      </header>

      <ProgressBar pct={((index + 1) / questions.length) * 100} label={`Progresso · ${answeredCount} respondida(s)`} />

      <Card>
        <CardTitle className="text-base leading-relaxed">{q.statement}</CardTitle>
        <ul className="mt-4 space-y-2">
          {q.options.map((opt, i) => {
            const selected = chosen[q.id] === i;
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => select(i)}
                  disabled={pending}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    selected
                      ? "border-latao bg-latao/15 text-pergaminho"
                      : "border-white/12 text-cinza hover:border-latao/50 hover:text-pergaminho"
                  }`}
                >
                  <span className="mr-2 font-semibold text-latao">{String.fromCharCode(65 + i)})</span>
                  {opt}
                </button>
              </li>
            );
          })}
        </ul>
        {error ? (
          <p role="alert" className="mt-3 text-sm text-alerta-claro">
            {error}
          </p>
        ) : null}
        {mode === "simulado" ? (
          <p className="mt-3 text-xs text-cinza-escuro">
            Gabarito oculto até a entrega, como configurado no modo simulado.
          </p>
        ) : null}
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant="fantasma" onClick={() => setIndex(Math.max(0, index - 1))} disabled={index === 0}>
          Anterior
        </Button>
        <Button
          variant="secundario"
          onClick={() => setIndex(Math.min(questions.length - 1, index + 1))}
          disabled={index >= questions.length - 1}
        >
          Próxima
        </Button>
        <Button variant="primario" onClick={() => finish()} disabled={pending}>
          {pending ? "Finalizando…" : "Entregar"}
        </Button>
      </div>
    </div>
  );
}
