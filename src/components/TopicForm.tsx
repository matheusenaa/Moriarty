"use client";

import { useActionState } from "react";
import { saveTopicAction, type ActionState } from "@/actions/planning";
import { Button } from "@/components/Button";
import { Input } from "@/components/FormControls";

export function TopicForm({ subjectId }: { subjectId: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveTopicAction, { ok: true });

  return (
    <form action={action} className="flex items-end gap-2">
      <input type="hidden" name="subjectId" value={subjectId} />
      <div className="flex-1">
        <label htmlFor={`topic-${subjectId}`} className="mb-1 block text-xs text-cinza">
          Novo tópico
        </label>
        <Input id={`topic-${subjectId}`} name="name" required placeholder="Ex.: Atos administrativos" />
      </div>
      <Button type="submit" variant="secundario" disabled={pending}>
        {pending ? "…" : "Add"}
      </Button>
      {!state.ok && state.error ? (
        <p role="alert" className="w-full text-xs text-alerta-claro">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
