"use client";

import { useActionState } from "react";
import { createManualReviewAction, type ActionState } from "@/actions/reviews";
import { Button } from "@/components/Button";
import { Field, Input, Select } from "@/components/FormControls";

export function ManualReviewForm({ subjects, today }: { subjects: { id: string; name: string }[]; today: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createManualReviewAction, { ok: true });
  const tomorrow = (() => {
    const [y, m, d] = today.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
  })();

  return (
    <form action={action} className="mt-3">
      <Field id="title" label="Título do conteúdo">
        <Input id="title" name="title" required placeholder="Ex.: Controle de constitucionalidade" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="subjectId" label="Matéria">
          <Select id="subjectId" name="subjectId" defaultValue="">
            <option value="">Sem matéria</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="due" label="Primeira revisão em">
          <Input id="due" name="due" type="date" defaultValue={tomorrow} />
        </Field>
      </div>
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
        {pending ? "Agendando…" : "Agendar revisão"}
      </Button>
    </form>
  );
}
