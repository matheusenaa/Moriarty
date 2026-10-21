import { execute, nowIso, query, queryOne, uid } from "../db";

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
export function listCollections(): Promise<CatalogCollectionRow[]> {
  return query<CatalogCollectionRow>("SELECT * FROM catalog_collections ORDER BY title");
}

export function getCollectionBySlug(slug: string): Promise<CatalogCollectionRow | null> {
  return queryOne<CatalogCollectionRow>("SELECT * FROM catalog_collections WHERE slug = $1", [slug]);
}

export function listItems(collectionId: string, kind?: string): Promise<CatalogItemRow[]> {
  if (kind) {
    return query<CatalogItemRow>(
      "SELECT * FROM catalog_items WHERE collection_id = $1 AND kind = $2 ORDER BY sort_order",
      [collectionId, kind],
    );
  }
  return query<CatalogItemRow>(
    "SELECT * FROM catalog_items WHERE collection_id = $1 ORDER BY sort_order",
    [collectionId],
  );
}

export function getItem(id: string): Promise<CatalogItemRow | null> {
  return queryOne<CatalogItemRow>("SELECT * FROM catalog_items WHERE id = $1", [id]);
}

/** Itens de uma coleção por tipo, com contagem — usado na vitrine. */
export async function collectionCounts(collectionId: string): Promise<Record<string, number>> {
  const rows = await query<{ kind: string; c: string }>(
    "SELECT kind, COUNT(*) c FROM catalog_items WHERE collection_id = $1 GROUP BY kind",
    [collectionId],
  );
  const out: Record<string, number> = {};
  for (const r of rows) out[r.kind] = Number(r.c);
  return out;
}

export async function getCollectionWithItems(slug: string): Promise<{
  collection: CatalogCollectionRow;
  items: CatalogItemRow[];
} | null> {
  const collection = await getCollectionBySlug(slug);
  if (!collection) return null;
  return { collection, items: await listItems(collection.id) };
}

const STATUS_ORDER: Record<string, number> = { vigente: 0, historico: 1, comum: 2, aguardando: 3 };

/**
 * Busca coleções por texto (título/resumo) e status. Também casa quando o texto
 * aparece no título de uma matéria (kind=area) ou de um item da coleção — assim
 * "penal", "trânsito" ou "PMDF" encontram a trilha certa.
 */
export async function searchCollections(queryText?: string, status?: string): Promise<CatalogCollectionRow[]> {
  const all = await listCollections();
  const q = (queryText ?? "").trim().toLowerCase();
  const statusFilter = (status ?? "").trim();

  const filtered = await Promise.all(
    all
      .filter((c) => !statusFilter || c.status === statusFilter)
      .map(async (c) => {
        if (!q) return c;
        if (c.title.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q)) return c;
        const hit = await queryOne(
          "SELECT 1 FROM catalog_items WHERE collection_id = $1 AND lower(title) LIKE $2 LIMIT 1",
          [c.id, `%${q}%`],
        );
        return hit ? c : null;
      }),
  );

  return filtered
    .filter((c): c is CatalogCollectionRow => c !== null)
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
export async function getUserProgressMap(
  userId: string,
  itemIds?: string[],
): Promise<Record<string, CatalogProgressState>> {
  const rows =
    itemIds && itemIds.length > 0
      ? await query<{ item_id: string; state: CatalogProgressState }>(
          `SELECT item_id, state FROM catalog_progress WHERE user_id = $1 AND item_id IN (${itemIds
            .map((_, i) => `$${i + 2}`)
            .join(",")})`,
          [userId, ...itemIds],
        )
      : await query<{ item_id: string; state: CatalogProgressState }>(
          "SELECT item_id, state FROM catalog_progress WHERE user_id = $1",
          [userId],
        );
  const out: Record<string, CatalogProgressState> = {};
  for (const r of rows) out[r.item_id] = r.state;
  return out;
}

export function getItemProgress(
  userId: string,
  itemId: string,
): Promise<CatalogProgressState | null> {
  return queryOne<{ state: CatalogProgressState }>(
    "SELECT state FROM catalog_progress WHERE user_id = $1 AND item_id = $2",
    [userId, itemId],
  ).then((row) => row?.state ?? null);
}

/** Define o estado de progresso (upsert). Passar null remove o progresso. */
export async function setItemProgress(
  userId: string,
  itemId: string,
  state: CatalogProgressState | null,
): Promise<void> {
  if (state === null) {
    await execute("DELETE FROM catalog_progress WHERE user_id = $1 AND item_id = $2", [userId, itemId]);
    return;
  }
  const now = nowIso();
  await execute(
    `INSERT INTO catalog_progress (id, user_id, item_id, state, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT(user_id, item_id) DO UPDATE SET state = excluded.state, updated_at = excluded.updated_at`,
    [uid(), userId, itemId, state, now, now],
  );
}

/** Contagem de progresso por coleção para uma trilha (notas lidas, flashcards dominados). */
export async function collectionProgressCounts(
  userId: string,
  collectionId: string,
): Promise<{ lido: number; dominado: number }> {
  const row = await queryOne<{ lido: string | null; dominado: string | null }>(
    `SELECT
       SUM(CASE WHEN cp.state = 'lido' THEN 1 ELSE 0 END) AS lido,
       SUM(CASE WHEN cp.state = 'dominado' THEN 1 ELSE 0 END) AS dominado
     FROM catalog_progress cp
     JOIN catalog_items ci ON ci.id = cp.item_id
     WHERE cp.user_id = $1 AND ci.collection_id = $2`,
    [userId, collectionId],
  );
  return { lido: Number(row?.lido ?? 0), dominado: Number(row?.dominado ?? 0) };
}

