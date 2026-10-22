import { execute, nowIso, query, queryOne, uid } from "@/lib/db";

/** Linha da tabela content_contributions. */
export type ContentContributionRow = {
  id: string;
  user_id: string;
  collection_slug: string;
  kind: "nota" | "questao" | "flashcard";
  title: string;
  body: string;
  options_json: string;
  correct_index: number | null;
  explanation: string;
  source_url: string;
  source_label: string;
  status: "pendente" | "aprovado" | "rejeitado";
  review_note: string;
  reviewer_id: string | null;
  created_at: string;
  reviewed_at: string | null;
};

function parseOptions(texto: string): string[] {
  try {
    const arr = JSON.parse(texto);
    return Array.isArray(arr) ? arr.map((o) => String(o)) : [];
  } catch {
    return [];
  }
}

export async function createContribution(
  userId: string,
  input: {
    collectionSlug: string;
    kind: "nota" | "questao" | "flashcard";
    title: string;
    body: string;
    options: string[];
    correctIndex: number | null;
    explanation: string;
    sourceUrl: string;
    sourceLabel: string;
  },
): Promise<string> {
  const id = uid();
  await execute(
    `INSERT INTO content_contributions
       (id, user_id, collection_slug, kind, title, body, options_json, correct_index,
        explanation, source_url, source_label, status, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pendente',$12)`,
    [
      id,
      userId,
      input.collectionSlug,
      input.kind,
      input.title,
      input.body,
      JSON.stringify(input.options),
      input.correctIndex,
      input.explanation,
      input.sourceUrl,
      input.sourceLabel,
      nowIso(),
    ],
  );
  return id;
}

export function listUserContributions(userId: string): Promise<ContentContributionRow[]> {
  return query<ContentContributionRow>(
    "SELECT * FROM content_contributions WHERE user_id = $1 ORDER BY created_at DESC",
    [userId],
  );
}

export function listPendingContributions(limit = 50): Promise<ContentContributionRow[]> {
  return query<ContentContributionRow>(
    "SELECT * FROM content_contributions WHERE status = 'pendente' ORDER BY created_at ASC LIMIT $1",
    [limit],
  );
}

export function countPendingContributions(): Promise<number> {
  return queryOne<{ cnt: number }>(
    "SELECT COUNT(*) AS cnt FROM content_contributions WHERE status = 'pendente'",
    [],
  ).then((r) => Number(r?.cnt ?? 0));
}

/** Aprova ou rejeita a contribuição (apenas admin). */
export async function reviewContribution(
  reviewerId: string,
  contributionId: string,
  decision: "aprovado" | "rejeitado",
  note: string,
): Promise<{ ok: boolean; erro?: string; catalogItemId?: string }> {
  const existing = await queryOne<ContentContributionRow>(
    "SELECT * FROM content_contributions WHERE id = $1",
    [contributionId],
  );
  if (!existing) return { ok: false, erro: "Contribuição não encontrada." };
  if (existing.status !== "pendente") return { ok: false, erro: "Esta sugestão já foi analisada." };

  await execute(
    "UPDATE content_contributions SET status = $1, review_note = $2, reviewer_id = $3, reviewed_at = $4 WHERE id = $5",
    [decision, note, reviewerId, nowIso(), contributionId],
  );

  if (decision === "rejeitado") return { ok: true };

  // APROVADO: cria o item no catálogo (idempotente por título+kind na coleção).
  const { itemDaContribuicao, normalizarContribuicao } = await import("@/lib/contributions");
  const collection = await import("@/lib/repo/catalog").then((m) => m.getCollectionBySlug(existing.collection_slug));
  if (!collection) return { ok: false, erro: "Trilha não encontrada." };

  // Mapeia a linha do banco para o formato esperado por itemDaContribuicao.
  const dadosParaItem = normalizarContribuicao({
    collectionSlug: existing.collection_slug,
    kind: existing.kind,
    title: existing.title,
    body: existing.body,
    options: parseOptions(existing.options_json),
    correctIndex: existing.correct_index,
    explanation: existing.explanation,
    sourceUrl: existing.source_url,
    sourceLabel: existing.source_label,
  });

  // Verifica se já existe item com mesmo título+kind na coleção (constraint UNIQUE).
  const duplicate = await queryOne<{ id: string }>(
    "SELECT id FROM catalog_items WHERE collection_id = $1 AND title = $2 AND kind = $3",
    [collection.id, existing.title, existing.kind],
  );
  if (duplicate) {
    return { ok: false, erro: "Já existe um item com esse título e tipo nesta trilha." };
  }

  // sort_order = max + 1 para o kind na coleção.
  const maxOrder = await queryOne<{ mx: number | null }>(
    "SELECT MAX(sort_order) AS mx FROM catalog_items WHERE collection_id = $1 AND kind = $2",
    [collection.id, existing.kind],
  );
  const sortOrder = (maxOrder?.mx ?? -1) + 1;

  const item = itemDaContribuicao(dadosParaItem, {
    id: uid(),
    autor: existing.user_id, // placeholder; idealmente pegar o username/email do autor
    sortOrder,
  });

  await execute(
    `INSERT INTO catalog_items
       (id, collection_id, kind, category, title, body, options_json, correct_index,
        explanation, origin_note, ref_label, url, sort_order, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$14)`,
    [
      item.id,
      collection.id,
      item.kind,
      item.category,
      item.title,
      item.body,
      item.options_json,
      item.correct_index,
      item.explanation,
      item.origin_note,
      item.ref_label,
      item.url,
      item.sort_order,
      nowIso(),
    ],
  );

  return { ok: true, catalogItemId: item.id };
}