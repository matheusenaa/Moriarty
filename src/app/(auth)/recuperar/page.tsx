"use client";

import { useActionState, useState } from "react";
import { requestResetAction, resetPasswordAction, type ActionState } from "@/actions/auth";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Field, Input } from "@/components/FormControls";

export default function RecuperarPage() {
  const [mode, setMode] = useState<"pedido" | "nova">("pedido");
  const [reqState, reqAction, reqPending] = useActionState<ActionState, FormData>(requestResetAction, { ok: true });
  const [resetState, resetAction, resetPending] = useActionState<ActionState, FormData>(resetPasswordAction, { ok: true });

  return (
    <Card>
      <h2 className="mb-2 font-titulo text-xl">Recuperar acesso</h2>
      {mode === "pedido" ? (
        <>
          <p className="mb-4 text-sm text-cinza">
            Informe seu e-mail. Se a conta existir, um token de recuperação é gerado no servidor.
            Esta instalação não envia e-mail automaticamente: o administrador pode copiar o token
            do log do servidor e enviar manualmente.
          </p>
          <form action={reqAction}>
            <Field id="email" label="E-mail">
              <Input id="email" name="email" type="email" required />
            </Field>
            <Button type="submit" variant="primario" className="w-full" disabled={reqPending}>
              {reqPending ? "Gerando…" : "Gerar link de recuperação"}
            </Button>
          </form>
          {reqState.message ? (
            <p role="status" className="mt-3 text-sm text-petroleo-claro">
              {reqState.message}
            </p>
          ) : null}
          {!reqState.ok && reqState.error ? (
            <p role="alert" className="mt-3 text-sm text-alerta-claro">
              {reqState.error}
            </p>
          ) : null}
          <button
            type="button"
            className="mt-4 text-sm text-cinza underline hover:text-pergaminho"
            onClick={() => setMode("nova")}
          >
            Já tenho o token
          </button>
        </>
      ) : (
        <>
          <form action={resetAction}>
            <Field id="token" label="Token de recuperação">
              <Input id="token" name="token" required />
            </Field>
            <Field id="password" label="Nova senha" hint="Mínimo de 8 caracteres, com letra e número.">
              <Input id="password" name="password" type="password" required minLength={8} />
            </Field>
            <Button type="submit" variant="primario" className="w-full" disabled={resetPending}>
              {resetPending ? "Salvando…" : "Alterar senha"}
            </Button>
          </form>
          {resetState.message ? (
            <p role="status" className="mt-3 text-sm text-petroleo-claro">
              {resetState.message}
            </p>
          ) : null}
          {!resetState.ok && resetState.error ? (
            <p role="alert" className="mt-3 text-sm text-alerta-claro">
              {resetState.error}
            </p>
          ) : null}
          <button
            type="button"
            className="mt-4 text-sm text-cinza underline hover:text-pergaminho"
            onClick={() => setMode("pedido")}
          >
            Solicitar novo token
          </button>
        </>
      )}
    </Card>
  );
}
