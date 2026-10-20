"use client";

import { useActionState } from "react";
import { saveProfileAction, type ActionState } from "@/actions/profile";
import { Button } from "@/components/Button";
import { Field, Input } from "@/components/FormControls";

const TIMEZONES = [
  "America/Sao_Paulo",
  "America/Manaus",
  "America/Belem",
  "America/Fortaleza",
  "America/Bahia",
  "America/Campo_Grande",
  "America/Boa_Vista",
  "America/Rio_Branco",
  "America/Noronha",
  "UTC",
];

export function ProfileForm({
  displayName,
  timezone,
  gamificationEnabled,
  remindersEnabled,
}: {
  displayName: string;
  timezone: string;
  gamificationEnabled: boolean;
  remindersEnabled: boolean;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveProfileAction, { ok: true });

  return (
    <form action={action} className="mt-3">
      <Field id="displayName" label="Nome de exibição">
        <Input id="displayName" name="displayName" defaultValue={displayName} required />
      </Field>
      <Field id="timezone" label="Fuso horário" hint="Usado para agrupar as datas das suas sessões.">
        <Input id="timezone" name="timezone" list="tzs" defaultValue={timezone} required />
        <datalist id="tzs">
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz} />
          ))}
        </datalist>
      </Field>
      <label className="mb-1 flex items-center gap-2 text-sm">
        <input type="checkbox" name="gamificationEnabled" defaultChecked={gamificationEnabled} className="accent-latao" />
        Ativar XP, patentes e conquistas
      </label>
      <label className="mb-3 flex items-center gap-2 text-sm">
        <input type="checkbox" name="remindersEnabled" defaultChecked={remindersEnabled} className="accent-latao" />
        Ativar lembretes internos
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
        {pending ? "Salvando…" : "Salvar preferências"}
      </Button>
    </form>
  );
}
