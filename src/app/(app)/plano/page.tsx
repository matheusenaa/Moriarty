import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { addDays, todayStr, weekStart, minuteToHHMM } from "@/lib/dates";
import {
  getActiveGoal,
  listAvailability,
  listSessions,
  listSubjects,
  listUnavailableDates,
} from "@/lib/repo/planning";
import { Card, CardTitle, CardDescription } from "@/components/Card";
import { GoalForm } from "@/components/GoalForm";
import { AvailabilityEditor } from "@/components/AvailabilityEditor";
import { PlanGenerator } from "@/components/PlanGenerator";
import { SessionCompleteForm } from "@/components/SessionCompleteForm";
import { deleteSessionAction } from "@/actions/planning";
import { Badge } from "@/components/Badge";

export default async function PlanoPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const today = todayStr(user.timezone);
  const goal = await getActiveGoal(user.id);
  const subjects = await listSubjects(user.id);
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));
  const weekFrom = weekStart(today);
  const weekTo = addDays(weekFrom, 6);
  const sessions = await listSessions(user.id, weekFrom, addDays(today, 14));
  const availability = (await listAvailability(user.id)).map((a) => ({
    weekday: a.weekday,
    startMinute: a.start_minute,
    endMinute: a.end_minute,
  }));
  const unavailable = await listUnavailableDates(user.id);

  const byDay = new Map<string, typeof sessions>();
  for (const s of sessions) {
    const list = byDay.get(s.date) ?? [];
    list.push(s);
    byDay.set(s.date, list);
  }
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="font-titulo text-3xl font-bold">Meu plano</h1>
        <p className="text-sm text-cinza">
          Objetivo, disponibilidade e cronograma. Sessões concluídas nunca são apagadas pelo
          replanejamento.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Objetivo de estudo</CardTitle>
          <CardDescription>Define a data da prova, a carga semanal e a duração das sessões.</CardDescription>
          <GoalForm goal={goal} />
        </Card>
        <Card>
          <CardTitle>Disponibilidade semanal</CardTitle>
          <CardDescription>Horários em que você consegue estudar e dias explicitamente indisponíveis.</CardDescription>
          <AvailabilityEditor initialSlots={availability} unavailableDates={unavailable} />
        </Card>
      </div>

      <Card>
        <CardTitle>Gerar cronograma</CardTitle>
        <CardDescription>
          Algoritmo local determinístico. A IA (se configurada pelo servidor) é opcional e o
          resultado é validado antes de salvar.
        </CardDescription>
        <PlanGenerator
          subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
          hasGoal={Boolean(goal)}
          hasAvailability={availability.length > 0}
        />
      </Card>

      <Card>
        <CardTitle>Próximas duas semanas</CardTitle>
        {sessions.length === 0 ? (
          <CardDescription className="mt-2">
            Nenhuma sessão planejada ainda. Gere o cronograma acima ou adicione uma sessão manual.
          </CardDescription>
        ) : (
          <div className="mt-3 space-y-4">
            {days.map((day) => {
              const list = byDay.get(day);
              if (!list || list.length === 0) return null;
              return (
                <section key={day}>
                  <h4 className="mb-1 text-sm font-semibold text-latao">
                    {day}
                    {day === today ? " (hoje)" : ""}
                    {day >= weekFrom && day <= weekTo ? " · semana atual" : ""}
                  </h4>
                  <ul className="space-y-2">
                    {list.map((s) => (
                      <li key={s.id} className="flex flex-col gap-2 rounded-md border border-white/10 p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-pergaminho">
                            {minuteToHHMM(s.start_minute)}–{minuteToHHMM(s.start_minute + s.planned_minutes)} ·{" "}
                            {subjectMap.get(s.subject_id ?? "") ?? "Geral"}{" "}
                            <Badge tone={s.kind === "estudo" ? "neutro" : "petroleo"}>{s.kind}</Badge>
                          </p>
                          {s.notes ? <p className="mt-0.5 line-clamp-2 text-xs text-cinza">{s.notes}</p> : null}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {s.status === "planejada" ? (
                            <SessionCompleteForm
                              sessionId={s.id}
                              plannedMinutes={s.planned_minutes}
                              subjectName={subjectMap.get(s.subject_id ?? "") ?? ""}
                            />
                          ) : (
                            <Badge tone={s.status === "concluida" ? "petroleo" : "neutro"}>{s.status}</Badge>
                          )}
                          <form action={deleteSessionAction}>
                            <input type="hidden" name="id" value={s.id} />
                            <button
                              type="submit"
                              className="text-xs text-alerta-claro hover:underline"
                              disabled={s.status === "concluida"}
                              title={s.status === "concluida" ? "Sessões concluídas não são apagadas" : "Remover sessão"}
                            >
                              remover
                            </button>
                          </form>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </Card>

      <p className="text-sm text-cinza">
        Dúvidas sobre matérias? Ajuste prioridade e domínio em{" "}
        <Link href="/materias" className="text-latao underline">
          Matérias
        </Link>
        .
      </p>
    </div>
  );
}
