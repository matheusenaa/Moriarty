import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { itemParaQuestao, simularResultado } from "@/lib/catalogQuiz";
import { listItems } from "@/lib/repo/catalog";
import { getAttempt, parseQuestionIds, parseRespostas } from "@/lib/repo/catalogQuiz";
import { Card, CardTitle, CardDescription } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { finishCatalogQuizAction } from "@/actions/catalogQuiz";

function duracaoDe(inicio: string, fim: string | null): string {
  if (!fim) return "—";
  const t1 = Date.parse(inicio);
  const t2 = Date.parse(fim);
  if (Number.isNaN(t1) || Number.isNaN(t2)) return "—";
  const segundos = Math.max(0, Math.round((t2 - t1) / 1000));
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}min ${String(s).padStart(2, "0")}s`;
}

export default async function SimuladoResultadoPage({
  params,
}: {
  params: Promise<{ slug: string; attemptId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const { slug, attemptId } = await params;

  const attempt = await getAttempt(user.id, attemptId);
  if (!attempt || attempt.collection_slug !== slug) notFound();

  const ids = parseQuestionIds(attempt.question_ids_json);
  const itens = await listItems(attempt.collection_id, "questao");
  const porId = new Map(itens.map((i) => [i.id, i]));
  const questoes = ids
    .map((id) => porId.get(id))
    .filter((i): i is NonNullable<typeof i> => Boolean(i))
    .map(itemParaQuestao)
    .filter((q): q is NonNullable<typeof q> => q !== null);

  const respostas = parseRespostas(attempt.answers_json);
  const resultado = simularResultado(
    questoes,
    respostas.map((r) => ({ itemId: r.itemId, chosenIndex: r.chosenIndex })),
  );

  const situacao =
    resultado.pct >= 80 ? "petroleo" : resultado.pct >= 60 ? "latiao" : "alerta";

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href={`/biblioteca/concursos/${slug}`} className="text-sm text-latao underline">
        ← Voltar para a trilha
      </Link>

      <Card>
        <CardTitle>Resultado do simulado</CardTitle>
        <CardDescription>
          {resultado.answered} de {resultado.total} questões respondidas · tempo{" "}
          {duracaoDe(attempt.started_at, attempt.finished_at)}
        </CardDescription>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="font-titulo text-4xl font-bold text-pergaminho">{resultado.pct}%</span>
          <Badge tone={situacao}>
            {resultado.correct} de {resultado.total} acertos
          </Badge>
          {attempt.finished_at ? null : (
            <form action={finishCatalogQuizAction}>
              <input type="hidden" name="attemptId" value={attempt.id} />
              <button
                type="submit"
                className="rounded-md border border-latao/50 bg-latao/10 px-3 py-1.5 text-sm text-latao"
              >
                Finalizar agora
              </button>
            </form>
          )}
        </div>
      </Card>

      <ol className="space-y-3">
        {resultado.detalhes.map((d, index) => (
          <li key={d.itemId} className="rounded-md border border-white/10 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-pergaminho">Questão {index + 1}</p>
              <Badge tone={d.correct ? "petroleo" : "alerta"}>
                {d.correct ? "acertou" : "errou"}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-pergaminho/90">{d.statement}</p>
            <ul className="mt-2 space-y-1 text-sm">
              {d.options.map((opt, i) => {
                const isChosen = d.chosenIndex === i;
                const isGabarito = d.correctIndex === i;
                return (
                  <li
                    key={i}
                    className={`rounded-md border px-3 py-1.5 ${
                      isGabarito
                        ? "border-petroleo/60 bg-petroleo/10 text-pergaminho"
                        : isChosen
                          ? "border-alerta/50 bg-alerta/10 text-pergaminho"
                          : "border-white/10 text-cinza"
                    }`}
                  >
                    <span className="mr-2 font-medium">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                    {isGabarito ? <span className="ml-2 text-xs">gabarito</span> : null}
                    {isChosen && !isGabarito ? <span className="ml-2 text-xs">sua resposta</span> : null}
                  </li>
                );
              })}
            </ul>
            {d.explanation ? (
              <div className="mt-2 rounded-md border border-white/10 bg-carvao/40 p-3 text-sm text-cinza">
                <p className="mb-1 font-medium text-pergaminho">Explicação</p>
                {d.explanation}
              </div>
            ) : null}
            <p className="mt-2 text-xs text-cinza-escuro">{d.originNote}</p>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href={`/biblioteca/concursos/${slug}/simulado`} className="text-latao underline">
          fazer outro simulado
        </Link>
        <Link href="/desempenho" className="text-cinza underline hover:text-pergaminho">
          ver meu desempenho
        </Link>
      </div>
    </div>
  );
}
