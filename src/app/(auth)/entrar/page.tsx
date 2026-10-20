"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type ActionState } from "@/actions/auth";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Field, Input } from "@/components/FormControls";
import { PasswordField } from "@/components/PasswordField";
import { ConstitutionQuotes, CONSTITUTION_SOURCE_URL } from "@/components/AcademicScene";

export default function EntrarPage() {
  const [state, action, pending] = useActionState<ActionState, FormData>(loginAction, { ok: true });

  return (
    <Card>
      <h2 className="mb-1 font-titulo text-xl">Entrar</h2>
      <p className="mb-4 text-sm text-cinza">Seu próximo capítulo começa hoje.</p>
      <form action={action}>
        <Field id="email" label="E-mail">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <PasswordField id="password" label="Senha" autoComplete="current-password" />
        {!state.ok && state.error ? (
          <p role="alert" className="mb-3 text-sm text-alerta-claro">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" variant="primario" className="w-full" disabled={pending}>
          {pending ? "Entrando…" : "Entrar"}
        </Button>
      </form>
      <div className="mt-4 flex justify-between text-sm text-cinza">
        <Link href="/recuperar" className="hover:text-pergaminho">
          Esqueci a senha
        </Link>
        <Link href="/cadastro" className="hover:text-pergaminho">
          Criar conta
        </Link>
      </div>

      <div className="mt-5 border-t border-latao/15 pt-4">
        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-cinza-escuro">
          Para ler enquanto estuda
        </p>
        <ConstitutionQuotes />
        <a
          href={CONSTITUTION_SOURCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-xs text-cinza-escuro underline hover:text-pergaminho"
        >
          Constituição Federal de 1988 — texto oficial (Planalto)
        </a>
      </div>
    </Card>
  );
}
