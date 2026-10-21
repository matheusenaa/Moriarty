"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  createQuestion,
  createQuiz,
  deleteQuestion,
  deleteQuiz,
  finalizeAttempt,
  getAttempt,
  getQuestion,
  getQuiz,
  listAnswers,
  listQuestions,
  quizQuestionIds,
  saveAnswer,
  startAttempt,
  toQuizQuestion,
} from "@/lib/repo/quiz";
import { shuffleQuiz, gradeQuiz } from "@/lib/quiz";
import { awardXp, checkCountAchievements } from "@/lib/repo/gamification";
import type { ActionState } from "./auth";
export type { ActionState };

const questionSchema = z.object({
  statement: z.string().min(10, "O enunciado precisa ter no mínimo 10 caracteres.").max(5000),
  type: z.enum(["multipla", "certo_errado"]),
  options: z.array(z.string().min(1).max(500)).min(2, "Informe ao menos 2 alternativas.").max(6),
  correctIndex: z.coerce.number().int().min(0),
  explanation: z.string().max(3000).optional().default(""),
  subjectId: z.string().optional().default(""),
  difficulty: z.coerce.number().int().min(1).max(5),
  sourceName: z.string().max(160).optional().default(""),
  origin: z.enum(["autoral", "ia", "importada"]).default("autoral"),
});

