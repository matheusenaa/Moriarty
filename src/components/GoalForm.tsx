"use client";

import { useActionState } from "react";
import { saveGoalAction, type ActionState } from "@/actions/planning";
import { Button } from "@/components/Button";
import { Field, Input } from "@/components/FormControls";

type Goal = {
  id: string;
  title: string;
  exam_name: string;
  exam_date: string | null;
  weekly_hours_target: number;
  session_minutes: number;
  reserve_reviews: number;
  reserve_simulated: number;
} | null;

export function GoalForm({ goal }: { goal: Goal }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveGoalAction, { ok: true });

  return (
    <form action={action} className="mt-3">
      {goal ? <input type="hidden" name="id" value={goal.id} /> : null}
      <Field id="title" label="Nome do objetivo">
        <Input id="title" name="title" required defaultValue={goal?.title ?? ""} placeholder="Ex.: ENEM 2026" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="examName" label="Prova / concurso">
          <Input id="examName" name="examName" defaultValue={goal?.exam_name ?? ""} />
        </Field>
        <Field id="examDate" label="Data da prova">
          <Input id="examDate" name="examDate" type="date" defaultValue={goal?.exam_date ?? ""} />
        </Field>
        <Field id="weeklyHoursTarget" label="Horas por semana">
          <Input
            id="weeklyHoursTarget"
            name="weeklyHoursTarget"
            type="number"
            min={1}
            max={80}
            step="0.5"
            defaultValue={goal?.weekly_hours_target ?? 10}
            required
          />
        </Field>
        <Field id="sessionMinutes" label="Minutos por sessão">
          <Input
            id="sessionMinutes"
            name="sessionMinutes"
            type="number"
            min={15}
            max={480}
            step={5}
            defaultValue={goal?.session_minutes ?? 50}
            required
          />
        </Field>
      </div>
      <label className="mb-1 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="reserveReviews"
          defaultChecked={goal ? goal.reserve_reviews === 1 : true}
          className="accent-latao"
        />
        Reservar revisões
      </label>
      <label className="mb-3 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="reserveSimulated"
          defaultChecked={goal ? goal.reserve_simulated === 1 : true}
          className="accent-latao"
        />
        Reservar simulados
      </label>
      {state.message ? (
        <p role="status" className="mb-2 text-sm text-petroleo-claro">
          {state.message}
        </p>
      ) : null}
      {!state.ok && state.error ? (
        <p role="alert" className="mb-2 text-sm text-alerta-claro">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" variant="primario" disabled={pending}>
        {pending ? "Salvando…" : goal ? "Atualizar objetivo" : "Criar objetivo"}
      </Button>
    </form>
  );
}
