import { execute, nowIso, query, queryOne, uid, withTransaction } from "../db";
import type { QuestionForQuiz } from "../quiz";

export type QuestionRow = {
  id: string;
  user_id: string;
  statement: string;
  type: string;
  options_json: string;
  correct_index: number;
  explanation: string;
  subject_id: string | null;
  difficulty: number;
  source_name: string;
  origin: string;
};

export type QuizRow = {
  id: string;
  user_id: string;
  goal_id: string | null;
  title: string;
  mode: string;
  time_limit_seconds: number;
  shuffle: number;
};

export type AttemptRow = {
  id: string;
  user_id: string;
  quiz_id: string;
  started_at: string;
  finished_at: string | null;
  answered: number;
  correct: number;
  total: number;
  duration_seconds: number;
};

export async function createQuestion(
  userId: string,
  data: {
    statement: string;
    type: "multipla" | "certo_errado";
    options: string[];
    correctIndex: number;
    explanation: string;
    subjectId: string | null;
    difficulty: number;
    sourceName: string;
    origin: "autoral" | "ia" | "importada";
  },
): Promise<string> {
  const id = uid();
  await execute(
    `INSERT INTO questions (id, user_id, statement, type, options_json, correct_index, explanation, subject_id, difficulty, source_name, origin, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      id,
      userId,
      data.statement,
      data.type,
      JSON.stringify(data.options),
      data.correctIndex,
      data.explanation,
      data.subjectId,
      data.difficulty,
      data.sourceName,
      data.origin,
      nowIso(),
    ],
  );
  return id;
}

export function listQuestions(userId: string, subjectId?: string): Promise<QuestionRow[]> {
  if (subjectId) {
    return query<QuestionRow>(
      "SELECT * FROM questions WHERE user_id = $1 AND subject_id = $2 ORDER BY created_at DESC LIMIT 500",
      [userId, subjectId],
    );
  }
  return query<QuestionRow>(
    "SELECT * FROM questions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 500",
    [userId],
  );
}

export function getQuestion(userId: string, id: string): Promise<QuestionRow | null> {
  return queryOne<QuestionRow>("SELECT * FROM questions WHERE id = $1 AND user_id = $2", [id, userId]);
}

export async function deleteQuestion(userId: string, id: string): Promise<boolean> {
  return (await execute("DELETE FROM questions WHERE id = $1 AND user_id = $2", [id, userId])) > 0;
}

export async function countQuestions(userId: string): Promise<number> {
  const row = await queryOne<{ c: string }>("SELECT COUNT(*) c FROM questions WHERE user_id = $1", [userId]);
  return Number(row?.c ?? 0);
}

export function toQuizQuestion(q: QuestionRow): QuestionForQuiz & { correctIndex: number } {
  return {
    id: q.id,
    statement: q.statement,
    type: q.type === "certo_errado" ? "certo_errado" : "multipla",
    options: JSON.parse(q.options_json) as string[],
    correctIndex: q.correct_index,
    explanation: q.explanation,
    subjectId: q.subject_id,
    difficulty: q.difficulty,
  };
}

export async function createQuiz(
  userId: string,
  data: {
    title: string;
    goalId: string | null;
    mode: "pratica" | "simulado";
    timeLimitSeconds: number;
    shuffle: boolean;
    questionIds: string[];
  },
): Promise<string> {
  const id = uid();
  await withTransaction(async (client) => {
    await client.query(
      "INSERT INTO quizzes (id, user_id, goal_id, title, mode, time_limit_seconds, shuffle, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [id, userId, data.goalId, data.title, data.mode, data.timeLimitSeconds, data.shuffle ? 1 : 0, nowIso()],
    );
    for (let i = 0; i < data.questionIds.length; i++) {
      await client.query("INSERT INTO quiz_questions (quiz_id, question_id, position) VALUES ($1, $2, $3)", [
        id,
        data.questionIds[i],
        i,
      ]);
    }
  });
  return id;
}

export function getQuiz(userId: string, id: string): Promise<QuizRow | null> {
  return queryOne<QuizRow>("SELECT * FROM quizzes WHERE id = $1 AND user_id = $2", [id, userId]);
}

export async function listQuizzes(userId: string): Promise<(QuizRow & { attempts: number; best: number })[]> {
  const rows = await query<QuizRow & { attempts: string; best: string | null }>(
    `SELECT q.*,
            (SELECT COUNT(*) FROM quiz_attempts a WHERE a.quiz_id = q.id) AS attempts,
            (SELECT MAX(CASE WHEN a.total > 0 THEN a.correct * 100 / a.total ELSE 0 END)
               FROM quiz_attempts a WHERE a.quiz_id = q.id) AS best
       FROM quizzes q WHERE q.user_id = $1 ORDER BY q.created_at DESC LIMIT 100`,
    [userId],
  );
  return rows.map((r) => ({ ...r, attempts: Number(r.attempts), best: Number(r.best ?? 0) }));
}

export async function quizQuestionIds(quizId: string, userId: string): Promise<string[]> {
  const quiz = await queryOne<{ user_id: string }>("SELECT user_id FROM quizzes WHERE id = $1", [quizId]);
  if (!quiz || quiz.user_id !== userId) return [];
  const rows = await query<{ question_id: string }>(
    "SELECT question_id FROM quiz_questions WHERE quiz_id = $1 ORDER BY position",
    [quizId],
  );
  return rows.map((r) => r.question_id);
}

export async function deleteQuiz(userId: string, id: string): Promise<boolean> {
  return (await execute("DELETE FROM quizzes WHERE id = $1 AND user_id = $2", [id, userId])) > 0;
}

export async function startAttempt(userId: string, quizId: string, total: number): Promise<string | null> {
  const quiz = await getQuiz(userId, quizId);
  if (!quiz) return null;
  const id = uid();
  await execute("INSERT INTO quiz_attempts (id, user_id, quiz_id, started_at, total) VALUES ($1, $2, $3, $4, $5)", [
    id,
    userId,
    quizId,
    nowIso(),
    total,
  ]);
  return id;
}

export function getAttempt(userId: string, id: string): Promise<AttemptRow | null> {
  return queryOne<AttemptRow>("SELECT * FROM quiz_attempts WHERE id = $1 AND user_id = $2", [id, userId]);
}

export async function saveAnswer(
  userId: string,
  attemptId: string,
  questionId: string,
  chosenIndex: number | null,
  secondsSpent: number,
): Promise<void> {
  const attempt = await queryOne<{ user_id: string }>("SELECT user_id FROM quiz_attempts WHERE id = $1", [attemptId]);
  if (!attempt || attempt.user_id !== userId) return;
  await execute(
    `INSERT INTO quiz_answers (id, attempt_id, user_id, question_id, chosen_index, is_correct, seconds_spent)
     VALUES ($1, $2, $3, $4, $5, 0, $6)
     ON CONFLICT (attempt_id, question_id) DO UPDATE SET chosen_index = excluded.chosen_index, seconds_spent = excluded.seconds_spent`,
    [uid(), attemptId, userId, questionId, chosenIndex, secondsSpent],
  );
}

export type AnswerRow = { question_id: string; chosen_index: number | null; seconds_spent: number };

export function listAnswers(userId: string, attemptId: string): Promise<AnswerRow[]> {
  return query<AnswerRow>(
    "SELECT question_id, chosen_index, seconds_spent FROM quiz_answers WHERE attempt_id = $1 AND user_id = $2",
    [attemptId, userId],
  );
}

export async function finalizeAttempt(
  userId: string,
  attemptId: string,
  correct: number,
  answered: number,
  total: number,
  durationSeconds: number,
): Promise<boolean> {
  const attempt = await getAttempt(userId, attemptId);
  if (!attempt || attempt.finished_at) return false;
  await withTransaction(async (client) => {
    await client.query(
      "UPDATE quiz_attempts SET finished_at = $1, correct = $2, answered = $3, total = $4, duration_seconds = $5 WHERE id = $6 AND user_id = $7",
      [nowIso(), correct, answered, total, durationSeconds, attemptId, userId],
    );
    // Marca precisão por questão para o relatório.
    const { rows } = await client.query<{ question_id: string; chosen_index: number | null }>(
      "SELECT question_id, chosen_index FROM quiz_answers WHERE attempt_id = $1",
      [attemptId],
    );
    const correctMapRows = await client.query<{ question_id: string; correct_index: number }>(
      "SELECT question_id, correct_index FROM quiz_answers qa JOIN questions q ON q.id = qa.question_id WHERE qa.attempt_id = $1",
      [attemptId],
    );
    const correctMap = new Map(correctMapRows.rows.map((r) => [r.question_id, r.correct_index]));
    for (const r of rows) {
      const isCorrect = r.chosen_index !== null && correctMap.get(r.question_id) === r.chosen_index ? 1 : 0;
      await client.query("UPDATE quiz_answers SET is_correct = $1 WHERE attempt_id = $2 AND question_id = $3", [
        isCorrect,
        attemptId,
        r.question_id,
      ]);
    }
  });
  return true;
}

export function listAttempts(userId: string, limit = 50): Promise<(AttemptRow & { title: string; mode: string })[]> {
  return query<AttemptRow & { title: string; mode: string }>(
    `SELECT a.*, q.title, q.mode
       FROM quiz_attempts a JOIN quizzes q ON q.id = a.quiz_id
      WHERE a.user_id = $1 AND a.finished_at IS NOT NULL
      ORDER BY a.finished_at DESC LIMIT $2`,
    [userId, limit],
  );
}
