"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { respondFriendRequestAction } from "@/actions/social";
import { Button } from "@/components/Button";

export function RespondRequestForm({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function respond(decision: "aceite" | "recusado") {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      fd.set("decision", decision);
      const state = await respondFriendRequestAction({ ok: true }, fd);
      if (!state.ok) setError(state.error ?? "Erro.");
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      <Button variant="sucesso" onClick={() => respond("aceite")} disabled={pending}>
        Aceitar
      </Button>
      <Button variant="fantasma" onClick={() => respond("recusado")} disabled={pending}>
        Recusar
      </Button>
      {error ? (
        <span role="alert" className="self-center text-xs text-alerta-claro">
          {error}
        </span>
      ) : null}
    </div>
  );
}
