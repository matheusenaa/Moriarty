import { getDb, nowIso, uid } from "../db";
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

export function createQuestion(
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
): string {
  const id = uid();
  getDb()
    .prepare(
      `INSERT INTO questions (id, user_id, statement, type, options_json, correct_index, explanation, subject_id, difficulty, source_name, origin, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
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
    );
  return id;
}

export function listQuestions(userId: string, subjectId?: string): QuestionRow[] {
  const db = getDb();
  if (subjectId) {
    return db
      .prepare("SELECT * FROM questions WHERE user_id = ? AND subject_id = ? ORDER BY created_at DESC LIMIT 500")
      .all(userId, subjectId) as QuestionRow[];
  }
  return db.prepare("SELECT * FROM questions WHERE user_id = ? ORDER BY created_at DESC LIMIT 500").all(userId) as QuestionRow[];
}

export function getQuestion(userId: string, id: string): QuestionRow | null {
  const db = getDb();
  return (
    (db.prepare("SELECT * FROM questions WHERE id = ? AND user_id = ?").get(id, userId) as QuestionRow) ??
    null
  );
}

export function deleteQuestion(userId: string, id: string): boolean {
  return getDb().prepare("DELETE FROM questions WHERE id = ? AND user_id = ?").run(id, userId).changes > 0;
}

export function countQuestions(userId: string): number {
  return (getDb().prepare("SELECT COUNT(*) c FROM questions WHERE user_id = ?").get(userId) as { c: number }).c;
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

export function createQuiz(
  userId: string,
  data: {
    title: string;
    goalId: string | null;
    mode: "pratica" | "simulado";
    timeLimitSeconds: number;
    shuffle: boolean;
    questionIds: string[];
  },
): string {
  const db = getDb();
  const id = uid();
  db.transaction(() => {
    db.prepare(
      "INSERT INTO quizzes (id, user_id, goal_id, title, mode, time_limit_seconds, shuffle, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(id, userId, data.goalId, data.title, data.mode, data.timeLimitSeconds, data.shuffle ? 1 : 0, nowIso());
    const ins = db.prepare("INSERT INTO quiz_questions (quiz_id, question_id, position) VALUES (?, ?, ?)");
    data.questionIds.forEach((qid, i) => ins.run(id, qid, i));
  })();
  return id;
}

export function getQuiz(userId: string, id: string): QuizRow | null {
  const db = getDb();
  return (db.prepare("SELECT * FROM quizzes WHERE id = ? AND user_id = ?").get(id, userId) as QuizRow) ?? null;
}

export function listQuizzes(userId: string): (QuizRow & { attempts: number; best: number })[] {
  return getDb()
    .prepare(
      `SELECT q.*,
              (SELECT COUNT(*) FROM quiz_attempts a WHERE a.quiz_id = q.id) AS attempts,
              (SELECT MAX(CASE WHEN a.total > 0 THEN a.correct * 100 / a.total ELSE 0 END)
                 FROM quiz_attempts a WHERE a.quiz_id = q.id) AS best
         FROM quizzes q WHERE q.user_id = ? ORDER BY q.created_at DESC LIMIT 100`,
    )
    .all(userId) as (QuizRow & { attempts: number; best: number })[];
}

export function quizQuestionIds(quizId: string, userId: string): string[] {
  const db = getDb();
  const quiz = db.prepare("SELECT user_id FROM quizzes WHERE id = ?").get(quizId) as { user_id: string } | undefined;
  if (!quiz || quiz.user_id !== userId) return [];
  const rows = db
    .prepare("SELECT question_id FROM quiz_questions WHERE quiz_id = ? ORDER BY position")
    .all(quizId) as { question_id: string }[];
  return rows.map((r) => r.question_id);
}

export function deleteQuiz(userId: string, id: string): boolean {
  return getDb().prepare("DELETE FROM quizzes WHERE id = ? AND user_id = ?").run(id, userId).changes > 0;
}

export function startAttempt(userId: string, quizId: string, total: number): string | null {
  const quiz = getQuiz(userId, quizId);
  if (!quiz) return null;
  const id = uid();
  getDb()
    .prepare(
      "INSERT INTO quiz_attempts (id, user_id, quiz_id, started_at, total) VALUES (?, ?, ?, ?, ?)",
    )
    .run(id, userId, quizId, nowIso(), total);
  return id;
}

export function getAttempt(userId: string, id: string): AttemptRow | null {
  const db = getDb();
  return (db.prepare("SELECT * FROM quiz_attempts WHERE id = ? AND user_id = ?").get(id, userId) as AttemptRow) ?? null;
}

export function saveAnswer(
  userId: string,
  attemptId: string,
  questionId: string,
  chosenIndex: number | null,
  secondsSpent: number,
): void {
  const db = getDb();
  const attempt = db.prepare("SELECT user_id FROM quiz_attempts WHERE id = ?").get(attemptId) as
    | { user_id: string }
    | undefined;
  if (!attempt || attempt.user_id !== userId) return;
  db.prepare(
    `INSERT INTO quiz_answers (id, attempt_id, user_id, question_id, chosen_index, is_correct, seconds_spent)
     VALUES (?, ?, ?, ?, ?, 0, ?)
     ON CONFLICT (attempt_id, question_id) DO UPDATE SET chosen_index = excluded.chosen_index, seconds_spent = excluded.seconds_spent`,
  ).run(uid(), attemptId, userId, questionId, chosenIndex, secondsSpent);
}

export type AnswerRow = { question_id: string; chosen_index: number | null; seconds_spent: number };

export function listAnswers(userId: string, attemptId: string): AnswerRow[] {
  return getDb()
    .prepare("SELECT question_id, chosen_index, seconds_spent FROM quiz_answers WHERE attempt_id = ? AND user_id = ?")
    .all(attemptId, userId) as AnswerRow[];
}

export function finalizeAttempt(
  userId: string,
  attemptId: string,
  correct: number,
  answered: number,
  total: number,
  durationSeconds: number,
): boolean {
  const attempt = getAttempt(userId, attemptId);
  if (!attempt || attempt.finished_at) return false;
  const db = getDb();
  db.transaction(() => {
    db.prepare("UPDATE quiz_attempts SET finished_at = ?, correct = ?, answered = ?, total = ?, duration_seconds = ? WHERE id = ? AND user_id = ?").run(
      nowIso(),
      correct,
      answered,
      total,
      durationSeconds,
      attemptId,
      userId,
    );
    // Marca precisão por questão para o relatório.
    const rows = db
      .prepare("SELECT question_id, chosen_index FROM quiz_answers WHERE attempt_id = ?")
      .all(attemptId) as { question_id: string; chosen_index: number | null }[];
    const correctMap = new Map(
      (db.prepare("SELECT question_id, correct_index FROM quiz_answers qa JOIN questions q ON q.id = qa.question_id WHERE qa.attempt_id = ?").all(attemptId) as {
        question_id: string;
        correct_index: number;
      }[]).map((r) => [r.question_id, r.correct_index]),
    );
    for (const r of rows) {
      const isCorrect = r.chosen_index !== null && correctMap.get(r.question_id) === r.chosen_index ? 1 : 0;
      db.prepare("UPDATE quiz_answers SET is_correct = ? WHERE attempt_id = ? AND question_id = ?").run(
        isCorrect,
        attemptId,
        r.question_id,
      );
    }
  })();
  return true;
}

export function listAttempts(userId: string, limit = 50): (AttemptRow & { title: string; mode: string })[] {
  return getDb()
    .prepare(
      `SELECT a.*, q.title, q.mode
         FROM quiz_attempts a JOIN quizzes q ON q.id = a.quiz_id
        WHERE a.user_id = ? AND a.finished_at IS NOT NULL
        ORDER BY a.finished_at DESC LIMIT ?`,
    )
    .all(userId, limit) as (AttemptRow & { title: string; mode: string })[];
}
