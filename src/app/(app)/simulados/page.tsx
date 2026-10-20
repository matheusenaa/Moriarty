import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listQuizzes, countQuestions, listAttempts } from "@/lib/repo/quiz";
import { listSubjects } from "@/lib/repo/planning";
import { Card, CardTitle, CardDescription } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/Feedback";
import { QuizBuilder } from "@/components/QuizBuilder";
import { deleteQuizAction } from "@/actions/questions";
import { ConfirmForm } from "@/components/ConfirmForm";
import { accuracyPct } from "@/lib/quiz";

export default async function SimuladosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const quizzes = listQuizzes(user.id);
  const subjects = listSubjects(user.id);
  const attempts = listAttempts(user.id, 10);
  const totalQuestions = countQuestions(user.id);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="font-titulo text-3xl font-bold">Simulados</h1>
        <p className="text-sm text-cinza">Monte listas e simulados a partir do seu banco de questões.</p>
      </header>

      {totalQuestions === 0 ? (
        <EmptyState
          title="Sem questões no banco"
          description="Cadastre questões em Questões antes de montar um simulado."
          action={
            <Link href="/questoes" className="text-sm text-latao underline">
              Ir para Questões
            </Link>
          }
        />
      ) : (
        <Card>
          <CardTitle>Novo simulado</CardTitle>
          <CardDescription>
            Em modo <strong>simulado</strong> o gabarito só aparece ao final. Em modo{" "}
            <strong>prática</strong>, o relatório detalhado fica disponível na conclusão.
          </CardDescription>
          <QuizBuilder subjects={subjects.map((s) => ({ id: s.id, name: s.name }))} totalQuestions={totalQuestions} />
        </Card>
      )}

      <Card>
        <CardTitle>Seus simulados</CardTitle>
        {quizzes.length === 0 ? (
          <CardDescription className="mt-2">Nenhum simulado criado ainda.</CardDescription>
        ) : (
          <ul className="mt-3 space-y-2">
            {quizzes.map((q) => (
              <li key={q.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-white/10 p-3">
                <div>
                  <p className="font-medium text-pergaminho">
                    {q.title} <Badge tone={q.mode === "simulado" ? "latiao" : "petroleo"}>{q.mode}</Badge>
                  </p>
                  <p className="text-xs text-cinza">
                    {q.attempts} tentativa(s) · melhor resultado: {q.attempts > 0 ? `${q.best}%` : "—"}
                    {q.time_limit_seconds > 0 ? ` · limite ${Math.round(q.time_limit_seconds / 60)} min` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <ConfirmForm
                    action={deleteQuizAction}
                    fields={{ id: q.id }}
                    message="Excluir este simulado e suas tentativas?"
                    className="text-xs text-alerta-claro underline"
                  >
                    excluir
                  </ConfirmForm>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardTitle>Tentativas recentes</CardTitle>
        {attempts.length === 0 ? (
          <CardDescription className="mt-2">Nenhuma tentativa finalizada ainda.</CardDescription>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {attempts.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 py-1.5">
                <span>
                  {a.title} · {a.finished_at?.slice(0, 10)}
                </span>
                <span className="flex items-center gap-2">
                  <Badge tone={accuracyPct(a.correct, a.total) >= 70 ? "petroleo" : "alerta"}>
                    {a.correct}/{a.total} ({accuracyPct(a.correct, a.total)}%)
                  </Badge>
                  <Link href={`/simulados/resultado/${a.id}`} className="text-xs text-latao underline">
                    ver resultado
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
