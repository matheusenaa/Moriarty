import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getAttempt, getQuiz, getQuestion, quizQuestionIds } from "@/lib/repo/quiz";
import { QuizRunner } from "@/components/QuizRunner";

export default async function ExecutarSimuladoPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const { attemptId } = await params;
  const attempt = getAttempt(user.id, attemptId);
  if (!attempt) notFound();
  if (attempt.finished_at) redirect(`/simulados/resultado/${attemptId}`);
  const quiz = getQuiz(user.id, attempt.quiz_id);
  if (!quiz) notFound();

  const ids = quizQuestionIds(quiz.id, user.id);
  const questions = ids
    .map((id) => getQuestion(user.id, id))
    .filter((q): q is NonNullable<typeof q> => q !== null)
    .map((q) => ({
      id: q.id,
      statement: q.statement,
      type: q.type,
      options: JSON.parse(q.options_json) as string[],
      subjectId: q.subject_id,
    }));

  return (
    <div className="mx-auto max-w-3xl">
      <QuizRunner
        attemptId={attempt.id}
        quizId={quiz.id}
        title={quiz.title}
        mode={quiz.mode}
        timeLimitSeconds={quiz.time_limit_seconds}
        questions={questions}
        startedAt={attempt.started_at}
      />
    </div>
  );
}
