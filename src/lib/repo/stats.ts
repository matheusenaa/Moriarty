import { query, queryOne } from "../db";

export type DailyMinutes = { date: string; minutes: number; planned: number };

export async function dailyMinutes(userId: string, from: string, to: string): Promise<DailyMinutes[]> {
  const rows = await query<{ date: string; minutes: string; planned: string }>(
    `SELECT date,
            SUM(CASE WHEN status IN ('concluida','parcial') THEN actual_minutes ELSE 0 END) AS minutes,
            SUM(planned_minutes) AS planned
       FROM study_sessions
      WHERE user_id = $1 AND date >= $2 AND date <= $3
      GROUP BY date ORDER BY date`,
    [userId, from, to],
  );
  return rows.map((r) => ({ date: r.date, minutes: Number(r.minutes), planned: Number(r.planned) }));
}

export async function totals(
  userId: string,
  from: string,
  to: string,
): Promise<{ actualMinutes: number; plannedMinutes: number; done: number; planned: number }> {
  const row = await queryOne<{
    actualMinutes: string;
    plannedMinutes: string;
    done: string;
    planned: string;
  }>(
    `SELECT
       COALESCE(SUM(CASE WHEN status IN ('concluida','parcial') THEN actual_minutes ELSE 0 END), 0) AS actualMinutes,
       COALESCE(SUM(planned_minutes), 0) AS plannedMinutes,
       COALESCE(SUM(CASE WHEN status = 'concluida' THEN 1 ELSE 0 END), 0) AS done,
       COUNT(*) AS planned
     FROM study_sessions WHERE user_id = $1 AND date >= $2 AND date <= $3`,
    [userId, from, to],
  );
  return {
    actualMinutes: Number(row?.actualMinutes ?? 0),
    plannedMinutes: Number(row?.plannedMinutes ?? 0),
    done: Number(row?.done ?? 0),
    planned: Number(row?.planned ?? 0),
  };
}

export type SubjectAccuracy = { subjectId: string | null; name: string; correct: number; total: number };

export async function questionAccuracyBySubject(userId: string): Promise<SubjectAccuracy[]> {
  const rows = await query<{ subjectid: string | null; name: string; correct: string; total: string }>(
    `SELECT q.subject_id AS subjectId,
            COALESCE(s.name, 'Sem matéria') AS name,
            SUM(CASE WHEN qa.is_correct = 1 THEN 1 ELSE 0 END) AS correct,
            COUNT(*) AS total
       FROM quiz_answers qa
       JOIN questions q ON q.id = qa.question_id
       JOIN quiz_attempts a ON a.id = qa.attempt_id
       LEFT JOIN subjects s ON s.id = q.subject_id
      WHERE qa.user_id = $1 AND a.finished_at IS NOT NULL
      GROUP BY q.subject_id, s.name
      ORDER BY total DESC`,
    [userId],
  );
  return rows.map((r) => ({
    subjectId: r.subjectid,
    name: r.name,
    correct: Number(r.correct),
    total: Number(r.total),
  }));
}

export type AttemptPoint = { date: string; title: string; accuracy: number; correct: number; total: number };

export async function attemptTrend(userId: string): Promise<AttemptPoint[]> {
  const rows = await query<{ date: string; title: string; correct: number; total: number }>(
    `SELECT substr(a.finished_at, 1, 10) AS date, q.title, a.correct, a.total
       FROM quiz_attempts a JOIN quizzes q ON q.id = a.quiz_id
      WHERE a.user_id = $1 AND a.finished_at IS NOT NULL
      ORDER BY a.finished_at DESC LIMIT 30`,
    [userId],
  );
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

export async function reviewSummary(
  userId: string,
  today: string,
): Promise<{ overdue: number; dueToday: number; done30: number }> {
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
  const done30 = await count(
    "SELECT COUNT(*) c FROM review_history WHERE user_id = $1 AND reviewed_at >= now() - interval '30 days'",
    [userId],
  );
  return { overdue, dueToday, done30 };
}

/** Sequência de dias com ao menos uma sessão concluída (não conta dias sem registro como quebra até hoje). */
export async function studyStreak(userId: string, today: string): Promise<number> {
  const rows = await query<{ date: string }>(
    `SELECT DISTINCT date FROM study_sessions
      WHERE user_id = $1 AND status IN ('concluida','parcial') AND date <= $2
      ORDER BY date DESC LIMIT 400`,
    [userId, today],
  );
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

export function subjectMastery(userId: string): Promise<MasteryRow[]> {
  return query<MasteryRow>(
    "SELECT name, mastery, priority FROM subjects WHERE user_id = $1 AND archived = 0 ORDER BY mastery ASC",
    [userId],
  );
}

export async function sessionsByStatus(
  userId: string,
  from: string,
  to: string,
): Promise<Record<string, number>> {
  const rows = await query<{ status: string; c: string }>(
    "SELECT status, COUNT(*) c FROM study_sessions WHERE user_id = $1 AND date >= $2 AND date <= $3 GROUP BY status",
    [userId, from, to],
  );
  const out: Record<string, number> = {};
  for (const r of rows) out[r.status] = Number(r.c);
  return out;
}
