"use client";

import { useState, useTransition } from "react";
import { completeSessionAction, type ActionState } from "@/actions/planning";
import { Button } from "@/components/Button";
import { Input } from "@/components/FormControls";

export function SessionCompleteForm({
  sessionId,
  plannedMinutes,
  subjectName,
}: {
  sessionId: string;
  plannedMinutes: number;
  subjectName: string;
}) {
  const [open, setOpen] = useState(false);
  const [actual, setActual] = useState(plannedMinutes);
  const [status, setStatus] = useState<"concluida" | "parcial" | "adiada" | "nao_realizada">("concluida");
  const [review, setReview] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const state: ActionState = await completeSessionAction({
        sessionId,
        status,
        actualMinutes: status === "concluida" || status === "parcial" ? actual : 0,
        reviewTitles: review
          .split("\n")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      setMessage(state.ok ? state.message ?? "Registrado." : state.error ?? "Erro.");
      if (state.ok) setOpen(false);
    });
  }

  if (!open) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="primario" onClick={() => setOpen(true)}>
          Registrar
        </Button>
        {message ? <span className="text-xs text-petroleo-claro">{message}</span> : null}
      </div>
    );
  }

  return (
    <div className="w-full rounded-md border border-latao/30 bg-carvao/80 p-3 sm:w-72">
      <p className="mb-2 text-xs text-cinza">Registrar {subjectName || "sessão"}</p>
      <div className="mb-2 flex flex-wrap gap-2">
        {(
          [
            ["concluida", "Concluída"],
            ["parcial", "Parcial"],
            ["adiada", "Adiada"],
            ["nao_realizada", "Não realizada"],
          ] as const
        ).map(([value, label]) => (
          <label key={value} className="flex items-center gap-1 text-xs text-pergaminho">
            <input
              type="radio"
              name={`status-${sessionId}`}
              checked={status === value}
              onChange={() => setStatus(value)}
              className="accent-latao"
            />
            {label}
          </label>
        ))}
      </div>
      {status === "concluida" || status === "parcial" ? (
        <>
          <label className="mb-1 block text-xs text-cinza" htmlFor={`min-${sessionId}`}>
            Minutos efetivos
          </label>
          <Input
            id={`min-${sessionId}`}
            type="number"
            min={1}
            max={600}
            value={actual}
            onChange={(e) => setActual(Number(e.target.value))}
            className="mb-2"
          />
          <label className="mb-1 block text-xs text-cinza" htmlFor={`rev-${sessionId}`}>
            Tópicos para revisar (um por linha, opcional)
          </label>
          <textarea
            id={`rev-${sessionId}`}
            rows={2}
            value={review}
            onChange={(e) => setReview(e.target.value)}
            className="mb-2 w-full rounded-md border border-latao/20 bg-carvao/70 px-2 py-1 text-xs"
            placeholder={"Art. 5º da CF\nCrase e regência"}
          />
        </>
      ) : null}
      <div className="flex gap-2">
        <Button variant="primario" onClick={submit} disabled={pending}>
          {pending ? "Salvando…" : "Salvar"}
        </Button>
        <Button variant="fantasma" onClick={() => setOpen(false)} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
