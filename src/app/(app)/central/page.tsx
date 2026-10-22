import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { addDays, daysBetween, todayStr, minuteToHHMM } from "@/lib/dates";
import { getActiveGoal, listSessions, listSubjects } from "@/lib/repo/planning";
import { reviewQueue, reviewStats } from "@/lib/repo/reviews";
import { dailyMinutes, questionAccuracyBySubject, totals, studyStreak, sessionsByStatus } from "@/lib/repo/stats";
import { gamificationSummary } from "@/lib/repo/gamification";
import { rankForXp, progressToNextRank } from "@/lib/xp";
import { dueLabel } from "@/lib/srs";
import { diasDoLembrete, listReminders } from "@/lib/repo/notifications";
import { descreverLembrete } from "@/lib/lembretes";
import { Card, CardTitle, CardDescription } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState, ProgressBar } from "@/components/Feedback";
import { SessionCompleteForm } from "@/components/SessionCompleteForm";
import { accuracyPct } from "@/lib/quiz";

export default async function CentralPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const today = todayStr(user.timezone);
  const weekAgo = addDays(today, -6);

  const goal = await getActiveGoal(user.id);
  const todaySessions = await listSessions(user.id, today, today);
  const weekTotals = await totals(user.id, weekAgo, today);
  const todayMinutes = (await dailyMinutes(user.id, today, today))[0]?.minutes ?? 0;
  const reviews = await reviewQueue(user.id, today);
  const stats = await reviewStats(user.id, today);
  const accuracy = await questionAccuracyBySubject(user.id);
  const streak = await studyStreak(user.id, today);
  const gamification = user.gamificationEnabled ? await gamificationSummary(user.id, streak) : null;
  const rank = gamification ? rankForXp(gamification.xp) : null;
  const progress = gamification ? progressToNextRank(gamification.xp) : null;
  const subjects = await listSubjects(user.id);
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));
  const statusCount = await sessionsByStatus(user.id, weekAgo, today);
  const daysToExam = goal?.exam_date ? daysBetween(today, goal.exam_date) : null;
  const lembretesAtivos = (await listReminders(user.id)).filter((l) => l.enabled === 1);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="font-titulo text-3xl font-bold">Central de Estudos</h1>
        <p className="text-sm text-cinza">O que precisa de atenção hoje, {today}.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardTitle className="text-base">Estudo de hoje</CardTitle>
          <p className="mt-2 font-titulo text-3xl text-latao">{Math.round(todayMinutes)} min</p>
          <CardDescription>
            Semana: {Math.round(weekTotals.actualMinutes / 6) / 10}h de {Math.round(weekTotals.plannedMinutes / 6) / 10}h planejadas
          </CardDescription>
        </Card>
        <Card>
          <CardTitle className="text-base">Revisões</CardTitle>
          <p className="mt-2 font-titulo text-3xl text-latao">
            {stats.dueToday + stats.overdue}
          </p>
          <CardDescription>
            {stats.overdue} atrasada(s) · {stats.dueToday} vence(m) hoje
          </CardDescription>
        </Card>
        <Card>
          <CardTitle className="text-base">Sequência</CardTitle>
          <p className="mt-2 font-titulo text-3xl text-latao">{streak} dia(s)</p>
          <CardDescription>Dias com sessão concluída ou parcial</CardDescription>
        </Card>
        <Card>
          <CardTitle className="text-base">{goal ? "Próxima prova" : "Objetivo"}</CardTitle>
          {goal ? (
            <>
              <p className="mt-2 font-titulo text-2xl text-latao">
                {daysToExam !== null && daysToExam >= 0 ? `${daysToExam} dia(s)` : goal.exam_date ?? "—"}
              </p>
              <CardDescription>{goal.exam_name || goal.title}</CardDescription>
            </>
          ) : (
            <CardDescription className="mt-2">
              <Link href="/plano" className="underline">
                Cadastre um objetivo em Meu plano
              </Link>
            </CardDescription>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle>Sessões de hoje</CardTitle>
          {todaySessions.length === 0 ? (
            <EmptyState
              className="mt-3 border-0 shadow-none"
              title="Nada planejado para hoje"
              description="Gere um cronograma em Meu plano ou registre uma sessão espontânea por lá."
              action={
                <Link href="/plano" className="text-sm text-latao underline">
                  Ir para Meu plano
                </Link>
              }
            />
          ) : (
            <ul className="mt-3 space-y-3">
              {todaySessions.map((s) => (
                <li key={s.id} className="flex flex-col gap-2 rounded-md border border-white/10 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-pergaminho">
                      {minuteToHHMM(s.start_minute)} · {subjectMap.get(s.subject_id ?? "") ?? "Sessão geral"}
                      {s.kind !== "estudo" ? <Badge tone="petroleo" className="ml-2">{s.kind}</Badge> : null}
                    </p>
                    <p className="text-xs text-cinza">
                      {s.planned_minutes} min planejados
                      {s.status !== "planejada" ? ` · status: ${s.status}` : ""}
                    </p>
                  </div>
                  {s.status === "planejada" ? (
                    <SessionCompleteForm
                      sessionId={s.id}
                      plannedMinutes={s.planned_minutes}
                      subjectName={subjectMap.get(s.subject_id ?? "") ?? ""}
                    />
                  ) : (
                    <Badge tone={s.status === "concluida" ? "petroleo" : "neutro"}>{s.status}</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardTitle className="text-base">Fila de revisão</CardTitle>
            {reviews.length === 0 ? (
              <CardDescription className="mt-2">Nenhuma revisão vencendo nos próximos dias. Bom trabalho.</CardDescription>
            ) : (
              <ul className="mt-2 space-y-2 text-sm">
                {reviews.slice(0, 5).map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2">
                    <span className="truncate text-pergaminho">{r.title}</span>
                    <Badge tone={r.due_date < today ? "alerta" : "latiao"}>{dueLabel(r.due_date, today)}</Badge>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/revisoes" className="mt-3 inline-block text-sm text-latao underline">
              Abrir fila completa
            </Link>
          </Card>

          {gamification && rank && progress ? (
            <Card>
              <CardTitle className="text-base">Progresso</CardTitle>
              <p className="mt-1 text-sm text-cinza">
                {rank.name} · {gamification.xp} XP
              </p>
              <div className="mt-2">
                <ProgressBar pct={progress.pct} label="Próxima patente" />
              </div>
              <p className="mt-2 text-xs text-cinza-escuro">
                {gamification.achievements.filter((a) => a.unlockedAt).length} de {gamification.achievements.length} conquistas
              </p>
            </Card>
          ) : null}

          <Card>
            <CardTitle className="text-base">Seus lembretes</CardTitle>
            {lembretesAtivos.length === 0 ? (
              <CardDescription className="mt-2">
                Nenhum lembrete ativo.{" "}
                <Link href="/perfil" className="underline">
                  Configure no Perfil
                </Link>{" "}
                e o aviso aparece no sino da plataforma no horário escolhido.
              </CardDescription>
            ) : (
              <ul className="mt-2 space-y-1 text-sm text-pergaminho">
                {lembretesAtivos.map((l) => (
                  <li key={l.id}>{descreverLembrete(l.kind, l.time_minute, diasDoLembrete(l.days_json))}</li>
                ))}
                <li className="text-xs text-cinza-escuro">
                  O aviso aparece no sino da plataforma perto do horário definido (não é notificação de
                  navegador).
                </li>
              </ul>
            )}
          </Card>

          <Card>
            <CardTitle className="text-base">Ações rápidas</CardTitle>
            <div className="mt-2 flex flex-col gap-2 text-sm">
              <Link href="/plano" className="rounded-md border border-latao/30 px-3 py-2 hover:bg-latao/10">
                Registrar / planejar estudo
              </Link>
              <Link href="/revisoes" className="rounded-md border border-latao/30 px-3 py-2 hover:bg-latao/10">
                Fazer revisão
              </Link>
              <Link href="/simulados" className="rounded-md border border-latao/30 px-3 py-2 hover:bg-latao/10">
                Abrir simulado
              </Link>
              <Link href="/biblioteca" className="rounded-md border border-latao/30 px-3 py-2 hover:bg-latao/10">
                Adicionar material
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {accuracy.length > 0 ? (
        <Card>
          <CardTitle>Taxa de acerto por matéria</CardTitle>
          <CardDescription>Média sobre questões respondidas em tentativas finalizadas.</CardDescription>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {accuracy.map((a) => (
              <div key={a.subjectId ?? a.name} className="rounded-md border border-white/10 p-3">
                <p className="text-sm font-medium text-pergaminho">{a.name}</p>
                <p className="font-titulo text-2xl text-latao">{accuracyPct(a.correct, a.total)}%</p>
                <p className="text-xs text-cinza">
                  {a.correct}/{a.total} acertos
                </p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {Object.keys(statusCount).length > 0 ? (
        <p className="text-xs text-cinza-escuro">
          Últimos 7 dias: {Object.entries(statusCount).map(([k, v]) => `${v} ${k}`).join(" · ")}
        </p>
      ) : null}
    </div>
  );
}
