"use client";

import { useActionState } from "react";
import {
  updateProfilePhotoAction,
  updateProfilePhraseAction,
  updateUserStatusAction,
  type ActionState,
} from "@/actions/profile";
import { Badge } from "@/components/Badge";
import { cn } from "@/lib/cn";
import {
  STATUS_EMOJI,
  STATUS_LABEL,
  STATUS_TONE,
  USER_STATUSES,
  type UserStatus,
} from "@/lib/user-status";

const INITIAL: ActionState = { ok: true };

function Feedback({ state }: { state: ActionState }) {
  if (state.ok && state.message) {
    return (
      <p role="status" className="text-xs text-petroleo-claro">
        {state.message}
      </p>
    );
  }
  if (!state.ok && state.error) {
    return (
      <p role="alert" className="text-xs text-alerta-claro">
        {state.error}
      </p>
    );
  }
  return null;
}

export function ProfileIdentity({
  username,
  displayName,
  photoUrl,
  phrase,
  status,
}: {
  username: string;
  displayName: string;
  photoUrl: string | null;
  phrase: string;
  status: UserStatus;
}) {
  const [photoState, photoAction, photoPending] = useActionState<ActionState, FormData>(
    updateProfilePhotoAction,
    INITIAL,
  );
  const [phraseState, phraseAction, phrasePending] = useActionState<ActionState, FormData>(
    updateProfilePhraseAction,
    INITIAL,
  );
  const [statusState, statusAction, statusPending] = useActionState<ActionState, FormData>(
    updateUserStatusAction,
    INITIAL,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={`Foto de ${displayName}`}
            className="h-24 w-24 shrink-0 rounded-full border-2 border-latao/30 object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-white/20 bg-latao/10 text-2xl font-semibold text-latao">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 space-y-1">
          <p className="font-titulo text-2xl font-bold text-pergaminho">{displayName}</p>
          <p className="text-sm text-cinza">@{username}</p>
          <Badge tone={STATUS_TONE[status]}>
            {STATUS_EMOJI[status]} {STATUS_LABEL[status]}
          </Badge>
          {phrase ? (
            <p className="max-w-xl truncate text-sm italic text-cinza">“{phrase}”</p>
          ) : (
            <p className="text-sm text-cinza-escuro">Sem frase no perfil.</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 border-t border-white/10 pt-4 lg:grid-cols-2">
        <form action={photoAction} encType="multipart/form-data" className="space-y-2">
          <label htmlFor="photo" className="block text-sm font-medium text-cinza">
            Foto do perfil
          </label>
          <input
            id="photo"
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp"
            required
            className="block w-full rounded-md border border-white/10 bg-carvao px-3 py-2 text-sm text-pergaminho file:mr-3 file:rounded-md file:border-0 file:bg-latao/10 file:px-3 file:py-1 file:text-latao"
          />
          <p className="text-xs text-cinza-escuro">JPG, PNG ou WebP, até 4 MB.</p>
          <button
            type="submit"
            disabled={photoPending}
            className="rounded-md border border-latao/40 px-3 py-2 text-sm text-latao hover:bg-latao/10 disabled:opacity-50"
          >
            {photoPending ? "Enviando…" : "Atualizar foto"}
          </button>
          <Feedback state={photoState} />
        </form>

        <form action={phraseAction} className="space-y-2">
          <label htmlFor="phrase" className="block text-sm font-medium text-cinza">
            Frase abaixo da foto
          </label>
          <input
            id="phrase"
            type="text"
            name="phrase"
            maxLength={200}
            defaultValue={phrase}
            placeholder="Seu lema, pensamento do dia, meta…"
            className="w-full rounded-md border border-white/10 bg-carvao px-3 py-2 text-sm text-pergaminho placeholder:text-cinza-escuro focus:border-latao/60 focus:outline-none"
          />
          <p className="text-xs text-cinza-escuro">Até 200 caracteres. Visível para seus amigos.</p>
          <button
            type="submit"
            disabled={phrasePending}
            className="rounded-md border border-latao/40 px-3 py-2 text-sm text-latao hover:bg-latao/10 disabled:opacity-50"
          >
            {phrasePending ? "Salvando…" : "Salvar frase"}
          </button>
          <Feedback state={phraseState} />
        </form>
      </div>

      <form action={statusAction} className="space-y-2 border-t border-white/10 pt-4">
        <p className="text-sm font-medium text-cinza">Status (estilo MSN)</p>
        <div className="flex flex-wrap gap-2">
          {USER_STATUSES.map((value) => (
            <button
              key={value}
              type="submit"
              name="status"
              value={value}
              disabled={statusPending}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50",
                status === value
                  ? "bg-latao/15 text-latao ring-2 ring-latao/60"
                  : "border border-white/10 text-cinza hover:bg-white/5",
              )}
            >
              <span>{STATUS_EMOJI[value]}</span>
              <span>{STATUS_LABEL[value]}</span>
            </button>
          ))}
        </div>
        <Feedback state={statusState} />
      </form>
    </div>
  );
}
