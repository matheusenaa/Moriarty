import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { itemParaQuestao, questoesParaCliente } from "@/lib/catalogQuiz";
import { listItems } from "@/lib/repo/catalog";
import { getAttempt, parseQuestionIds, parseRespostas } from "@/lib/repo/catalogQuiz";
import { CatalogSimulado } from "@/components/CatalogSimulado";

export default async function SimuladoPage({
  params,
}: {
  params: Promise<{ slug: string; attemptId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const { slug, attemptId } = await params;

  const attempt = await getAttempt(user.id, attemptId);
  if (!attempt || attempt.collection_slug !== slug) notFound();
  if (attempt.finished_at) {
    redirect(`/biblioteca/concursos/${slug}/simulado/${attempt.id}/resultado`);
  }

  const ids = parseQuestionIds(attempt.question_ids_json);
  const itens = await listItems(attempt.collection_id, "questao");
  const porId = new Map(itens.map((i) => [i.id, i]));
  const questoes = ids
    .map((id) => porId.get(id))
    .filter((i): i is NonNullable<typeof i> => Boolean(i))
    .map(itemParaQuestao)
    .filter((q): q is NonNullable<typeof q> => q !== null);

  const initialAnswers: Record<string, number> = {};
  for (const r of parseRespostas(attempt.answers_json)) {
    initialAnswers[r.itemId] = r.chosenIndex;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href={`/biblioteca/concursos/${slug}/simulado`} className="text-sm text-latao underline">
          ← Simulado da trilha
        </Link>
        <p className="text-xs text-cinza-escuro">
          O tempo só conta enquanto esta aba estiver aberta e o gabarito fica oculto até o fim.
        </p>
      </div>
      <CatalogSimulado
        attemptId={attempt.id}
        durationMinutes={attempt.duration_minutes}
        questions={questoesParaCliente(questoes)}
        initialAnswers={initialAnswers}
      />
    </div>
  );
}
