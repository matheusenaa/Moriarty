"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { revokeShareAction, setVisibilityAction, type ActionState } from "@/actions/materials";
import { Button } from "@/components/Button";
import { Input } from "@/components/FormControls";

export function VisibilityControls({
  materialId,
  visibility,
  shareEnabled,
  shareToken,
}: {
  materialId: string;
  visibility: string;
  shareEnabled: boolean;
  shareToken: string | null;
}) {
  const router = useRouter();
  const [state, , pending] = useActionState<ActionState, FormData>(setVisibilityAction, { ok: true });
  const link =
    shareToken && shareEnabled && (visibility === "link" || visibility === "publico")
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/compartilhado/${shareToken}`
      : null;

  return (
    <div className="mt-3">
      <form
        action={async (fd) => {
          const result = await setVisibilityAction({ ok: true }, fd);
          if (result.ok) router.refresh();
        }}
        className="flex flex-wrap items-end gap-2"
      >
        <input type="hidden" name="id" value={materialId} />
        <div>
          <label htmlFor={`vis-${materialId}`} className="mb-1 block text-xs text-cinza">
            Visibilidade
          </label>
          <select
            id={`vis-${materialId}`}
            name="visibility"
            defaultValue={visibility}
            className="w-44 rounded-md border border-latao/20 bg-carvao/70 px-3 py-2 text-sm"
          >
            <option value="privado">Privado</option>
            <option value="amigos">Amigos</option>
            <option value="link">Usuários autenticados com link</option>
            <option value="publico">Público (sem login)</option>
          </select>
        </div>
        <Button type="submit" variant="primario" disabled={pending}>
          {pending ? "Aplicando…" : "Aplicar visibilidade"}
        </Button>
      </form>

      {state.message ? (
        <p role="status" className="mt-2 text-sm text-petroleo-claro">
          {state.message}
        </p>
      ) : null}
      {!state.ok && state.error ? (
        <p role="alert" className="mt-2 text-sm text-alerta-claro">
          {state.error}
        </p>
      ) : null}

      {link ? (
        <div className="mt-3">
          <label htmlFor={`link-${materialId}`} className="mb-1 block text-xs text-cinza">
            Link de compartilhamento (exige login para o destinatário, exceto em modo público)
          </label>
          <Input id={`link-${materialId}`} readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
        </div>
      ) : null}

      {shareEnabled ? (
        <form action={revokeShareAction} className="mt-3">
          <input type="hidden" name="id" value={materialId} />
          <Button type="submit" variant="perigo">
            Revogar compartilhamento
          </Button>
        </form>
      ) : null}
    </div>
  );
}
