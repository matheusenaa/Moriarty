import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCollectionBySlug, listItems } from "@/lib/repo/catalog";
import { Card, CardTitle, CardDescription } from "@/components/Card";
import { startCatalogQuizAction } from "@/actions/catalogQuiz";

const QUANTIDADES = [5, 10, 20];
const DURACOES = [10, 20, 30, 45];

export default async function SimuladoSetupPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  const itens = await listItems(collection.id, "questao");
  const total = itens.length;
  const quantidades = QUANTIDADES.filter((q) => q <= total);
  if (quantidades.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Link href={`/biblioteca/concursos/${collection.slug}`} className="text-sm text-latao underline">
          ← {collection.title}
        </Link>
        <Card>
          <CardTitle>Sem questões disponíveis</CardTitle>
          <CardDescription>
            Esta trilha ainda não tem questões de treino cadastradas, então não há simulado para
            montar.
          </CardDescription>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href={`/biblioteca/concursos/${collection.slug}`} className="text-sm text-latao underline">
        ← {collection.title}
      </Link>
      <h1 className="font-titulo text-2xl font-bold">Simulado da trilha</h1>

      <Card>
        <CardTitle>Montar simulado</CardTitle>
        <CardDescription>
          As questões são sorteadas do banco autoral da trilha. O gabarito só é conferido no
          servidor e o resultado sai com o tempo usado e a explicação de cada item.
        </CardDescription>
        <form action={startCatalogQuizAction} className="mt-4 space-y-4">
          <input type="hidden" name="slug" value={collection.slug} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-cinza">Quantidade de questões</span>
              <select
                name="quantidade"
                defaultValue={String(quantidades.includes(10) ? 10 : quantidades[0])}
                className="w-full rounded-md border border-white/10 bg-carvao px-3 py-2 text-pergaminho"
              >
                {quantidades.map((q) => (
                  <option key={q} value={q}>
                    {q} questões
                  </option>
                ))}
                {total > 20 ? (
                  <option value={String(total)}>{total} questões (tudo)</option>
                ) : null}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-cinza">Tempo limite</span>
              <select
                name="duracao"
                defaultValue="20"
                className="w-full rounded-md border border-white/10 bg-carvao px-3 py-2 text-pergaminho"
              >
                {DURACOES.map((d) => (
                  <option key={d} value={d}>
                    {d} minutos
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="text-xs text-cinza-escuro">
            Esta trilha tem {total} questões autorais disponíveis. As questões são autorais do
            Moriarty — não são questões oficiais de banca.
          </p>
          <button
            type="submit"
            className="rounded-md border border-latao/50 bg-latao/10 px-4 py-2 text-sm font-medium text-latao hover:bg-latao/20"
          >
            Começar simulado
          </button>
        </form>
      </Card>
    </div>
  );
}
