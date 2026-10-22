"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Badge } from "@/components/Badge";
import { answerCatalogQuizAction, finishCatalogQuizAction } from "@/actions/catalogQuiz";

export type QuestaoSimuladoView = {
  id: string;
  statement: string;
  options: string[];
  originNote: string;
  refLabel: string;
};

function formatarTempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function CatalogSimulado({
  attemptId,
  durationMinutes,
  questions,
  initialAnswers,
}: {
  attemptId: string;
  durationMinutes: number;
  questions: QuestaoSimuladoView[];
  initialAnswers: Record<string, number>;
}) {
  const [answers, setAnswers] = useState<Record<string, number>>(initialAnswers);
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [remaining, setRemaining] = useState(durationMinutes * 60);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const ended = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Tempo esgotado: finaliza sozinho.
  useEffect(() => {
    if (remaining > 0 || ended.current) return;
    ended.current = true;
    formRef.current?.requestSubmit();
  }, [remaining]);

  function responder(itemId: string, chosenIndex: number) {
    if (pending) return;
    setAnswers((a) => ({ ...a, [itemId]: chosenIndex }));
    setSaved((s) => ({ ...s, [itemId]: false }));
    startTransition(() => {
      void answerCatalogQuizAction({ attemptId, itemId, chosenIndex }).then(() => {
        setSaved((s) => ({ ...s, [itemId]: true }));
      });
    });
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="space-y-4">
      <div className="sticky top-2 z-10 flex flex-wrap items-center justify-between gap-2 rounded-md border border-white/10 bg-carvao/95 px-3 py-2 backdrop-blur">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-cinza">Respondidas:</span>
          <strong className="text-pergaminho">
            {answeredCount}/{questions.length}
          </strong>
          {pending ? <Badge tone="latiao">salvando...</Badge> : null}
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`font-mono text-sm ${remaining <= 60 ? "text-alerta" : "text-pergaminho"}`}
          >
            {formatarTempo(remaining)}
          </span>
          <form action={finishCatalogQuizAction} ref={formRef}>
            <input type="hidden" name="attemptId" value={attemptId} />
            <button
              type="submit"
              className="rounded-md border border-latao/50 bg-latao/10 px-3 py-1.5 text-sm text-latao hover:bg-latao/20"
            >
              Finalizar simulado
            </button>
          </form>
        </div>
      </div>

      <ol className="space-y-3">
        {questions.map((q, index) => {
          const chosen = answers[q.id];
          return (
            <li key={q.id} className="rounded-md border border-white/10 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-pergaminho">Questão {index + 1}</p>
                {chosen !== undefined ? (
                  <Badge tone={saved[q.id] ? "petroleo" : "latiao"}>
                    {saved[q.id] ? "registrada" : "salvando"}
                  </Badge>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-pergaminho/90">{q.statement}</p>
              <ul className="mt-3 space-y-1.5">
                {q.options.map((opt, i) => {
                  const isChosen = chosen === i;
                  return (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => responder(q.id, i)}
                        disabled={pending}
                        className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                          isChosen
                            ? "border-latao/50 bg-latao/10 text-pergaminho"
                            : "border-white/10 text-cinza hover:bg-white/5"
                        }`}
                      >
                        <span className="mr-2 font-medium">{String.fromCharCode(65 + i)}.</span>
                        {opt}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-xs text-cinza-escuro">{q.originNote}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