// ---------------------------------------------------------------------------
// Respostas às questões de treino das trilhas (dado PESSOAL).
// Guarda o último resultado por questão + número de tentativas.
// ---------------------------------------------------------------------------

export type QuestionResult = { isCorrect: boolean; attempts: number; chosenIndex: number };

export type CatalogQuestionStat = {
  slug: string;
  title: string;
  answered: number;
  correct: number;
  total: number;
};

export type MissedQuestion = {
  itemId: string;
  title: string;
  attempts: number;
  updatedAt: string;
  collectionSlug: string;
  collectionTitle: string;
};

/**
 * Grava (ou atualiza) o último resultado do usuário numa questão de treino.
 * O gabarito é sempre conferido no servidor a partir do item, nunca do cliente.
 */
export async function recordQuestionAnswer(
  userId: string,
  itemId: string,
  chosenIndex: number,
  isCorrect: boolean,
): Promise<void> {
  const now = nowIso();
  await execute(
    `INSERT INTO catalog_answers (id, user_id, item_id, chosen_index, is_correct, attempts, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, 1, $6, $7)
     ON CONFLICT(user_id, item_id) DO UPDATE SET
       chosen_index = excluded.chosen_index,
       is_correct = excluded.is_correct,
       attempts = catalog_answers.attempts + 1,
       updated_at = excluded.updated_at`,
    [uid(), userId, itemId, chosenIndex, isCorrect ? 1 : 0, now, now],
  );
}

/** Mapa item_id → último resultado, restrito aos itens informados. */
export async function getUserQuestionResults(
  userId: string,
  itemIds: string[],
): Promise<Record<string, QuestionResult>> {
  if (itemIds.length === 0) return {};
  const rows = await query<{
    item_id: string;
    is_correct: number;
    attempts: number;
    chosen_index: number;
  }>(
    `SELECT item_id, is_correct, attempts, chosen_index FROM catalog_answers
      WHERE user_id = $1 AND item_id IN (${itemIds.map((_, i) => `$${i + 2}`).join(",")})`,
    [userId, ...itemIds],
  );
  const out: Record<string, QuestionResult> = {};
  for (const r of rows) {
    out[r.item_id] = {
      isCorrect: r.is_correct === 1,
      attempts: Number(r.attempts),
      chosenIndex: Number(r.chosen_index),
    };
  }
  return out;
}

/** Contagem de questões respondidas/acertadas numa trilha específica. */
export async function collectionQuestionStats(
  userId: string,
  collectionId: string,
): Promise<{ answered: number; correct: number; total: number }> {
  const row = await queryOne<{ answered: string | null; correct: string | null; total: string }>(
    `SELECT
       COUNT(ca.id) AS answered,
       COALESCE(SUM(CASE WHEN ca.is_correct = 1 THEN 1 ELSE 0 END), 0) AS correct,
       COUNT(ci.id) AS total
     FROM catalog_items ci
     LEFT JOIN catalog_answers ca ON ca.item_id = ci.id AND ca.user_id = $1
     WHERE ci.collection_id = $2 AND ci.kind = 'questao'`,
    [userId, collectionId],
  );
  return {
    answered: Number(row?.answered ?? 0),
    correct: Number(row?.correct ?? 0),
    total: Number(row?.total ?? 0),
  };
}

/** Estatísticas por trilha com pelo menos uma questão respondida. */
export async function catalogQuestionStats(userId: string): Promise<CatalogQuestionStat[]> {
  const rows = await query<{
    slug: string;
    title: string;
    answered: string;
    correct: string;
    total: string;
  }>(
    `SELECT cc.slug, cc.title,
            COUNT(ca.id) AS answered,
            COALESCE(SUM(CASE WHEN ca.is_correct = 1 THEN 1 ELSE 0 END), 0) AS correct,
            COUNT(ci.id) AS total
       FROM catalog_collections cc
       JOIN catalog_items ci ON ci.collection_id = cc.id AND ci.kind = 'questao'
       LEFT JOIN catalog_answers ca ON ca.item_id = ci.id AND ca.user_id = $1
      GROUP BY cc.id, cc.slug, cc.title
     HAVING COUNT(ca.id) > 0
      ORDER BY cc.title`,
    [userId],
  );
  return rows.map((r) => ({
    slug: r.slug,
    title: r.title,
    answered: Number(r.answered),
    correct: Number(r.correct),
    total: Number(r.total),
  }));
}

/** Questões respondidas erradas por último (para revisão), mais recentes primeiro. */
export async function listMissedQuestions(userId: string, limit = 10): Promise<MissedQuestion[]> {
  const rows = await query<{
    item_id: string;
    title: string;
    attempts: number;
    updated_at: string;
    slug: string;
    collection_title: string;
  }>(
    `SELECT ca.item_id, ci.title, ca.attempts, ca.updated_at,
            cc.slug, cc.title AS collection_title
       FROM catalog_answers ca
       JOIN catalog_items ci ON ci.id = ca.item_id
       JOIN catalog_collections cc ON cc.id = ci.collection_id
      WHERE ca.user_id = $1 AND ca.is_correct = 0
      ORDER BY ca.updated_at DESC
      LIMIT $2`,
    [userId, limit],
  );
  return rows.map((r) => ({
    itemId: r.item_id,
    title: r.title,
    attempts: Number(r.attempts),
    updatedAt: r.updated_at,
    collectionSlug: r.slug,
    collectionTitle: r.collection_title,
  }));
}
