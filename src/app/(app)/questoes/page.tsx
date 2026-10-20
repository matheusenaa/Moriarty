import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listQuestions, countQuestions } from "@/lib/repo/quiz";
import { listSubjects } from "@/lib/repo/planning";
import { Card, CardTitle, CardDescription } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/Feedback";
import { QuestionForm } from "@/components/QuestionForm";
import { deleteQuestionAction } from "@/actions/questions";
import { ConfirmForm } from "@/components/ConfirmForm";

export default async function QuestoesPage({
  searchParams,
}: {
  searchParams: Promise<{ materia?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const params = await searchParams;
  const subjects = listSubjects(user.id);
  const questions = listQuestions(user.id, params.materia || undefined);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="font-titulo text-3xl font-bold">Questões</h1>
        <p className="text-sm text-cinza">
          Banco pessoal de questões autorais. Nunca apresentamos questões como “oficiais” sem
          fonte verificada — identifique a origem ao cadastrar.
        </p>
      </header>

      <Card>
        <CardTitle>Nova questão</CardTitle>
        <CardDescription>Múltipla escolha ou certo/errado. Discursivas ficam para etapa futura.</CardDescription>
        <QuestionForm subjects={subjects.map((s) => ({ id: s.id, name: s.name }))} />
      </Card>

      <Card>
        <CardTitle>Suas questões ({countQuestions(user.id)})</CardTitle>
        <form className="mt-2" method="get">
          <label htmlFor="materia" className="mb-1 block text-xs text-cinza">
            Filtrar por matéria
          </label>
          <select
            id="materia"
            name="materia"
            defaultValue={params.materia ?? ""}
            className="rounded-md border border-latao/20 bg-carvao/70 px-3 py-2 text-sm"
          >
            <option value="">Todas</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </form>

        {questions.length === 0 ? (
          <EmptyState
            className="mt-4 border-0 shadow-none"
            title="Nenhuma questão ainda"
            description="Cadastre questões a partir do que você erra ou revisa. Elas alimentam listas e simulados."
          />
        ) : (
          <ul className="mt-4 space-y-3">
            {questions.map((q) => {
              const options = JSON.parse(q.options_json) as string[];
              const subject = subjects.find((s) => s.id === q.subject_id);
              return (
                <li key={q.id} className="rounded-md border border-white/10 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="neutro">{subject?.name ?? "Sem matéria"}</Badge>
                    <Badge tone="latiao">dificuldade {q.difficulty}/5</Badge>
                    <Badge tone={q.origin === "autoral" ? "petroleo" : "latiao"}>
                      {q.origin === "ia" ? "gerada por IA" : q.origin}
                    </Badge>
                    {q.source_name ? <Badge tone="neutro">fonte: {q.source_name}</Badge> : null}
                  </div>
                  <p className="mt-2 text-sm text-pergaminho">{q.statement}</p>
                  <ol className="mt-1 list-inside list-decimal text-sm text-cinza">
                    {options.map((o, i) => (
                      <li key={i} className={i === q.correct_index ? "text-petroleo-claro" : undefined}>
                        {o} {i === q.correct_index ? "✓" : ""}
                      </li>
                    ))}
                  </ol>
                  <div className="mt-2">
                    <ConfirmForm
                      action={deleteQuestionAction}
                      fields={{ id: q.id }}
                      message="Excluir esta questão?"
                      className="text-xs text-alerta-claro underline"
                    >
                      excluir
                    </ConfirmForm>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
