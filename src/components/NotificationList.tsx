"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check } from "lucide-react";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/actions/profile";

type Notif = { id: string; title: string; body: string; date: string };

export function NotificationList({ notifications }: { notifications: Notif[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function marcarLida(id: string) {
    startTransition(async () => {
      await markNotificationReadAction(id);
      router.refresh();
    });
  }

  function marcarTodas() {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label={`Notificações (${notifications.length} não lidas)`}
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-md border border-latao/25 p-2 text-cinza hover:text-pergaminho"
      >
        <Bell size={16} aria-hidden />
        {notifications.length > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-latao px-1 text-[10px] font-bold text-carvao">
            {notifications.length}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="cartao absolute right-0 top-11 z-30 w-80 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-pergaminho">Lembretes de hoje</h2>
            {notifications.length > 0 ? (
              <button
                type="button"
                onClick={marcarTodas}
                disabled={pending}
                className="text-[11px] text-latao underline disabled:opacity-50"
              >
                marcar todas como lidas
              </button>
            ) : null}
          </div>
          {notifications.length === 0 ? (
            <p className="text-sm text-cinza">Nenhum lembrete pendente.</p>
          ) : (
            <ul className="space-y-2">
              {notifications.map((n) => (
                <li key={n.id} className="border-b border-white/5 pb-2 last:border-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-pergaminho">{n.title}</p>
                      <p className="text-xs text-cinza">{n.body}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => marcarLida(n.id)}
                      disabled={pending}
                      title="Marcar como lida"
                      aria-label={`Marcar "${n.title}" como lida`}
                      className="shrink-0 rounded-md border border-latao/25 p-1 text-cinza hover:text-latao disabled:opacity-50"
                    >
                      <Check size={12} aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-[11px] text-cinza-escuro">
            Lembretes internos da plataforma. Notificação do navegador não é garantida.
          </p>
        </div>
      ) : null}
    </div>
  );
}
