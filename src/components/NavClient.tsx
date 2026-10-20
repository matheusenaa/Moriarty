"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";

export function NavClient({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2 px-3 pb-2 lg:hidden">
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          onClick={() => setOpen((v) => !v)}
          className="rounded-md border border-latao/30 p-2 text-pergaminho"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
        <span className="font-titulo text-sm text-latao">Moriarty</span>
      </div>
      {open ? (
        <nav aria-label="Navegação principal (móvel)" className="grid grid-cols-2 gap-1 border-t border-latao/10 px-3 py-2 lg:hidden">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "rounded-md px-3 py-2 text-sm",
                pathname.startsWith(item.href) ? "bg-latao/15 text-pergaminho" : "text-cinza",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      ) : (
        <nav aria-label="Atalhos" className="flex gap-1 overflow-x-auto px-3 pb-2 lg:hidden">
          {items.slice(0, 6).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1 text-xs",
                pathname.startsWith(item.href) ? "bg-latao/20 text-pergaminho" : "text-cinza",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
