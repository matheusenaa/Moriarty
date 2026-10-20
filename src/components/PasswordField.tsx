"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Field, Input } from "@/components/FormControls";

/**
 * Campo de senha com controle de mostrar/ocultar acessível por teclado.
 * Reutiliza os primitivos de formulário já existentes.
 */
export function PasswordField({
  id,
  label,
  name = id,
  autoComplete,
  hint,
  required = true,
  minLength,
}: {
  id: string;
  label: string;
  name?: string;
  autoComplete?: string;
  hint?: string;
  required?: boolean;
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <Field id={id} label={label} hint={hint}>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-cinza hover:text-pergaminho"
        >
          {visible ? <EyeOff aria-hidden size={16} /> : <Eye aria-hidden size={16} />}
        </button>
      </div>
    </Field>
  );
}
