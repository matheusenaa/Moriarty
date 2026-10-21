"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/Badge";
import {
  answerCatalogQuestionAction,
  saveCatalogItemAction,
  scheduleCatalogItemReviewAction,
} from "@/actions/catalog";

export type QuizItemView = {
  id: string;
  title: string;
  statement: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  originNote: string;
};

export type PreviousResult = { isCorrect: boolean; attempts: number };

export function CatalogQuestion({
  item,
  previous = null,
}: {
  item: QuizItemView;
  previous?: PreviousResult | null;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [pending, startTransition] = useTransition();

  function reveal() {
    if (selected === null) return;
    setRevealed(true);
    const chosen = selected;
    startTransition(() => {
      void answerCatalogQuestionAction({ itemId: item.id, chosenIndex: chosen });
    });
  }

  function retry() {
    setSelected(null);
    setRevealed(false);
  }

  const gotItRight = revealed && selected === item.correctIndex;

  return (
    <div id={`questao-${item.id}`} className="rounded-md border border-white/10 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-pergaminho">{item.title}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {previous ? (
            <Badge tone={previous.isCorrect ? "petroleo" : "alerta"}>
              {previous.isCorrect ? "acertou antes" : "errou antes"} · {previous.attempts}x
            </Badge>
          ) : null}
          <Badge tone="latiao">autoral · não oficial</Badge>
        </div>
      </div>
      <p className="mt-2 text-sm text-pergaminho/90">{item.statement}</p>
      <ul className="mt-3 space-y-1.5">
        {item.options.map((opt, i) => {
          const isChosen = selected === i;
          const isCorrect = revealed && i === item.correctIndex;
          const isWrong = revealed && isChosen && i !== item.correctIndex;
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => setSelected(i)}
                disabled={revealed}
                className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                  isCorrect
                    ? "border-petroleo/60 bg-petroleo/15 text-pergaminho"
                    : isWrong
                      ? "border-alerta/50 bg-alerta/10 text-pergaminho"
                      : isChosen
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
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
        {!revealed ? (
          <button
            type="button"
            onClick={reveal}
            disabled={selected === null || pending}
            className="rounded-md border border-latao/40 px-3 py-1.5 text-latao disabled:opacity-40"
          >
            {pending ? "Registrando..." : "Ver gabarito e explicação"}
          </button>
        ) : (
          <>
            <span className="text-cinza">
              Gabarito:{" "}
              <strong className="text-petroleo-claro">
                {String.fromCharCode(65 + item.correctIndex)}
              </strong>
            </span>
            <Badge tone={gotItRight ? "petroleo" : "alerta"}>
              {gotItRight ? "você acertou" : "você errou"}
            </Badge>
            <button
              type="button"
              onClick={retry}
              className="rounded-md border border-white/10 px-3 py-1.5 text-cinza hover:bg-white/5"
            >
              responder de novo
            </button>
          </>
        )}
        <span className="text-cinza-escuro">{item.originNote}</span>
      </div>
      {revealed ? (
        <div className="mt-3 rounded-md border border-white/10 bg-carvao/40 p-3 text-sm text-cinza">
          <p className="mb-1 font-medium text-pergaminho">Explicação</p>
          {item.explanation}
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-3 text-xs">
        <form action={saveCatalogItemAction}>
          <input type="hidden" name="itemId" value={item.id} />
          <button type="submit" className="text-latao underline">
            salvar na minha biblioteca
          </button>
        </form>
        <form action={scheduleCatalogItemReviewAction}>
          <input type="hidden" name="itemId" value={item.id} />
          <button type="submit" className="text-cinza underline hover:text-pergaminho">
            revisar amanhã
          </button>
        </form>
      </div>
    </div>
  );
}
