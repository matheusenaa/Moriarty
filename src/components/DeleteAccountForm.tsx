"use client";

import { useState, useActionState } from "react";
import { deleteAccountAction, physicalDeleteAccountAction, type ActionState } from "@/actions/auth";
import { Button } from "@/components/Button";
import { Field, Input } from "@/components/FormControls";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";

export function DeleteAccountForm({ userId, email }: { userId: string; email: string }) {
  const [mode, setMode] = useState<"soft" | "physical">("soft");

  const [softState, softAction, softPending] = useActionState<ActionState, FormData>(deleteAccountAction, { ok: true });
  const [physicalState, physicalAction, physicalPending] = useActionState<ActionState, FormData>(physicalDeleteAccountAction, { ok: true });

  const pending = softPending || physicalPending;
  const confirmText = mode === "soft" ? "EXCLUIR" : "EXCLUIR DEFINITIVAMENTE";
  const buttonLabel = mode === "soft" ? "Excluir minha conta (reversível)" : "Excluir permanentemente (LGPD, irreversível)";
  const buttonVariant = mode === "soft" ? "perigo" : "perigo" as const;

  return (
    <div className="space-y-4">
      <p className="text-sm text-cinza">
        Conta: <span className="text-pergaminho">{email}</span>
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setMode("soft")}
          className={cn(
            "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
            mode === "soft"
              ? "border-latao/60 bg-latao/10 text-latao"
              : "border-white/10 text-cinza hover:border-latao/30",
          )}
        >
          Exclusão suave (reversível)
        </button>
        <button
          type="button"
          onClick={() => setMode("physical")}
          className={cn(
            "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
            mode === "physical"
              ? "border-alerta/60 bg-alerta/10 text-alerta"
              : "border-white/10 text-cinza hover:border-alerta/30",
          )}
        >
          Exclusão física (LGPD, irreversível)
        </button>
      </div>

      {mode === "soft" ? (
        <form action={softAction} className="space-y-3">
          <input type="hidden" name="userId" value={userId} />
          <p className="text-xs text-cinza">
            Oculta a conta e anonimiza o e-mail. Os dados ficam no banco (podem ser restaurados por admin).
            A conta não aparece mais no login nem nas buscas.
          </p>
          <Field id="confirm" label={`Digite ${confirmText} para confirmar`}>
            <Input id="confirm" name="confirm" required autoComplete="off" />
          </Field>
          {!softState.ok && softState.error ? (
            <p role="alert" className="text-sm text-alerta-claro">{softState.error}</p>
          ) : null}
          <Button type="submit" variant={buttonVariant} disabled={pending}>
            {pending ? "Excluindo…" : buttonLabel}
          </Button>
        </form>
      ) : (
        <form action={physicalAction} className="space-y-3">
          <input type="hidden" name="userId" value={userId} />
          <div className="rounded-md border border-alerta/30 bg-alerta/5 p-3 flex items-start gap-3">
            <AlertTriangle className="text-alerta mt-0.5 flex-shrink-0" size={20} />
            <div className="text-sm text-cinza">
              <strong className="text-alerta text-pergaminho">Ação irreversível (LGPD — Art. 18, VI).</strong>
              <p className="mt-1">
                Remove <strong>todos</strong> os seus dados: progresso, respostas, materiais, sessões,
                revisões, simulados, contribuições, amizades, histórico de XP. Não há como desfazer.
              </p>
            </div>
          </div>
          <Field id="confirm" label={`Digite ${confirmText} para confirmar`}>
            <Input id="confirm" name="confirm" required autoComplete="off" />
          </Field>
          {!physicalState.ok && physicalState.error ? (
            <p role="alert" className="text-sm text-alerta-claro">{physicalState.error}</p>
          ) : null}
          <Button type="submit" variant={buttonVariant} disabled={pending} className="bg-alerta/10 border-alerta/50 hover:bg-alerta/20">
            {pending ? "Excluindo permanentemente…" : buttonLabel}
          </Button>
        </form>
      )}
    </div>
  );
}