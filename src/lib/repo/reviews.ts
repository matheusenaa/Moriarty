import { execute, nowIso, query, queryOne, uid, withTransaction } from "../db";
import { applyReview, type ReviewResult, type SrsState } from "../srs";

export type ReviewRow = {
  id: string;
  user_id: string;
  subject_id: string | null;
  source_type: string;
  source_id: string | null;
  title: string;
  due_date: string;
  interval_days: number;
  ease: number;
  reps: number;
  lapses: number;
  state: string;
  last_result: string | null;
};

export function listReviews(userId: string): Promise<ReviewRow[]> {
  return query<ReviewRow>("SELECT * FROM review_items WHERE user_id = $1 ORDER BY due_date", [userId]);
}

export function getReview(userId: string, id: string): Promise<ReviewRow | null> {
  return queryOne<ReviewRow>("SELECT * FROM review_items WHERE id = $1 AND user_id = $2", [id, userId]);
}

/** Fila: atrasadas primeiro, depois as que vencem hoje, depois as próximas. */
export function reviewQueue(userId: string, today: string): Promise<ReviewRow[]> {
  const limit = addDaysStr(today, 3);
  return query<ReviewRow>(
    `SELECT * FROM review_items
      WHERE user_id = $1 AND state != 'concluida' AND due_date <= $2
      ORDER BY due_date ASC`,
    [userId, limit],
  );
}

export async function scheduleReview(
  userId: string,
  data: {
    title: string;
    subjectId: string | null;
    sourceType: "sessao" | "material" | "topico" | "manual";
    sourceId: string | null;
    dueDate: string;
  },
): Promise<string | null> {
  // Evita duplicar revisão do mesmo item-fonte ainda pendente.
  if (data.sourceId) {
    const dup = await queryOne<{ id: string }>(
      "SELECT id FROM review_items WHERE user_id = $1 AND source_type = $2 AND source_id = $3 AND state != 'concluida'",
      [userId, data.sourceType, data.sourceId],
    );
    if (dup) return null;
  }
  const id = uid();
  const now = nowIso();
  await execute(
    `INSERT INTO review_items (id, user_id, subject_id, source_type, source_id, title, due_date, interval_days, ease, reps, lapses, state, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 2.5, 0, 0, 'pendente', $8, $9)`,
    [id, userId, data.subjectId, data.sourceType, data.sourceId, data.title, data.dueDate, now, now],
  );
  return id;
}

export async function deferReview(userId: string, id: string, newDueDate: string): Promise<boolean> {
  const review = await getReview(userId, id);
  if (!review) return false;
  await withTransaction(async (client) => {
    await client.query(
      "INSERT INTO review_history (id, review_id, user_id, reviewed_at, result, interval_before, interval_after) VALUES ($1, $2, $3, $4, 'adiado', $5, $6)",
      [uid(), id, userId, nowIso(), review.interval_days, review.interval_days],
    );
    await client.query(
      "UPDATE review_items SET state = 'adiada', due_date = $1, updated_at = $2 WHERE id = $3 AND user_id = $4",
      [newDueDate, nowIso(), id, userId],
    );
  });
  return true;
}

export type ReviewOutcome = {
  state: SrsState;
  dueDate: string;
};

export async function completeReview(
  userId: string,
  id: string,
  result: ReviewResult,
  today: string,
): Promise<ReviewOutcome | null> {
  const review = await getReview(userId, id);
  if (!review) return null;
  const state: SrsState = {
    intervalDays: review.interval_days,
    ease: review.ease,
    reps: review.reps,
    lapses: review.lapses,
  };
  const next = applyReview(state, result);
  const dueDate = addDaysStr(today, next.intervalDays);
  await withTransaction(async (client) => {
    await client.query(
      "INSERT INTO review_history (id, review_id, user_id, reviewed_at, result, interval_before, interval_after) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [uid(), id, userId, nowIso(), result, review.interval_days, next.intervalDays],
    );
    await client.query(
      `UPDATE review_items SET interval_days = $1, ease = $2, reps = $3, lapses = $4, state = 'pendente',
        last_result = $5, due_date = $6, updated_at = $7 WHERE id = $8 AND user_id = $9`,
      [next.intervalDays, next.ease, next.reps, next.lapses, result, dueDate, nowIso(), id, userId],
    );
  });
  return { state: next, dueDate };
}

export type HistoryRow = {
  id: string;
  review_id: string;
  reviewed_at: string;
  result: string;
  interval_before: number;
  interval_after: number;
  title: string;
};

export function reviewHistory(userId: string, limit = 50): Promise<HistoryRow[]> {
  return query<HistoryRow>(
    `SELECT h.id, h.review_id, h.reviewed_at, h.result, h.interval_before, h.interval_after, r.title
       FROM review_history h JOIN review_items r ON r.id = h.review_id
      WHERE h.user_id = $1 ORDER BY h.reviewed_at DESC LIMIT $2`,
    [userId, limit],
  );
}

export async function reviewStats(
  userId: string,
  today: string,
): Promise<{ overdue: number; dueToday: number; upcoming: number; doneTotal: number }> {
  const count = async (sql: string, params: unknown[]) => {
    const row = await queryOne<{ c: string }>(sql, params);
    return Number(row?.c ?? 0);
  };
  const overdue = await count(
    "SELECT COUNT(*) c FROM review_items WHERE user_id = $1 AND state != 'concluida' AND due_date < $2",
    [userId, today],
  );
  const dueToday = await count(
    "SELECT COUNT(*) c FROM review_items WHERE user_id = $1 AND state != 'concluida' AND due_date = $2",
    [userId, today],
  );
  const upcoming = await count(
    "SELECT COUNT(*) c FROM review_items WHERE user_id = $1 AND state != 'concluida' AND due_date > $2",
    [userId, today],
  );
  const doneTotal = await count("SELECT COUNT(*) c FROM review_history WHERE user_id = $1", [userId]);
  return { overdue, dueToday, upcoming, doneTotal };
}

function addDaysStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
