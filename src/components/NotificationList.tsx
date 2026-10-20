"use client";

import { useState } from "react";
import { Bell } from "lucide-react";

type Notif = { id: string; title: string; body: string; date: string };

export function NotificationList({ notifications }: { notifications: Notif[] }) {
  const [open, setOpen] = useState(false);

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
          <h2 className="mb-2 text-sm font-semibold text-pergaminho">Lembretes de hoje</h2>
          {notifications.length === 0 ? (
            <p className="text-sm text-cinza">Nenhum lembrete pendente.</p>
          ) : (
            <ul className="space-y-2">
              {notifications.map((n) => (
                <li key={n.id} className="border-b border-white/5 pb-2 last:border-0">
                  <p className="text-sm font-medium text-pergaminho">{n.title}</p>
                  <p className="text-xs text-cinza">{n.body}</p>
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
