"use client";

import { useActionState, useMemo, useState } from "react";
import { completeOnboardingAction, type ActionState } from "@/actions/planning";
import { Button } from "@/components/Button";
import { Field, Input, Select, Textarea } from "@/components/FormControls";

const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

type Slot = { weekday: number; start: string; end: string };

export function OnboardingForm({ displayName }: { displayName: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(completeOnboardingAction, { ok: true });
  const [slots, setSlots] = useState<Slot[]>([{ weekday: 1, start: "19:00", end: "22:00" }]);
  const [draft, setDraft] = useState<Slot>({ weekday: 2, start: "19:00", end: "22:00" });

  const slotsJson = useMemo(() => JSON.stringify(slots), [slots]);

  return (
    <form action={action}>
      <h2 className="mb-3 font-titulo text-lg">1. Objetivo</h2>
      <Field id="title" label="Nome do objetivo (concurso, prova ou curso)">
        <Input id="title" name="title" required placeholder="Ex.: TRF 2026 — Analista" defaultValue={`Objetivo de ${displayName}`} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="examName" label="Nome da prova (opcional)">
          <Input id="examName" name="examName" placeholder="Ex.: Analista Judiciário" />
        </Field>
        <Field id="examDate" label="Data prevista da prova">
          <Input id="examDate" name="examDate" type="date" />
        </Field>
        <Field id="weeklyHoursTarget" label="Meta de horas por semana">
          <Input id="weeklyHoursTarget" name="weeklyHoursTarget" type="number" min={1} max={80} defaultValue={10} required />
        </Field>
        <Field id="sessionMinutes" label="Duração da sessão (minutos)">
          <Input id="sessionMinutes" name="sessionMinutes" type="number" min={15} max={480} step={5} defaultValue={50} required />
        </Field>
      </div>
      <label className="mb-1 flex items-center gap-2 text-sm text-pergaminho/90">
        <input type="checkbox" name="reserveReviews" defaultChecked className="accent-latao" /> Reservar tempo para revisões
      </label>
      <label className="mb-4 flex items-center gap-2 text-sm text-pergaminho/90">
        <input type="checkbox" name="reserveSimulated" defaultChecked className="accent-latao" /> Reservar tempo para simulados
      </label>

      <h2 className="mb-3 mt-6 font-titulo text-lg">2. Matérias</h2>
      <Field id="subjects" label="Uma matéria por linha" hint="Você pode priorizar e ajustar o domínio depois.">
        <Textarea id="subjects" name="subjects" rows={4} placeholder={"Direito Constitucional\nPortuguês\nRaciocínio Lógico"} />
      </Field>

      <h2 className="mb-3 mt-6 font-titulo text-lg">3. Disponibilidade semanal</h2>
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <div>
          <label htmlFor="wd" className="mb-1 block text-xs text-cinza">
            Dia
          </label>
          <Select id="wd" value={draft.weekday} onChange={(e) => setDraft({ ...draft, weekday: Number(e.target.value) })}>
            {WEEKDAYS.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="st" className="mb-1 block text-xs text-cinza">
            Início
          </label>
          <Input id="st" type="time" value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value })} />
        </div>
        <div>
          <label htmlFor="en" className="mb-1 block text-xs text-cinza">
            Fim
          </label>
          <Input id="en" type="time" value={draft.end} onChange={(e) => setDraft({ ...draft, end: e.target.value })} />
        </div>
        <Button
          type="button"
          variant="secundario"
          onClick={() => {
            if (draft.end > draft.start) setSlots([...slots, { ...draft }]);
          }}
        >
          Adicionar horário
        </Button>
      </div>
      <ul className="mb-4 space-y-1 text-sm">
        {slots.length === 0 ? (
          <li className="text-cinza">Nenhum horário ainda. Adicione pelo menos um.</li>
        ) : (
          slots.map((s, i) => (
            <li key={i} className="flex items-center justify-between rounded-md border border-white/10 px-3 py-1.5">
              <span>
                {WEEKDAYS[s.weekday]} · {s.start}–{s.end}
              </span>
              <button
                type="button"
                className="text-xs text-alerta-claro hover:underline"
                onClick={() => setSlots(slots.filter((_, j) => j !== i))}
              >
                remover
              </button>
            </li>
          ))
        )}
      </ul>
      <input type="hidden" name="slots" value={slotsJson} />

      {!state.ok && state.error ? (
        <p role="alert" className="mb-3 text-sm text-alerta-claro">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" variant="primario" disabled={pending || slots.length === 0} className="w-full">
        {pending ? "Montando sua central…" : "Concluir e abrir a Central"}
      </Button>
    </form>
  );
}
