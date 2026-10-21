"use client";

import { useState, useTransition } from "react";
import { rodarSeedAction } from "@/actions/seed";
import { Button } from "@/components/Button";

export function SeedButton() {
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState<boolean | null>(null);
  const [pending, startTransition] = useTransition();

  function rodar() {
    startTransition(async () => {
      const state = await rodarSeedAction();
      setOk(state.ok);
      setMessage(state.message);
    });
  }

  return (
    <div className="mt-3">
      <Button type="button" variant="primario" onClick={rodar} disabled={pending}>
        {pending ? "Carregando conteúdo…" : "Carregar / atualizar conteúdo das trilhas"}
      </Button>
      {message ? (
        <p role="status" className={`mt-2 text-sm ${ok ? "text-petroleo-claro" : "text-alerta-claro"}`}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
