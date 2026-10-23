"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  STATUS_EMOJI,
  STATUS_LABEL,
  type UserStatus,
} from "@/lib/user-status";
import { cn } from "@/lib/cn";

type Friend = {
  id: string;
  username: string;
  displayName: string;
  photoUrl: string | null;
  phrase: string | null;
  status: UserStatus;
};

type Message = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

function hora(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function dia(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function ChatClient({ currentUserId, friend }: { currentUserId: string; friend: Friend }) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat/${friend.id}/messages`, { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        if (res.status === 403) router.replace("/amigos");
        return;
      }
      const rows = (data.messages as Message[]).slice().reverse();
      setMessages(rows);
      if (Number(data.unreadFrom ?? 0) > 0) {
        await fetch("/api/chat/read", {
          method: "POST",
          body: (() => {
            const fd = new FormData();
            fd.set("fromUserId", friend.id);
            return fd;
          })(),
        });
      }
    } catch {
      // rede indisponível: mantém as mensagens atuais e tenta no próximo ciclo
    } finally {
      setLoading(false);
    }
  }, [friend.id, router]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(id);
  }, [refresh]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 4000);
    return () => window.clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, loading]);

  async function enviar(event: React.FormEvent) {
    event.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setError("");
    try {
      const fd = new FormData();
      fd.set("toUserId", friend.id);
      fd.set("body", body);
      const res = await fetch("/api/chat/send", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "Não foi possível enviar a mensagem.");
        return;
      }
      setText("");
      await refresh();
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-3xl flex-col overflow-hidden rounded-lg border border-white/10 bg-grafite/60">
      <header className="flex items-center gap-3 border-b border-white/10 p-3">
        <Link
          href="/amigos"
          className="shrink-0 rounded-md p-1.5 text-cinza hover:bg-white/10 hover:text-pergaminho"
          aria-label="Voltar para amigos"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        {friend.photoUrl ? (
          <img
            src={friend.photoUrl}
            alt={friend.displayName}
            className="h-10 w-10 shrink-0 rounded-full border border-latao/20 object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-latao/10 font-medium text-latao">
            {friend.displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-pergaminho">{friend.displayName}</p>
          <p className="flex items-center gap-1.5 truncate text-xs text-cinza">
            <span>
              {STATUS_EMOJI[friend.status]} {STATUS_LABEL[friend.status]}
            </span>
            {friend.phrase ? (
              <>
                <span aria-hidden>·</span>
                <span className="truncate">{friend.phrase}</span>
              </>
            ) : null}
          </p>
        </div>
        <Link href="/perfil" className="shrink-0 text-xs text-cinza underline hover:text-pergaminho">
          meu status
        </Link>
      </header>

      <main className="flex-1 space-y-3 overflow-y-auto p-4" role="log" aria-live="polite">
        {loading ? (
          <p className="py-8 text-center text-sm text-cinza">Carregando mensagens…</p>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm text-cinza">Nenhuma mensagem ainda.</p>
            <p className="mt-1 text-xs text-cinza-escuro">Diga olá para @{friend.username}.</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const own = message.from_user_id === currentUserId;
            const anterior = index > 0 ? messages[index - 1] : null;
            const mostraDia = !anterior || dia(anterior.created_at) !== dia(message.created_at);
            return (
              <div key={message.id}>
                {mostraDia ? (
                  <p className="my-3 text-center text-[10px] uppercase tracking-widest text-cinza-escuro">
                    {dia(message.created_at)}
                  </p>
                ) : null}
                <div className={cn("flex gap-2", own ? "flex-row-reverse" : "flex-row")}>
                  {!own ? (
                    friend.photoUrl ? (
                      <img
                        src={friend.photoUrl}
                        alt=""
                        className="h-7 w-7 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-latao/10 text-xs font-medium text-latao">
                        {friend.displayName.charAt(0).toUpperCase()}
                      </div>
                    )
                  ) : null}
                  <div
                    className={cn(
                      "max-w-[78%] rounded-2xl border px-4 py-2 text-sm",
                      own
                        ? "rounded-tr-none border-latao/20 bg-latao/15 text-pergaminho"
                        : "rounded-tl-none border-white/10 bg-white/5 text-pergaminho",
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.body}</p>
                    <div className="mt-1 flex items-center justify-end gap-1.5">
                      <span className="text-[10px] text-cinza-escuro">{hora(message.created_at)}</span>
                      {own ? (
                        <span className="text-[10px] text-cinza" title={message.read_at ? "Lida" : "Enviada"}>
                          {message.read_at ? "✓✓" : "✓"}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </main>

      <form onSubmit={enviar} className="border-t border-white/10 p-3">
        {error ? (
          <p role="alert" className="mb-2 text-xs text-alerta-claro">
            {error}
          </p>
        ) : null}
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Digite uma mensagem…"
            maxLength={2000}
            disabled={sending}
            className="min-w-0 flex-1 rounded-full border border-white/10 bg-carvao px-4 py-2 text-sm text-pergaminho placeholder:text-cinza-escuro focus:border-latao/60 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="rounded-full border border-latao/30 bg-latao/10 px-5 py-2 text-sm font-medium text-latao hover:bg-latao/20 disabled:opacity-40"
          >
            {sending ? "Enviando…" : "Enviar"}
          </button>
        </div>
      </form>
    </div>
  );
}
