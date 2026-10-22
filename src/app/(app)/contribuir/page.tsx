import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getMyContributionsAction } from "@/actions/contributions";
import { Card, CardTitle, CardDescription } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { ContributionForm } from "@/components/ContributionForm";

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

export default async function ContribuirPage({ searchParams }: { searchParams: Promise<{ trilha?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");

  const { trilha } = await searchParams;
  const { data: contribuicoes } = await getMyContributionsAction();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="font-titulo text-2xl font-bold">Contribuir com conteúdo</h1>
      <p className="text-sm text-cinza">
        Sugira notas, questões ou flashcards para as trilhas. Tudo passa por moderação de
        administradores antes de entrar no catálogo. A autoria fica registrada e o conteúdo
        <strong>nunca</strong> é apresentado como questão oficial.
      </p>

      <Card>
        <CardTitle>Nova sugestão</CardTitle>
        <CardDescription>
          Escolha a trilha, o tipo de conteúdo e preencha os campos. Questões precisam de
          alternativas, gabarito e explicação. Flashcards usam o formato &ldquo;Frente: ... Verso: ...&rdquo;.
        </CardDescription>
        <ContributionForm defaultCollectionSlug={trilha} />
      </Card>

      <Card>
        <CardTitle>Minhas sugestões</CardTitle>
        <CardDescription>
          Acompanhe o status das suas contribuições.
        </CardDescription>
        {contribuicoes && contribuicoes.length > 0 ? (
          <ul className="mt-4 divide-y divide-white/5">
            {contribuicoes.map((c) => (
              <li key={c.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <p className="font-medium text-pergaminho">{c.title}</p>
                  <p className="text-xs text-cinza">
                    {c.collection_slug} &middot; {c.kind} &middot; {new Date(c.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                  {c.status === "rejeitado" && c.review_note && (
                    <span className="text-xs text-cinza-escuro">{c.review_note}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-cinza">Você ainda não enviou nenhuma sugestão.</p>
        )}
      </Card>
    </div>
  );
}