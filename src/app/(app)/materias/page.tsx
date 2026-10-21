import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getActiveGoal, listSubjects, listTopics } from "@/lib/repo/planning";
import { Card, CardTitle, CardDescription } from "@/components/Card";
import { SubjectForm } from "@/components/SubjectForm";
import { TopicForm } from "@/components/TopicForm";
import { archiveSubjectAction, deleteTopicAction } from "@/actions/planning";
import { Badge } from "@/components/Badge";

export default async function MateriasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const subjects = await listSubjects(user.id);
  const goal = await getActiveGoal(user.id);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="font-titulo text-3xl font-bold">Matérias</h1>
        <p className="text-sm text-cinza">
          Prioridade e domínio alimentam o planejador e os relatórios de desempenho.
        </p>
      </header>

      <Card>
        <CardTitle>Nova matéria</CardTitle>
        <CardDescription>Prioridade 5 = mais importante. Domínio 0 = nunca estudou; 5 = confortável.</CardDescription>
        <SubjectForm goalId={goal?.id ?? null} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {subjects.length === 0 ? (
          <Card>
            <CardDescription>Nenhuma matéria cadastrada ainda. Comece pelo formulário acima.</CardDescription>
          </Card>
        ) : (
          await Promise.all(
            subjects.map(async (s) => {
              const topics = await listTopics(user.id, s.id);
              return (
              <Card key={s.id}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <span aria-hidden className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.name}
                    </CardTitle>
                    <div className="mt-1 flex gap-2">
                      <Badge tone="latiao">Prioridade {s.priority}/5</Badge>
                      <Badge tone={s.mastery <= 2 ? "alerta" : "petroleo"}>Domínio {s.mastery}/5</Badge>
                    </div>
                  </div>
                  <form action={archiveSubjectAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <button type="submit" className="text-xs text-cinza underline hover:text-pergaminho">
                      arquivar
                    </button>
                  </form>
                </div>

                <div className="mt-3">
                  <p className="mb-1 text-sm font-medium text-pergaminho">Tópicos</p>
                  <ul className="mb-2 space-y-1 text-sm">
                    {topics.length === 0 ? (
                      <li className="text-cinza">Nenhum tópico ainda.</li>
                    ) : (
                      topics.map((t) => (
                        <li key={t.id} className="flex items-center justify-between rounded-md border border-white/10 px-2 py-1">
                          <span>{t.name}</span>
                          <form action={deleteTopicAction}>
                            <input type="hidden" name="id" value={t.id} />
                            <button type="submit" className="text-xs text-alerta-claro hover:underline">
                              remover
                            </button>
                          </form>
                        </li>
                      ))
                    )}
                  </ul>
                  <TopicForm subjectId={s.id} />
                </div>

                <details className="mt-3">
                  <summary className="cursor-pointer text-sm text-cinza hover:text-pergaminho">Editar prioridade/domínio</summary>
                  <div className="mt-2">
                    <SubjectForm goalId={s.goal_id} subject={{ id: s.id, name: s.name, priority: s.priority, mastery: s.mastery, color: s.color }} />
                  </div>
                </details>
              </Card>
              );
            }),
          )
        )}
      </div>
    </div>
  );
}
