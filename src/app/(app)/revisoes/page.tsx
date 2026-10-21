import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listReviews, reviewHistory, reviewQueue, reviewStats } from "@/lib/repo/reviews";
import { listSubjects } from "@/lib/repo/planning";
import { dueLabel } from "@/lib/srs";
import { Card, CardTitle, CardDescription } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/Feedback";
import { ReviewCard } from "@/components/ReviewCard";
import { ManualReviewForm } from "@/components/ManualReviewForm";

export default async function RevisoesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: user.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

  const queue = await reviewQueue(user.id, today);
  const stats = await reviewStats(user.id, today);
  const history = await reviewHistory(user.id, 30);
  const subjects = await listSubjects(user.id);
  const pendingList = (await listReviews(user.id)).filter((r) => r.state !== "concluida");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="font-titulo text-3xl font-bold">Revisões</h1>
        <p className="text-sm text-cinza">
          Método SM-2 simplificado (documentado em <code className="text-latao">src/lib/srs.ts</code>).
          Fila prioriza atrasadas e vencimentos de hoje.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardTitle className="text-base">Atrasadas</CardTitle>
          <p className="font-titulo text-3xl text-alerta-claro">{stats.overdue}</p>
        </Card>
        <Card>
          <CardTitle className="text-base">Vencem hoje</CardTitle>
          <p className="font-titulo text-3xl text-latao">{stats.dueToday}</p>
        </Card>
        <Card>
          <CardTitle className="text-base">Agendadas futuras</CardTitle>
          <p className="font-titulo text-3xl text-pergaminho">{stats.upcoming}</p>
        </Card>
      </div>

      <Card>
        <CardTitle>Fila de hoje e próximos dias</CardTitle>
        {queue.length === 0 ? (
          <EmptyState
            className="mt-3 border-0 shadow-none"
            title="Fila vazia"
            description="Programe revisões ao concluir sessões de estudo ou a partir de materiais na Biblioteca."
          />
        ) : (
          <ul className="mt-3 space-y-3">
            {queue.map((r) => (
              <li key={r.id}>
                <ReviewCard
                  id={r.id}
                  title={r.title}
                  dueLabel={dueLabel(r.due_date, today)}
                  overdue={r.due_date < today}
                  intervalDays={r.interval_days}
                  reps={r.reps}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardTitle>Agendar nova revisão</CardTitle>
        <CardDescription>Para conteúdo que você queira revisar manualmente.</CardDescription>
        <ManualReviewForm subjects={subjects.map((s) => ({ id: s.id, name: s.name }))} today={today} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Todas as pendentes</CardTitle>
          <CardDescription>{pendingList.length} item(ns) no total.</CardDescription>
          <ul className="mt-2 space-y-1 text-sm">
            {pendingList.slice(0, 20).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 border-b border-white/5 py-1.5">
                <span className="truncate">{r.title}</span>
                <Badge tone={r.due_date < today ? "alerta" : "neutro"}>{r.due_date}</Badge>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardTitle>Histórico recente</CardTitle>
          <ul className="mt-2 space-y-1 text-sm">
            {history.length === 0 ? (
              <li className="text-cinza">Nenhuma revisão registrada ainda.</li>
            ) : (
              history.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-2 border-b border-white/5 py-1.5">
                  <span className="truncate">{h.title}</span>
                  <span className="flex items-center gap-2 text-xs text-cinza">
                    <Badge tone={h.result === "nao_lembrei" ? "alerta" : "petroleo"}>{h.result}</Badge>
                    {h.interval_before}d → {h.interval_after}d
                  </span>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
