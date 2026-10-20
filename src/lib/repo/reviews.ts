import { getDb, nowIso, uid } from "../db";
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

export function listReviews(userId: string): ReviewRow[] {
  return getDb()
    .prepare("SELECT * FROM review_items WHERE user_id = ? ORDER BY due_date")
    .all(userId) as ReviewRow[];
}

export function getReview(userId: string, id: string): ReviewRow | null {
  const db = getDb();
  return (
    (db.prepare("SELECT * FROM review_items WHERE id = ? AND user_id = ?").get(id, userId) as ReviewRow) ??
    null
  );
}

/** Fila: atrasadas primeiro, depois as que vencem hoje, depois as próximas. */
export function reviewQueue(userId: string, today: string): ReviewRow[] {
  return getDb()
    .prepare(
      `SELECT * FROM review_items
        WHERE user_id = ? AND state != 'concluida' AND due_date <= date(?, '+3 day')
        ORDER BY due_date ASC`,
    )
    .all(userId, today) as ReviewRow[];
}

export function scheduleReview(
  userId: string,
  data: {
    title: string;
    subjectId: string | null;
    sourceType: "sessao" | "material" | "topico" | "manual";
    sourceId: string | null;
    dueDate: string;
  },
): string | null {
  // Evita duplicar revisão do mesmo item-fonte ainda pendente.
  if (data.sourceId) {
    const dup = getDb()
      .prepare(
        "SELECT id FROM review_items WHERE user_id = ? AND source_type = ? AND source_id = ? AND state != 'concluida'",
      )
      .get(userId, data.sourceType, data.sourceId) as { id: string } | undefined;
    if (dup) return null;
  }
  const id = uid();
  const now = nowIso();
  getDb()
    .prepare(
      `INSERT INTO review_items (id, user_id, subject_id, source_type, source_id, title, due_date, interval_days, ease, reps, lapses, state, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 2.5, 0, 0, 'pendente', ?, ?)`,
    )
    .run(id, userId, data.subjectId, data.sourceType, data.sourceId, data.title, data.dueDate, now, now);
  return id;
}

export function deferReview(userId: string, id: string, newDueDate: string): boolean {
  const review = getReview(userId, id);
  if (!review) return false;
  const db = getDb();
  db.transaction(() => {
    db.prepare(
      "INSERT INTO review_history (id, review_id, user_id, reviewed_at, result, interval_before, interval_after) VALUES (?, ?, ?, ?, 'adiado', ?, ?)",
    ).run(uid(), id, userId, nowIso(), review.interval_days, review.interval_days);
    db.prepare("UPDATE review_items SET state = 'adiada', due_date = ?, updated_at = ? WHERE id = ? AND user_id = ?").run(
      newDueDate,
      nowIso(),
      id,
      userId,
    );
  })();
  return true;
}

export type ReviewOutcome = {
  state: SrsState;
  dueDate: string;
};

export function completeReview(
  userId: string,
  id: string,
  result: ReviewResult,
  today: string,
): ReviewOutcome | null {
  const review = getReview(userId, id);
  if (!review) return null;
  const state: SrsState = {
    intervalDays: review.interval_days,
    ease: review.ease,
    reps: review.reps,
    lapses: review.lapses,
  };
  const next = applyReview(state, result);
  const dueDate = addDaysStr(today, next.intervalDays);
  const db = getDb();
  db.transaction(() => {
    db.prepare(
      "INSERT INTO review_history (id, review_id, user_id, reviewed_at, result, interval_before, interval_after) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run(uid(), id, userId, nowIso(), result, review.interval_days, next.intervalDays);
    db.prepare(
      `UPDATE review_items SET interval_days = ?, ease = ?, reps = ?, lapses = ?, state = 'pendente',
        last_result = ?, due_date = ?, updated_at = ? WHERE id = ? AND user_id = ?`,
    ).run(next.intervalDays, next.ease, next.reps, next.lapses, result, dueDate, nowIso(), id, userId);
  })();
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

export function reviewHistory(userId: string, limit = 50): HistoryRow[] {
  return getDb()
    .prepare(
      `SELECT h.id, h.review_id, h.reviewed_at, h.result, h.interval_before, h.interval_after, r.title
         FROM review_history h JOIN review_items r ON r.id = h.review_id
        WHERE h.user_id = ? ORDER BY h.reviewed_at DESC LIMIT ?`,
    )
    .all(userId, limit) as HistoryRow[];
}

export function reviewStats(userId: string, today: string): { overdue: number; dueToday: number; upcoming: number; doneTotal: number } {
  const db = getDb();
  const overdue = (
    db
      .prepare("SELECT COUNT(*) c FROM review_items WHERE user_id = ? AND state != 'concluida' AND due_date < ?")
      .get(userId, today) as { c: number }
  ).c;
  const dueToday = (
    db
      .prepare("SELECT COUNT(*) c FROM review_items WHERE user_id = ? AND state != 'concluida' AND due_date = ?")
      .get(userId, today) as { c: number }
  ).c;
  const upcoming = (
    db
      .prepare("SELECT COUNT(*) c FROM review_items WHERE user_id = ? AND state != 'concluida' AND due_date > ?")
      .get(userId, today) as { c: number }
  ).c;
  const doneTotal = (
    db.prepare("SELECT COUNT(*) c FROM review_history WHERE user_id = ?").get(userId) as { c: number }
  ).c;
  return { overdue, dueToday, upcoming, doneTotal };
}

function addDaysStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
