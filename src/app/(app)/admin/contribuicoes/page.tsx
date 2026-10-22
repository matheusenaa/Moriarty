import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ehAdmin } from "@/lib/admin";
import { listPendingContributions, reviewContribution } from "@/lib/repo/contributions";
import { getCollectionBySlug } from "@/lib/repo/catalog";
import { Card, CardTitle, CardDescription } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Textarea } from "@/components/FormControls";
import { reviewContributionAction } from "@/actions/contributions";

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
};

const STATUS_TONE: Record<string, "petroleo" | "latiao" | "alerta" | "neutro"> = {
  pendente: "latiao",
  aprovado: "petroleo",
  rejeitado: "alerta",
};

const KIND_LABEL: Record<string, string> = {
  nota: "Nota",
  questao: "Questão",
  flashcard: "Flashcard",
};

export default async function AdminContribuicoesPage() {
  const user = await getCurrentUser();
  if (!user || !ehAdmin(user.email)) redirect("/central");

  const pendentes = await listPendingContributions(200);

  // Enriquece com o título da trilha
  const enriquecidas = await Promise.all(
    pendentes.map(async (c) => {
      const col = await getCollectionBySlug(c.collection_slug);
      return { ...c, collectionTitle: col?.title ?? c.collection_slug };
    }),
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/admin" className="text-sm text-latao underline">
          ← Administração
        </Link>
        <h1 className="font-titulo text-2xl font-bold">Moderação de contribuições</h1>
      </div>

      <Card>
        <CardTitle>Fila de análise</CardTitle>
        <CardDescription>
          {enriquecidas.length} sugestão{enriquecidas.length !== 1 ? "ões" : ""} aguardando revisão.
          Ao aprovar, o item entra no catálogo da trilha com a autoria do aluno.
        </CardDescription>

        {enriquecidas.length === 0 ? (
          <p className="mt-4 text-sm text-cinza">Nenhuma sugestão pendente. Ótimo trabalho!</p>
        ) : (
          <ul className="mt-4 divide-y divide-white/5">
            {enriquecidas.map((c) => (
              <li key={c.id} className="py-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-pergaminho">{c.title}</p>
                    <p className="text-xs text-cinza">
                      Trilha: {c.collectionTitle} · Tipo: {KIND_LABEL[c.kind]} ·
                      Autor: {c.user_id} · {new Date(c.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <Badge tone={STATUS_TONE.pendente}>Pendente</Badge>
                </div>

                <div className="rounded-md border border-white/10 bg-carvao/40 p-3 text-sm space-y-2">
                  <div>
                    <span className="font-medium text-pergaminho">Conteúdo:</span>
                    <pre className="mt-1 whitespace-pre-wrap text-cinza">{c.body}</pre>
                  </div>
                  {c.kind === "questao" && c.options_json && (
                    <div>
                      <span className="font-medium text-pergaminho">Alternativas:</span>
                      <ul className="mt-1 ml-4 list-disc space-y-0.5 text-cinza">
                        {JSON.parse(c.options_json).map((opt: string, i: number) => (
                          <li key={i}>
                            {opt} {i === c.correct_index ? <strong className="text-petroleo">← gabarito</strong> : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {c.explanation && (
                    <div>
                      <span className="font-medium text-pergaminho">Explicação:</span>
                      <p className="mt-1 text-cinza">{c.explanation}</p>
                    </div>
                  )}
                  {c.source_url && (
                    <div className="text-xs">
                      <span className="font-medium text-pergaminho">Fonte:</span>{" "}
                      <a href={c.source_url} target="_blank" rel="noopener noreferrer" className="text-latao underline">
                        {c.source_label || c.source_url}
                      </a>
                    </div>
                  )}
                </div>

                <form action={reviewContributionAction} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={c.id} />
                  <Textarea
                    name="note"
                    placeholder="Nota para o autor (opcional — ex.: por que aprovou/rejeitou)"
                    rows={2}
                    className="flex-1 min-w-[200px]"
                  />
                  <button
                    type="submit"
                    name="decision"
                    value="aprovado"
                    className="rounded-md border border-petroleo/50 bg-petroleo/10 px-3 py-1.5 text-sm text-petroleo hover:bg-petroleo/20"
                  >
                    Aprovar
                  </button>
                  <button
                    type="submit"
                    name="decision"
                    value="rejeitado"
                    className="rounded-md border border-alerta/50 bg-alerta/10 px-3 py-1.5 text-sm text-alerta hover:bg-alerta/20"
                  >
                    Rejeitar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}