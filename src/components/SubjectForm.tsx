"use client";

import { useActionState } from "react";
import { saveSubjectAction, type ActionState } from "@/actions/planning";
import { Button } from "@/components/Button";
import { Field, Input, Select } from "@/components/FormControls";

export function SubjectForm({
  goalId,
  subject,
}: {
  goalId: string | null;
  subject?: { id: string; name: string; priority: number; mastery: number; color: string };
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveSubjectAction, { ok: true });

  return (
    <form action={action} className="mt-2">
      {subject ? <input type="hidden" name="id" value={subject.id} /> : null}
      <input type="hidden" name="goalId" value={goalId ?? ""} />
      <Field id="name" label="Nome da matéria">
        <Input id="name" name="name" required defaultValue={subject?.name ?? ""} placeholder="Ex.: Direito Administrativo" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field id="priority" label="Prioridade">
          <Select id="priority" name="priority" defaultValue={subject?.priority ?? 3}>
            {[1, 2, 3, 4, 5].map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="mastery" label="Domínio">
          <Select id="mastery" name="mastery" defaultValue={subject?.mastery ?? 2}>
            {[0, 1, 2, 3, 4, 5].map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="color" label="Cor">
          <Input id="color" name="color" type="color" defaultValue={subject?.color ?? "#c9a227"} className="h-10 p-1" />
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
        {pending ? "Salvando…" : subject ? "Salvar alterações" : "Adicionar matéria"}
      </Button>
    </form>
  );
}
