import { execute, nowIso, query, queryOne, uid } from "@/lib/db";

/**
 * Tentativas de simulado por trilha (dados pessoais do usuário).
 * As questões continuam no catálogo de sistema; aqui só fica o sorteio, as
 * respostas dadas e o resultado.
 */

export type CatalogQuizAttemptRow = {
  id: string;
  user_id: string;
  collection_id: string;
  collection_slug: string;
  question_ids_json: string;
  duration_minutes: number;
  answers_json: string;
  correct_count: number;
  started_at: string;
  finished_at: string | null;
};

export type RespostaArmazenada = { itemId: string; chosenIndex: number; isCorrect: boolean };

function parseJson<T>(texto: string, fallback: T): T {
  try {
    const parsed = JSON.parse(texto);
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
}

export function parseRespostas(texto: string): RespostaArmazenada[] {
  const lista = parseJson<unknown>(texto, []);
  if (!Array.isArray(lista)) return [];
  return lista
    .filter((r): r is Record<string, unknown> => typeof r === "object" && r !== null)
    .map((r) => ({
      itemId: String(r.itemId ?? ""),
      chosenIndex: Number(r.chosenIndex ?? -1),
      isCorrect: r.isCorrect === true,
    }))
    .filter((r) => r.itemId !== "");
}

export function parseQuestionIds(texto: string): string[] {
  const lista = parseJson<unknown>(texto, []);
  if (!Array.isArray(lista)) return [];
  return lista.map((id) => String(id)).filter(Boolean);
}

export async function createAttempt(
  userId: string,
  input: {
    collectionId: string;
    collectionSlug: string;
    questionIds: string[];
    durationMinutes: number;
  },
): Promise<string> {
  const id = uid();
  await execute(
    `INSERT INTO catalog_quiz_attempts
       (id, user_id, collection_id, collection_slug, question_ids_json, duration_minutes, answers_json, correct_count, started_at)
     VALUES ($1, $2, $3, $4, $5, $6, '[]', 0, $7)`,
    [
      id,
      userId,
      input.collectionId,
      input.collectionSlug,
      JSON.stringify(input.questionIds),
      input.durationMinutes,
      nowIso(),
    ],
  );
  return id;
}

export function getAttempt(userId: string, id: string): Promise<CatalogQuizAttemptRow | null> {
  return queryOne<CatalogQuizAttemptRow>(
    "SELECT * FROM catalog_quiz_attempts WHERE id = $1 AND user_id = $2",
    [id, userId],
  );
}

/** Registra (ou substitui) a resposta de uma questão da tentativa. */
export async function saveAttemptAnswer(
  userId: string,
  attemptId: string,
  itemId: string,
  chosenIndex: number,
  isCorrect: boolean,
): Promise<void> {
  const atual = await getAttempt(userId, attemptId);
  if (!atual) return;
  const respostas = parseRespostas(atual.answers_json).filter((r) => r.itemId !== itemId);
  respostas.push({ itemId, chosenIndex, isCorrect });
  const correctCount = respostas.filter((r) => r.isCorrect).length;
  await execute(
    "UPDATE catalog_quiz_attempts SET answers_json = $1, correct_count = $2 WHERE id = $3 AND user_id = $4",
    [JSON.stringify(respostas), correctCount, attemptId, userId],
  );
}

/** Encerra a tentativa (idempotente). */
export async function finishAttempt(userId: string, attemptId: string): Promise<void> {
  await execute(
    "UPDATE catalog_quiz_attempts SET finished_at = $1 WHERE id = $2 AND user_id = $3 AND finished_at IS NULL",
    [nowIso(), attemptId, userId],
  );
}

export function listAttempts(userId: string, limit = 10): Promise<CatalogQuizAttemptRow[]> {
  return query<CatalogQuizAttemptRow>(
    "SELECT * FROM catalog_quiz_attempts WHERE user_id = $1 ORDER BY started_at DESC LIMIT $2",
    [userId, limit],
  );
}
