"use client";

import { useActionState } from "react";
import { saveReminderAction, type ActionState } from "@/actions/profile";
import { Button } from "@/components/Button";
import { Field, Input } from "@/components/FormControls";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function ReminderForm({
  kind,
  initialTime,
  initialDays,
  initialEnabled,
}: {
  kind: "revisao" | "sessao";
  initialTime: string;
  initialDays: number[];
  initialEnabled: boolean;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveReminderAction, { ok: true });

  return (
    <form action={action} className="mt-4 border-t border-white/10 pt-3">
      <input type="hidden" name="kind" value={kind} />
      <p className="mb-2 text-sm font-medium text-pergaminho">
        {kind === "revisao" ? "Lembrete de revisões" : "Lembrete de sessões"}
      </p>
      <Field id={`time-${kind}`} label="Horário">
        <Input id={`time-${kind}`} name="time" type="time" defaultValue={initialTime} />
      </Field>
      <div className="mb-3 flex flex-wrap gap-3">
        {DAYS.map((d, i) => (
          <label key={d} className="flex items-center gap-1 text-xs text-cinza">
            <input
              type="checkbox"
              name={`day-${i}`}
              defaultChecked={initialDays.includes(i)}
              className="accent-latao"
              onChange={(e) => {
                const hidden = document.getElementById(`days-${kind}`) as HTMLInputElement | null;
                if (!hidden) return;
                const current = new Set(
                  hidden.value.split(",").filter(Boolean).map(Number),
                );
                if (e.target.checked) current.add(i);
                else current.delete(i);
                hidden.value = Array.from(current).sort().join(",");
              }}
            />
            {d}
          </label>
        ))}
        <input id={`days-${kind}`} type="hidden" name="days" defaultValue={initialDays.join(",")} />
      </div>
      <label className="mb-3 flex items-center gap-2 text-sm">
        <input type="checkbox" name="enabled" defaultChecked={initialEnabled} className="accent-latao" />
        Ativo
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
      <Button type="submit" variant="secundario" disabled={pending}>
        {pending ? "Salvando…" : "Salvar lembrete"}
      </Button>
    </form>
  );
}
