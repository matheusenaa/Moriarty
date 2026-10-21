import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { attemptReport } from "@/actions/questions";
import { listSubjects } from "@/lib/repo/planning";
import { Card, CardTitle, CardDescription } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { ProgressBar } from "@/components/Feedback";
import { accuracyPct } from "@/lib/quiz";

export default async function ResultadoSimuladoPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const { attemptId } = await params;
  const report = await attemptReport(user.id, attemptId);
  if (!report || !report.attempt.finished_at) notFound();

  const subjects = await listSubjects(user.id);
  const subjectName = (id: string | null) => subjects.find((s) => s.id === id)?.name ?? "Sem matéria";
  const pct = accuracyPct(report.graded.correct, report.graded.total);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-latao">Resultado</p>
        <h1 className="font-titulo text-3xl font-bold">{report.quiz?.title ?? "Simulado"}</h1>
        <p className="text-sm text-cinza">
          {report.attempt.finished_at?.slice(0, 10)} · {report.attempt.correct}/{report.attempt.total} corretas ·{" "}
          {report.attempt.duration_seconds}s
        </p>
      </header>

      <Card>
        <CardTitle>Pontuação geral</CardTitle>
        <p className="mt-2 font-titulo text-5xl text-latao">{pct}%</p>
        <div className="mt-3">
          <ProgressBar pct={pct} label="Acertos" />
        </div>
      </Card>

      {report.graded.weakSubjects.length > 0 ? (
        <Card>
          <CardTitle className="text-base">Pontos de atenção</CardTitle>
          <CardDescription>Matérias com menos de 70% de acerto nesta tentativa.</CardDescription>
          <ul className="mt-2 space-y-1 text-sm">
            {report.graded.weakSubjects.map((w) => (
              <li key={w.subjectId} className="flex items-center justify-between">
                <span>{subjectName(w.subjectId === "sem-materia" ? null : w.subjectId)}</span>
                <Badge tone="alerta">
                  {w.correct}/{w.total} ({Math.round(w.accuracy * 100)}%)
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card>
        <CardTitle>Questões</CardTitle>
        <ul className="mt-3 space-y-4">
          {report.graded.perQuestion.map((p, i) => {
            const q = report.questionMap.get(p.questionId);
            const options = q ? (JSON.parse(q.options_json) as string[]) : [];
            const chosen = p.chosenIndex;
            return (
              <li key={p.questionId} className="rounded-md border border-white/10 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-pergaminho">
                    {i + 1}. {q?.statement ?? "Questão removida"}
                  </p>
                  <Badge tone={p.correct ? "petroleo" : "alerta"}>{p.correct ? "correta" : "incorreta"}</Badge>
                </div>
                <ol className="mt-2 space-y-1 text-sm">
                  {options.map((o, oi) => (
                    <li
                      key={oi}
                      className={
                        oi === p.correctIndex
                          ? "text-petroleo-claro"
                          : oi === chosen
                            ? "text-alerta-claro"
                            : "text-cinza"
                      }
                    >
                      {String.fromCharCode(65 + oi)}) {o}
                      {oi === p.correctIndex ? " ← gabarito" : ""}
                      {oi === chosen && oi !== p.correctIndex ? " ← sua resposta" : ""}
                    </li>
                  ))}
                </ol>
                {q?.explanation ? <p className="mt-2 text-xs text-cinza">{q.explanation}</p> : null}
                {q?.subject_id ? (
                  <p className="mt-1 text-xs text-cinza-escuro">Matéria: {subjectName(q.subject_id)}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="flex gap-3">
        <Link href="/simulados" className="rounded-md border border-latao/40 px-3 py-2 text-sm hover:bg-latao/10">
          Voltar aos simulados
        </Link>
        <Link href="/questoes" className="rounded-md border border-latao/40 px-3 py-2 text-sm hover:bg-latao/10">
          Revisar banco de questões
        </Link>
      </div>
    </div>
  );
}
