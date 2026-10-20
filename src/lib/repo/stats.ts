import { getDb } from "../db";

export type DailyMinutes = { date: string; minutes: number; planned: number };

export function dailyMinutes(userId: string, from: string, to: string): DailyMinutes[] {
  return getDb()
    .prepare(
      `SELECT date,
              SUM(CASE WHEN status IN ('concluida','parcial') THEN actual_minutes ELSE 0 END) AS minutes,
              SUM(planned_minutes) AS planned
         FROM study_sessions
        WHERE user_id = ? AND date >= ? AND date <= ?
        GROUP BY date ORDER BY date`,
    )
    .all(userId, from, to) as DailyMinutes[];
}

export function totals(userId: string, from: string, to: string): { actualMinutes: number; plannedMinutes: number; done: number; planned: number } {
  const row = getDb()
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN status IN ('concluida','parcial') THEN actual_minutes ELSE 0 END), 0) AS actualMinutes,
         COALESCE(SUM(planned_minutes), 0) AS plannedMinutes,
         COALESCE(SUM(CASE WHEN status = 'concluida' THEN 1 ELSE 0 END), 0) AS done,
         COUNT(*) AS planned
       FROM study_sessions WHERE user_id = ? AND date >= ? AND date <= ?`,
    )
    .get(userId, from, to) as { actualMinutes: number; plannedMinutes: number; done: number; planned: number };
  return row;
}

export type SubjectAccuracy = { subjectId: string | null; name: string; correct: number; total: number };

export function questionAccuracyBySubject(userId: string): SubjectAccuracy[] {
  return getDb()
    .prepare(
      `SELECT q.subject_id AS subjectId,
              COALESCE(s.name, 'Sem matéria') AS name,
              SUM(CASE WHEN qa.is_correct = 1 THEN 1 ELSE 0 END) AS correct,
              COUNT(*) AS total
         FROM quiz_answers qa
         JOIN questions q ON q.id = qa.question_id
         JOIN quiz_attempts a ON a.id = qa.attempt_id
         LEFT JOIN subjects s ON s.id = q.subject_id
        WHERE qa.user_id = ? AND a.finished_at IS NOT NULL
        GROUP BY q.subject_id, s.name
        ORDER BY total DESC`,
    )
    .all(userId) as SubjectAccuracy[];
}

export type AttemptPoint = { date: string; title: string; accuracy: number; correct: number; total: number };

export function attemptTrend(userId: string): AttemptPoint[] {
  const rows = getDb()
    .prepare(
      `SELECT substr(a.finished_at, 1, 10) AS date, q.title, a.correct, a.total
         FROM quiz_attempts a JOIN quizzes q ON q.id = a.quiz_id
        WHERE a.user_id = ? AND a.finished_at IS NOT NULL
        ORDER BY a.finished_at DESC LIMIT 30`,
    )
    .all(userId) as { date: string; title: string; correct: number; total: number }[];
  return rows
    .reverse()
    .map((r) => ({
      date: r.date,
      title: r.title,
      correct: r.correct,
      total: r.total,
      accuracy: r.total === 0 ? 0 : Math.round((r.correct / r.total) * 100),
    }));
}

export function reviewSummary(userId: string, today: string): { overdue: number; dueToday: number; done30: number } {
  const db = getDb();
  const overdue = (db.prepare("SELECT COUNT(*) c FROM review_items WHERE user_id = ? AND state != 'concluida' AND due_date < ?").get(userId, today) as { c: number }).c;
  const dueToday = (db.prepare("SELECT COUNT(*) c FROM review_items WHERE user_id = ? AND state != 'concluida' AND due_date = ?").get(userId, today) as { c: number }).c;
  const done30 = (
    db
      .prepare("SELECT COUNT(*) c FROM review_history WHERE user_id = ? AND reviewed_at >= datetime('now', '-30 days')")
      .get(userId) as { c: number }
  ).c;
  return { overdue, dueToday, done30 };
}

/** Sequência de dias com ao menos uma sessão concluída (não conta dias sem registro como quebra até hoje). */
export function studyStreak(userId: string, today: string): number {
  const rows = getDb()
    .prepare(
      `SELECT DISTINCT date FROM study_sessions
        WHERE user_id = ? AND status IN ('concluida','parcial') AND date <= ?
        ORDER BY date DESC LIMIT 400`,
    )
    .all(userId, today) as { date: string }[];
  if (rows.length === 0) return 0;
  const set = new Set(rows.map((r) => r.date));
  let streak = 0;
  let cursor = today;
  // Se hoje ainda não houve estudo, a sequência vale a partir de ontem.
  if (!set.has(cursor)) {
    cursor = shift(cursor, -1);
    if (!set.has(cursor)) return 0;
  }
  while (set.has(cursor)) {
    streak++;
    cursor = shift(cursor, -1);
  }
  return streak;
}

function shift(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export type MasteryRow = { name: string; mastery: number; priority: number };

export function subjectMastery(userId: string): MasteryRow[] {
  return getDb()
    .prepare("SELECT name, mastery, priority FROM subjects WHERE user_id = ? AND archived = 0 ORDER BY mastery ASC")
    .all(userId) as MasteryRow[];
}

export function sessionsByStatus(userId: string, from: string, to: string): Record<string, number> {
  const rows = getDb()
    .prepare("SELECT status, COUNT(*) c FROM study_sessions WHERE user_id = ? AND date >= ? AND date <= ? GROUP BY status")
    .all(userId, from, to) as { status: string; c: number }[];
  const out: Record<string, number> = {};
  for (const r of rows) out[r.status] = r.c;
  return out;
}