export async function saveQuestionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  let options: string[] = [];
  try {
    options = (JSON.parse(String(formData.get("options") ?? "[]")) as unknown[]).map((o) => String(o));
  } catch {
    return { ok: false, error: "Alternativas inválidas." };
  }
  if (String(formData.get("type")) === "certo_errado") {
    options = ["Certo", "Errado"];
  }
  const parsed = questionSchema.safeParse({
    statement: String(formData.get("statement") ?? "").trim(),
    type: String(formData.get("type") ?? "multipla"),
    options,
    correctIndex: formData.get("correctIndex"),
    explanation: String(formData.get("explanation") ?? "").trim(),
    subjectId: String(formData.get("subjectId") ?? ""),
    difficulty: formData.get("difficulty"),
    sourceName: String(formData.get("sourceName") ?? "").trim(),
    origin: String(formData.get("origin") ?? "autoral"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  if (parsed.data.correctIndex >= parsed.data.options.length) {
    return { ok: false, error: "A resposta correta deve corresponder a uma alternativa existente." };
  }
  await createQuestion(user.id, {
    ...parsed.data,
    subjectId: parsed.data.subjectId || null,
  });
  revalidatePath("/questoes");
  return { ok: true, message: "Questão salva." };
}

export async function deleteQuestionAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  await deleteQuestion(user.id, String(formData.get("id") ?? ""));
  revalidatePath("/questoes");
}

const quizSchema = z.object({
  title: z.string().min(2, "Informe o título.").max(120),
  mode: z.enum(["pratica", "simulado"]),
  timeLimitMinutes: z.coerce.number().int().min(0).max(480),
  shuffle: z.coerce.boolean(),
  subjectId: z.string().optional().default(""),
  count: z.coerce.number().int().min(1).max(100),
});

export async function buildQuizAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = quizSchema.safeParse({
    title: String(formData.get("title") ?? "").trim(),
    mode: String(formData.get("mode") ?? "pratica"),
    timeLimitMinutes: formData.get("timeLimitMinutes"),
    shuffle: formData.get("shuffle") === "on" || formData.get("shuffle") === "true",
    subjectId: String(formData.get("subjectId") ?? ""),
    count: formData.get("count"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const pool = await listQuestions(user.id, parsed.data.subjectId || undefined);
  if (pool.length === 0) {
    return { ok: false, error: "Você ainda não tem questões cadastradas para este filtro." };
  }
  const picked = pool.slice(0, parsed.data.count);
  const quizId = await createQuiz(user.id, {
    title: parsed.data.title,
    goalId: null,
    mode: parsed.data.mode,
    timeLimitSeconds: parsed.data.timeLimitMinutes * 60,
    shuffle: parsed.data.shuffle,
    questionIds: picked.map((q) => q.id),
  });
  revalidatePath("/simulados");
  return { ok: true, message: "Simulado criado.", data: { quizId } };
}

export async function deleteQuizAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  await deleteQuiz(user.id, String(formData.get("id") ?? ""));
  revalidatePath("/simulados");
}

export async function startQuizAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const quizId = String(formData.get("id") ?? "");
  const ids = await quizQuestionIds(quizId, user.id);
  if (ids.length === 0) return;
  const attemptId = await startAttempt(user.id, quizId, ids.length);
  revalidatePath("/simulados");
  if (attemptId) {
    const quiz = await getQuiz(user.id, quizId);
    const shuffleFlag = quiz?.shuffle === 1;
    const { redirect } = await import("next/navigation");
    const qs = (await Promise.all(ids.map((id) => getQuestion(user.id, id)))).filter(
      (q): q is NonNullable<typeof q> => q !== null,
    );
    const ordered = shuffleFlag ? shuffleQuiz(qs.map(toQuizQuestion), Date.now()) : qs.map(toQuizQuestion);
    // Persiste a ordem efetiva re-posicionando no quiz.
    const { execute } = await import("@/lib/db");
    for (let i = 0; i < ordered.length; i++) {
      await execute("UPDATE quiz_questions SET position = $1 WHERE quiz_id = $2 AND question_id = $3", [
        i,
        quizId,
        ordered[i].id,
      ]);
    }
    redirect(`/simulados/executar/${attemptId}`);
  }
}

export async function answerQuestionAction(input: {
  attemptId: string;
  questionId: string;
  chosenIndex: number | null;
  secondsSpent: number;
}): Promise<ActionState> {
  const user = await requireUser();
  const attempt = await getAttempt(user.id, input.attemptId);
  if (!attempt) return { ok: false, error: "Tentativa não encontrada." };
  if (attempt.finished_at) return { ok: false, error: "Esta tentativa já foi finalizada." };
  const ids = await quizQuestionIds(attempt.quiz_id, user.id);
  if (!ids.includes(input.questionId)) return { ok: false, error: "Questão fora do simulado." };
  await saveAnswer(user.id, input.attemptId, input.questionId, input.chosenIndex, Math.max(0, Math.min(3600, Math.round(input.secondsSpent))));
  return { ok: true };
}

export async function finishAttemptAction(input: { attemptId: string }): Promise<ActionState> {
  const user = await requireUser();
  const attempt = await getAttempt(user.id, input.attemptId);
  if (!attempt) return { ok: false, error: "Tentativa não encontrada." };
  if (attempt.finished_at) return { ok: false, error: "Tentativa já finalizada." };
  const quiz = await getQuiz(user.id, attempt.quiz_id);
  const ids = await quizQuestionIds(attempt.quiz_id, user.id);
  const questions = (await Promise.all(ids.map((id) => getQuestion(user.id, id)))).filter(
    (q): q is NonNullable<typeof q> => q !== null,
  );
  const answers = (await listAnswers(user.id, attempt.id)).map((a) => ({
    questionId: a.question_id,
    chosenIndex: a.chosen_index,
    secondsSpent: a.seconds_spent,
  }));
  const graded = gradeQuiz(questions.map(toQuizQuestion), answers);
  const answered = answers.filter((a) => a.chosenIndex !== null).length;
  const duration =
    quiz && quiz.time_limit_seconds > 0
      ? quiz.time_limit_seconds
      : Math.round((Date.now() - new Date(attempt.started_at).getTime()) / 1000);
  await finalizeAttempt(user.id, attempt.id, graded.correct, answered, graded.total, Math.max(0, duration));
  const granted = await awardXp(user.id, "simulado_finalizado", "quiz_attempts", attempt.id);
  await checkCountAchievements(user.id);
  revalidatePath("/simulados");
  revalidatePath("/desempenho");
  return {
    ok: true,
    message: `Resultado: ${graded.correct}/${graded.total}.${granted > 0 ? ` +${granted} XP.` : ""}`,
  };
}

export async function attemptReport(userId: string, attemptId: string) {
  const attempt = await getAttempt(userId, attemptId);
  if (!attempt) return null;
  const quiz = await getQuiz(userId, attempt.quiz_id);
  const ids = await quizQuestionIds(attempt.quiz_id, userId);
  const questions = (await Promise.all(ids.map((id) => getQuestion(userId, id)))).filter(
    (q): q is NonNullable<typeof q> => q !== null,
  );
  const answers = await listAnswers(userId, attemptId);
  const graded = gradeQuiz(
    questions.map((q) => ({ id: q.id, correctIndex: q.correct_index, subjectId: q.subject_id })),
    answers.map((a) => ({ questionId: a.question_id, chosenIndex: a.chosen_index, secondsSpent: a.seconds_spent })),
  );
  const answerMap = new Map(answers.map((a) => [a.question_id, a]));
  const questionMap = new Map(questions.map((q) => [q.id, q]));
  return { attempt, quiz, graded, answerMap, questionMap, showAnswers: quiz?.mode === "pratica" || Boolean(attempt.finished_at) };
}
