import { getDb, nowIso, uid } from "../db";

export type CatalogCollectionRow = {
  id: string;
  slug: string;
  title: string;
  discipline_label: string;
  summary: string;
  status: string;
  status_note: string;
  source_name: string;
  source_url: string;
  edital_ref: string;
  checked_at: string;
  created_at: string;
  updated_at: string;
};

export type CatalogItemRow = {
  id: string;
  collection_id: string;
  kind: string;
  category: string;
  title: string;
  body: string;
  options_json: string;
  correct_index: number | null;
  explanation: string;
  origin_note: string;
  ref_label: string;
  url: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export const STATUS_LABEL: Record<string, string> = {
  vigente: "Edital vigente/confirmado",
  historico: "Referência histórica",
  comum: "Conteúdo comum de preparação",
  aguardando: "Aguardando verificação oficial",
};

export const KIND_LABEL: Record<string, string> = {
  area: "Matéria",
  nota: "Nota de estudo",
  flashcard: "Flashcard",
  questao: "Questão de treino",
  fonte: "Fonte",
};

export const CATEGORY_LABEL: Record<string, string> = {
  oficial: "Oficial",
  resumo_proprio: "Resumo próprio",
  questao_autoral: "Questão autoral",
  flashcard: "Flashcard",
  fonte_externa: "Fonte externa",
};

/** Lista as coleções do catálogo de sistema (visível a usuários autenticados). */
export function listCollections(): CatalogCollectionRow[] {
  return getDb()
    .prepare("SELECT * FROM catalog_collections ORDER BY title")
    .all() as CatalogCollectionRow[];
}

export function getCollectionBySlug(slug: string): CatalogCollectionRow | null {
  const row = getDb()
    .prepare("SELECT * FROM catalog_collections WHERE slug = ?")
    .get(slug) as CatalogCollectionRow | undefined;
  return row ?? null;
}

export function listItems(collectionId: string, kind?: string): CatalogItemRow[] {
  const db = getDb();
  if (kind) {
    return db
      .prepare("SELECT * FROM catalog_items WHERE collection_id = ? AND kind = ? ORDER BY sort_order")
      .all(collectionId, kind) as CatalogItemRow[];
  }
  return db
    .prepare("SELECT * FROM catalog_items WHERE collection_id = ? ORDER BY sort_order")
    .all(collectionId) as CatalogItemRow[];
}

export function getItem(id: string): CatalogItemRow | null {
  const row = getDb().prepare("SELECT * FROM catalog_items WHERE id = ?").get(id) as
    | CatalogItemRow
    | undefined;
  return row ?? null;
}

/** Itens de uma coleção por tipo, com contagem — usado na vitrine. */
export function collectionCounts(collectionId: string): Record<string, number> {
  const rows = getDb()
    .prepare("SELECT kind, COUNT(*) c FROM catalog_items WHERE collection_id = ? GROUP BY kind")
    .all(collectionId) as { kind: string; c: number }[];
  const out: Record<string, number> = {};
  for (const r of rows) out[r.kind] = r.c;
  return out;
}

export function getCollectionWithItems(slug: string): {
  collection: CatalogCollectionRow;
  items: CatalogItemRow[];
} | null {
  const collection = getCollectionBySlug(slug);
  if (!collection) return null;
  return { collection, items: listItems(collection.id) };
}

const STATUS_ORDER: Record<string, number> = { vigente: 0, historico: 1, comum: 2, aguardando: 3 };

/**
 * Busca coleções por texto (título/resumo) e status. Também casa quando o texto
 * aparece no título de uma matéria (kind=area) ou de um item da coleção — assim
 * "penal", "trânsito" ou "PMDF" encontram a trilha certa.
 */
export function searchCollections(query?: string, status?: string): CatalogCollectionRow[] {
  const all = listCollections();
  const q = (query ?? "").trim().toLowerCase();
  const statusFilter = (status ?? "").trim();

  return all
    .filter((c) => !statusFilter || c.status === statusFilter)
    .filter((c) => {
      if (!q) return true;
      if (c.title.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q)) return true;
      return getDb()
        .prepare("SELECT 1 FROM catalog_items WHERE collection_id = ? AND LOWER(title) LIKE ? LIMIT 1")
        .get(c.id, `%${q}%`) !== undefined;
    })
    .sort((a, b) => {
      const sa = STATUS_ORDER[a.status] ?? 9;
      const sb = STATUS_ORDER[b.status] ?? 9;
      if (sa !== sb) return sa - sb;
      return a.title.localeCompare(b.title);
    });
}

// ---------------------------------------------------------------------------
// Progresso do usuário sobre o catálogo (dado PESSOAL — não altera o conteúdo).
// ---------------------------------------------------------------------------

export type CatalogProgressState = "lido" | "dominado";

export type CatalogProgressRow = {
  id: string;
  user_id: string;
  item_id: string;
  state: CatalogProgressState;
  created_at: string;
  updated_at: string;
};

/** Mapa item_id → estado para um usuário (usado para marcar a UI). */
export function getUserProgressMap(userId: string, itemIds?: string[]): Record<string, CatalogProgressState> {
  const db = getDb();
  const rows = (
    itemIds && itemIds.length > 0
      ? db
          .prepare(
            `SELECT item_id, state FROM catalog_progress WHERE user_id = ? AND item_id IN (${itemIds
              .map(() => "?")
              .join(",")})`,
          )
          .all(userId, ...itemIds)
      : db.prepare("SELECT item_id, state FROM catalog_progress WHERE user_id = ?").all(userId)
  ) as { item_id: string; state: CatalogProgressState }[];
  const out: Record<string, CatalogProgressState> = {};
  for (const r of rows) out[r.item_id] = r.state;
  return out;
}

export function getItemProgress(userId: string, itemId: string): CatalogProgressState | null {
  const row = getDb()
    .prepare("SELECT state FROM catalog_progress WHERE user_id = ? AND item_id = ?")
    .get(userId, itemId) as { state: CatalogProgressState } | undefined;
  return row?.state ?? null;
}

/** Define o estado de progresso (upsert). Passar null remove o progresso. */
export function setItemProgress(
  userId: string,
  itemId: string,
  state: CatalogProgressState | null,
): void {
  const db = getDb();
  if (state === null) {
    db.prepare("DELETE FROM catalog_progress WHERE user_id = ? AND item_id = ?").run(userId, itemId);
    return;
  }
  const now = nowIso();
  db.prepare(
    `INSERT INTO catalog_progress (id, user_id, item_id, state, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, item_id) DO UPDATE SET state = excluded.state, updated_at = excluded.updated_at`,
  ).run(uid(), userId, itemId, state, now, now);
}

/** Contagem de progresso por coleção para uma trilha (notas lidas, flashcards dominados). */
export function collectionProgressCounts(
  userId: string,
  collectionId: string,
): { lido: number; dominado: number } {
  const row = getDb()
    .prepare(
      `SELECT
         SUM(CASE WHEN cp.state = 'lido' THEN 1 ELSE 0 END) AS lido,
         SUM(CASE WHEN cp.state = 'dominado' THEN 1 ELSE 0 END) AS dominado
       FROM catalog_progress cp
       JOIN catalog_items ci ON ci.id = cp.item_id
       WHERE cp.user_id = ? AND ci.collection_id = ?`,
    )
    .get(userId, collectionId) as { lido: number | null; dominado: number | null };
  return { lido: row.lido ?? 0, dominado: row.dominado ?? 0 };
}
