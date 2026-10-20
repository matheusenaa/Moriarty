"use client";

import { useActionState } from "react";
import { deleteAccountAction, type ActionState } from "@/actions/auth";
import { Button } from "@/components/Button";
import { Field, Input } from "@/components/FormControls";

export function DeleteAccountForm({ userId, email }: { userId: string; email: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(deleteAccountAction, { ok: true });

  return (
    <form action={action} className="mt-3">
      <input type="hidden" name="userId" value={userId} />
      <p className="mb-2 text-sm text-cinza">
        Conta: <span className="text-pergaminho">{email}</span>
      </p>
      <Field id="confirm" label='Digite EXCLUIR para confirmar'>
        <Input id="confirm" name="confirm" required autoComplete="off" />
      </Field>
      {!state.ok && state.error ? (
        <p role="alert" className="mb-2 text-sm text-alerta-claro">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" variant="perigo" disabled={pending}>
        {pending ? "Excluindo…" : "Excluir minha conta"}
      </Button>
    </form>
  );
}
