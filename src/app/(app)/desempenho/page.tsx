import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { addDays, todayStr } from "@/lib/dates";
import {
  attemptTrend,
  dailyMinutes,
  questionAccuracyBySubject,
  reviewSummary,
  sessionsByStatus,
  subjectMastery,
  studyStreak,
  totals,
} from "@/lib/repo/stats";
import { listSubjects } from "@/lib/repo/planning";
import { Card, CardTitle, CardDescription } from "@/components/Card";
import { EmptyState } from "@/components/Feedback";
import { StudyChart } from "@/components/StudyChart";

export default async function DesempenhoPage({
  searchParams,
}: {
  searchParams: Promise<{ dias?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const params = await searchParams;
  const days = Math.min(180, Math.max(7, Number(params.dias) || 30));
  const today = todayStr(user.timezone);
  const from = addDays(today, -(days - 1));

  const minutes = await dailyMinutes(user.id, from, today);
  const period = await totals(user.id, from, today);
  const accuracy = await questionAccuracyBySubject(user.id);
  const trend = await attemptTrend(user.id);
  const reviews = await reviewSummary(user.id, today);
  const streak = await studyStreak(user.id, today);
  const mastery = await subjectMastery(user.id);
  const status = await sessionsByStatus(user.id, from, today);
  const subjects = await listSubjects(user.id);
  const nameOf = (id: string | null) => subjects.find((s) => s.id === id)?.name ?? "Sem matéria";

  const hasData =
    minutes.some((d) => d.minutes > 0) || accuracy.some((a) => a.total > 0) || trend.length > 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="font-titulo text-3xl font-bold">Desempenho</h1>
        <p className="text-sm text-cinza">
          Dados estritamente privados, gerados apenas dos seus registros. Sem métricas artificiais.
        </p>
      </header>

      <Card>
        <form className="flex flex-wrap items-center gap-3" method="get">
          <label htmlFor="dias" className="text-sm text-cinza">
            Período
          </label>
          <select
            id="dias"
            name="dias"
            defaultValue={String(days)}
            className="rounded-md border border-latao/20 bg-carvao/70 px-3 py-2 text-sm"
          >
            <option value="7">7 dias</option>
            <option value="30">30 dias</option>
            <option value="90">90 dias</option>
            <option value="180">180 dias</option>
          </select>
          <button type="submit" className="rounded-md border border-latao/40 px-3 py-2 text-sm hover:bg-latao/10">
            Aplicar
          </button>
        </form>
      </Card>

      {!hasData ? (
        <EmptyState
          title="Ainda sem dados suficientes"
          description="Registre sessões de estudo, responda questões e faça simulados para que os gráficos apareçam aqui."
        />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardTitle className="text-base">Horas no período</CardTitle>
          <p className="font-titulo text-3xl text-latao">{(period.actualMinutes / 60).toFixed(1)}h</p>
          <CardDescription>Planejado: {(period.plannedMinutes / 60).toFixed(1)}h</CardDescription>
        </Card>
        <Card>
          <CardTitle className="text-base">Sessões concluídas</CardTitle>
          <p className="font-titulo text-3xl text-pergaminho">{status["concluida"] ?? 0}</p>
          <CardDescription>Parciais: {status["parcial"] ?? 0} · Adiadas: {status["adiada"] ?? 0}</CardDescription>
        </Card>
        <Card>
          <CardTitle className="text-base">Revisões (30 dias)</CardTitle>
          <p className="font-titulo text-3xl text-pergaminho">{reviews.done30}</p>
          <CardDescription>
            {reviews.overdue} atrasada(s) · {reviews.dueToday} hoje
          </CardDescription>
        </Card>
        <Card>
          <CardTitle className="text-base">Sequência atual</CardTitle>
          <p className="font-titulo text-3xl text-petroleo-claro">{streak} dia(s)</p>
          <CardDescription>Dias consecutivos com estudo registrado</CardDescription>
        </Card>
      </div>

      {minutes.some((d) => d.minutes > 0 || d.planned > 0) ? (
        <Card>
          <CardTitle>Planejado × realizado</CardTitle>
          <CardDescription>Minutos por dia no período selecionado.</CardDescription>
          <StudyChart
            kind="minutes"
            data={minutes.map((d) => ({
              label: d.date.slice(5),
              planned: d.planned,
              value: d.minutes,
            }))}
          />
        </Card>
      ) : null}

      {accuracy.some((a) => a.total > 0) ? (
        <Card>
          <CardTitle>Acertos por matéria</CardTitle>
          <CardDescription>Todas as tentativas finalizadas até hoje.</CardDescription>
          <StudyChart
            kind="accuracy"
            data={accuracy
              .filter((a) => a.total > 0)
              .map((a) => ({
                label: nameOf(a.subjectId),
                value: a.total === 0 ? 0 : Math.round((a.correct / a.total) * 100),
                detail: `${a.correct}/${a.total}`,
              }))}
          />
        </Card>
      ) : null}

      {trend.length > 0 ? (
        <Card>
          <CardTitle>Evolução em simulados</CardTitle>
          <CardDescription>Percentual de acerto por tentativa finalizada (ordem cronológica).</CardDescription>
          <StudyChart
            kind="trend"
            data={trend.map((t, i) => ({ label: `${t.date.slice(5)} (${i + 1})`, value: t.accuracy, detail: t.title }))}
          />
        </Card>
      ) : null}

      {mastery.length > 0 ? (
        <Card>
          <CardTitle>Matérias que pedem atenção</CardTitle>
          <CardDescription>
            Critério explícito: domínio autodeclarado mais baixo primeiro (0 = nunca estudou, 5 =
            confortável). Complemente com a taxa de acerto acima.
          </CardDescription>
          <ul className="mt-3 space-y-2">
            {mastery.slice(0, 8).map((m) => (
              <li key={m.name} className="flex items-center justify-between text-sm">
                <span>
                  {m.name} <span className="text-cinza">· prioridade {m.priority}/5</span>
                </span>
                <span className="font-titulo text-lg text-latao">{m.mastery}/5</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
