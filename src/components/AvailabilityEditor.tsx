"use client";

import { useActionState, useState } from "react";
import {
  addUnavailableDateAction,
  removeUnavailableDateAction,
  saveAvailabilityAction,
  type ActionState,
} from "@/actions/planning";
import { Button } from "@/components/Button";
import { Input, Select } from "@/components/FormControls";

const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

type Slot = { weekday: number; start: string; end: string };

function toHHMM(minute: number): string {
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function AvailabilityEditor({
  initialSlots,
  unavailableDates,
}: {
  initialSlots: { weekday: number; startMinute: number; endMinute: number }[];
  unavailableDates: string[];
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveAvailabilityAction, { ok: true });
  const [slots, setSlots] = useState<Slot[]>(
    initialSlots.map((s) => ({ weekday: s.weekday, start: toHHMM(s.startMinute), end: toHHMM(s.endMinute) })),
  );
  const [draft, setDraft] = useState<Slot>({ weekday: 0, start: "09:00", end: "12:00" });
  const [unavailable] = useState(unavailableDates);
  const [newDate, setNewDate] = useState("");

  return (
    <div className="mt-3">
      <div className="mb-2 flex flex-wrap items-end gap-2">
        <div>
          <label htmlFor="wd2" className="mb-1 block text-xs text-cinza">
            Dia
          </label>
          <Select id="wd2" value={draft.weekday} onChange={(e) => setDraft({ ...draft, weekday: Number(e.target.value) })}>
            {WEEKDAYS.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="st2" className="mb-1 block text-xs text-cinza">
            Início
          </label>
          <Input id="st2" type="time" value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value })} />
        </div>
        <div>
          <label htmlFor="en2" className="mb-1 block text-xs text-cinza">
            Fim
          </label>
          <Input id="en2" type="time" value={draft.end} onChange={(e) => setDraft({ ...draft, end: e.target.value })} />
        </div>
        <Button
          type="button"
          variant="secundario"
          onClick={() => {
            if (draft.end > draft.start) setSlots([...slots, { ...draft }]);
          }}
        >
          Adicionar
        </Button>
      </div>

      <ul className="mb-3 space-y-1 text-sm">
        {slots.length === 0 ? (
          <li className="text-cinza">Nenhum horário cadastrado.</li>
        ) : (
          slots.map((s, i) => (
            <li key={i} className="flex items-center justify-between rounded-md border border-white/10 px-3 py-1.5">
              <span>
                {WEEKDAYS[s.weekday]} · {s.start}–{s.end}
              </span>
              <button type="button" className="text-xs text-alerta-claro hover:underline" onClick={() => setSlots(slots.filter((_, j) => j !== i))}>
                remover
              </button>
            </li>
          ))
        )}
      </ul>

      <form action={action}>
        <input type="hidden" name="slots" value={JSON.stringify(slots)} />
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
          {pending ? "Salvando…" : "Salvar disponibilidade"}
        </Button>
      </form>

      <div className="mt-5 border-t border-white/10 pt-3">
        <p className="mb-2 text-sm font-medium text-pergaminho">Dias indisponíveis</p>
        <ul className="mb-2 space-y-1 text-sm">
          {unavailable.length === 0 ? (
            <li className="text-cinza">Nenhum dia bloqueado.</li>
          ) : (
            unavailable.map((d) => (
              <li key={d} className="flex items-center justify-between rounded-md border border-white/10 px-3 py-1">
                <span>{d}</span>
                <form action={removeUnavailableDateAction}>
                  <input type="hidden" name="date" value={d} />
                  <button type="submit" className="text-xs text-alerta-claro hover:underline">
                    remover
                  </button>
                </form>
              </li>
            ))
          )}
        </ul>
        <div className="flex gap-2">
          <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} aria-label="Data indisponível" />
          <form action={addUnavailableDateAction} className="flex gap-2">
            <input type="hidden" name="date" value={newDate} />
            <Button type="submit" variant="secundario" disabled={!newDate}>
              Bloquear
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
