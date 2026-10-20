"use client";

import { useState, useTransition } from "react";
import { searchUsersAction, sendFriendRequestAction } from "@/actions/social";
import { Button } from "@/components/Button";
import { Input } from "@/components/FormControls";

type User = { id: string; username: string; display_name: string };

export function FriendSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function search(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const users = await searchUsersAction(query);
      setResults(users);
      setMessage(users.length === 0 ? "Nenhum usuário encontrado." : "");
    });
  }

  function send(to: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("to", to);
      const state = await sendFriendRequestAction({ ok: true }, fd);
      setMessage(state.ok ? state.message ?? "Solicitação enviada." : state.error ?? "Erro.");
      if (state.ok) setResults((r) => r.filter((u) => u.id !== to));
    });
  }

  return (
    <form onSubmit={search} className="mt-3">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="username ou nome"
          aria-label="Buscar usuários"
          minLength={2}
        />
        <Button type="submit" variant="primario" disabled={pending}>
          {pending ? "Buscando…" : "Buscar"}
        </Button>
      </div>
      {message ? (
        <p role="status" className="mt-2 text-sm text-cinza">
          {message}
        </p>
      ) : null}
      <ul className="mt-3 space-y-2">
        {results.map((u) => (
          <li key={u.id} className="flex items-center justify-between rounded-md border border-white/10 p-2.5">
            <span className="text-sm">
              <span className="font-medium text-pergaminho">{u.display_name}</span>{" "}
              <span className="text-cinza">@{u.username}</span>
            </span>
            <Button type="button" variant="secundario" onClick={() => send(u.id)} disabled={pending}>
              Enviar solicitação
            </Button>
          </li>
        ))}
      </ul>
    </form>
  );
}
