"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type ActionState } from "@/actions/auth";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Field, Input } from "@/components/FormControls";
import { PasswordField } from "@/components/PasswordField";

export default function CadastroPage() {
  const [state, action, pending] = useActionState<ActionState, FormData>(registerAction, { ok: true });

  return (
    <Card>
      <h2 className="mb-4 font-titulo text-xl">Criar conta</h2>
      <form action={action}>
        <Field id="displayName" label="Nome de exibição">
          <Input id="displayName" name="displayName" autoComplete="name" required minLength={2} maxLength={60} />
        </Field>
        <Field id="username" label="Username" hint="3 a 20 caracteres: letras minúsculas, números e _">
          <Input id="username" name="username" required pattern="[a-z0-9_]{3,20}" />
        </Field>
        <Field id="email" label="E-mail">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <PasswordField
          id="password"
          label="Senha"
          autoComplete="new-password"
          minLength={8}
          hint="Mínimo de 8 caracteres, com letra e número."
        />
        {!state.ok && state.error ? (
          <p role="alert" className="mb-3 text-sm text-alerta-claro">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" variant="primario" className="w-full" disabled={pending}>
          {pending ? "Criando conta…" : "Criar conta"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-cinza">
        Já tem conta?{" "}
        <Link href="/entrar" className="hover:text-pergaminho">
          Entrar
        </Link>
      </p>
    </Card>
  );
}
