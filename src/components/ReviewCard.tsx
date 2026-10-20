"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeReviewAction } from "@/actions/reviews";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import type { ReviewResult } from "@/lib/srs";

const OPTIONS: { value: ReviewResult; label: string; tone: "sucesso" | "secundario" | "perigo" | "primario" }[] = [
  { value: "facil", label: "Fácil", tone: "sucesso" },
  { value: "bom", label: "Bom", tone: "primario" },
  { value: "dificil", label: "Difícil", tone: "secundario" },
  { value: "nao_lembrei", label: "Não lembrei", tone: "perigo" },
];

export function ReviewCard({
  id,
  title,
  dueLabel,
  overdue,
  intervalDays,
  reps,
}: {
  id: string;
  title: string;
  dueLabel: string;
  overdue: boolean;
  intervalDays: number;
  reps: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function answer(result: ReviewResult) {
    startTransition(async () => {
      const state = await completeReviewAction({ reviewId: id, result });
      setMessage(state.ok ? state.message ?? "" : state.error ?? "Erro.");
      router.refresh();
    });
  }

  return (
    <div className="rounded-md border border-white/10 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium text-pergaminho">{title}</p>
        <Badge tone={overdue ? "alerta" : "latiao"}>{dueLabel}</Badge>
      </div>
      <p className="mt-0.5 text-xs text-cinza">
        Intervalo atual: {intervalDays} dia(s) · {reps} revisão(ões) anteriores
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {OPTIONS.map((o) => (
          <Button key={o.value} variant={o.tone} onClick={() => answer(o.value)} disabled={pending}>
            {o.label}
          </Button>
        ))}
      </div>
      {message ? (
        <p role="status" className="mt-2 text-xs text-petroleo-claro">
          {message}
        </p>
      ) : null}
    </div>
  );
}
