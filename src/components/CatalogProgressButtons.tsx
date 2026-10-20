"use client";

import { Badge } from "@/components/Badge";
import { setCatalogItemProgressAction } from "@/actions/catalog";

export type ProgressState = "lido" | "dominado";

export function CatalogProgressButtons({
  itemId,
  slug,
  state,
}: {
  itemId: string;
  slug: string;
  state: ProgressState | null;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
      <form action={setCatalogItemProgressAction}>
        <input type="hidden" name="itemId" value={itemId} />
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="state" value={state === "lido" ? "" : "lido"} />
        <button
          type="submit"
          className={`rounded-md border px-2 py-1 ${
            state === "lido"
              ? "border-petroleo/60 bg-petroleo/15 text-pergaminho"
              : "border-white/10 text-cinza hover:bg-white/5"
          }`}
        >
          {state === "lido" ? "✓ lido" : "marcar como lido"}
        </button>
      </form>
      <form action={setCatalogItemProgressAction}>
        <input type="hidden" name="itemId" value={itemId} />
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="state" value={state === "dominado" ? "" : "dominado"} />
        <button
          type="submit"
          className={`rounded-md border px-2 py-1 ${
            state === "dominado"
              ? "border-latao/60 bg-latao/15 text-latao-claro"
              : "border-white/10 text-cinza hover:bg-white/5"
          }`}
        >
          {state === "dominado" ? "★ dominado" : "marcar como dominado"}
        </button>
      </form>
      {state ? <Badge tone={state === "dominado" ? "latiao" : "petroleo"}>{state}</Badge> : null}
    </div>
  );
}
