"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { previewPlanAction, savePlanAction, type PlanPreview } from "@/actions/planning";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { minuteToHHMM } from "@/lib/dates";

export function PlanGenerator({
  subjects,
  hasGoal,
  hasAvailability,
}: {
  subjects: { id: string; name: string }[];
  hasGoal: boolean;
  hasAvailability: boolean;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState<PlanPreview | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const blocked = !hasGoal || !hasAvailability || subjects.length === 0;

  function generate(useAi: boolean) {
    setError("");
    setMessage("");
    startTransition(async () => {
      const result = await previewPlanAction(useAi);
      if (!result.ok || !result.plan) {
        setError(result.error ?? "Não foi possível gerar o plano.");
        return;
      }
      setPlan(result.plan);
    });
  }

  function save() {
    if (!plan) return;
    const fd = new FormData();
    fd.set("sessions", JSON.stringify(plan.sessions));
    fd.set("source", plan.source);
    fd.set("explanation", plan.explanation.join("\n"));
    startTransition(async () => {
      const result = await savePlanAction({ ok: true }, fd);
      if (!result.ok) {
        setError(result.error ?? "Erro ao salvar.");
        return;
      }
      setMessage(result.message ?? "Plano salvo.");
      setPlan(null);
      router.refresh();
    });
  }

  if (blocked) {
    return (
      <p className="mt-3 text-sm text-cinza">
        Para gerar o cronograma é preciso ter objetivo, ao menos uma matéria e horários
        disponíveis cadastrados acima.
      </p>
    );
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="primario" onClick={() => generate(false)} disabled={pending}>
          {pending ? "Calculando…" : "Gerar com algoritmo local"}
        </Button>
        <Button variant="secundario" onClick={() => generate(true)} disabled={pending}>
          Tentar sugestão com IA (opcional)
        </Button>
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-alerta-claro">
          {error}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="mt-3 text-sm text-petroleo-claro">
          {message}
        </p>
      ) : null}

      {plan ? (
        <div className="mt-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge tone={plan.source === "ia" ? "petroleo" : "latiao"}>
              {plan.source === "ia" ? "Sugestão da IA (validada)" : "Algoritmo local determinístico"}
            </Badge>
            <span className="text-xs text-cinza">{plan.sessions.length} sessão(ões) proposta(s)</span>
          </div>
          {plan.aiNote ? <p className="mb-2 text-xs text-cinza">{plan.aiNote}</p> : null}
          {plan.warnings.map((w) => (
            <p key={w} className="mb-1 text-xs text-alerta-claro">
              ⚠ {w}
            </p>
          ))}
          <ul className="mb-3 max-h-72 space-y-1 overflow-y-auto rounded-md border border-white/10 p-3 text-sm">
            {plan.sessions.length === 0 ? (
              <li className="text-cinza">Nenhuma sessão sugerida.</li>
            ) : (
              plan.sessions.map((s, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2 border-b border-white/5 py-1 last:border-0">
                  <span className="text-latao">{s.date}</span>
                  <span>
                    {minuteToHHMM(s.startMinute)} · {s.plannedMinutes} min
                  </span>
                  <span className="text-pergaminho">{s.subjectName}</span>
                  <Badge tone={s.kind === "estudo" ? "neutro" : "petroleo"}>{s.kind}</Badge>
                  <span className="text-xs text-cinza">{s.reason}</span>
                </li>
              ))
            )}
          </ul>
          {plan.explanation.length > 0 ? (
            <details className="mb-3 text-sm text-cinza">
              <summary className="cursor-pointer text-pergaminho">Por que essa distribuição?</summary>
              <ul className="mt-2 list-inside list-disc space-y-1">
                {plan.explanation.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </details>
          ) : null}
          <div className="flex gap-2">
            <Button variant="primario" onClick={save} disabled={pending || plan.sessions.length === 0}>
              {pending ? "Salvando…" : "Salvar plano"}
            </Button>
            <Button variant="fantasma" onClick={() => setPlan(null)} disabled={pending}>
              Descartar prévia
            </Button>
          </div>
          <p className="mt-2 text-xs text-cinza-escuro">
            Conflitos com sessões existentes são verificados antes de salvar. Nada é sobrescrito
            em silêncio.
          </p>
        </div>
      ) : null}
    </div>
  );
}
