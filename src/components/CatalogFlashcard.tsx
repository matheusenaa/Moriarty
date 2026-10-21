"use client";

import { useState } from "react";
import { Badge } from "@/components/Badge";
import { saveCatalogItemAction, scheduleCatalogItemReviewAction } from "@/actions/catalog";
import { CatalogProgressButtons, type ProgressState } from "@/components/CatalogProgressButtons";

export type FlashcardView = {
  id: string;
  title: string;
  front: string;
  back: string;
  refLabel: string;
  url: string;
};

export function CatalogFlashcard({
  item,
  slug,
  state,
}: {
  item: FlashcardView;
  slug: string;
  state: ProgressState | null;
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="rounded-md border border-white/10 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-pergaminho">{item.title}</p>
        <Badge tone="neutro">flashcard</Badge>
      </div>
      <button
        type="button"
        onClick={() => setFlipped((v) => !v)}
        aria-pressed={flipped}
        className="mt-2 w-full rounded-md border border-latao/20 bg-carvao/40 p-3 text-left text-sm text-pergaminho/90 hover:border-latao/40"
      >
        {flipped ? item.back : item.front}
      </button>
      <div className="mt-2 flex items-center justify-between">
        <button type="button" onClick={() => setFlipped((v) => !v)} className="text-xs text-latao underline">
          {flipped ? "ver frente" : "ver verso"}
        </button>
        {item.refLabel ? <span className="text-xs text-cinza-escuro">{item.refLabel}</span> : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs">
        <form action={saveCatalogItemAction}>
          <input type="hidden" name="itemId" value={item.id} />
          <button type="submit" className="text-latao underline">
            salvar na minha biblioteca
          </button>
        </form>
        <form action={scheduleCatalogItemReviewAction}>
          <input type="hidden" name="itemId" value={item.id} />
          <button type="submit" className="text-cinza underline hover:text-pergaminho">
            revisar amanhã
          </button>
        </form>
      </div>
      <CatalogProgressButtons itemId={item.id} slug={slug} state={state} />
    </div>
  );
}
