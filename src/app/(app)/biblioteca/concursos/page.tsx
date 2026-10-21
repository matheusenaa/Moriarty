import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { searchCollections, collectionCounts, STATUS_LABEL, CATEGORY_LABEL } from "@/lib/repo/catalog";
import { Card, CardTitle, CardDescription } from "@/components/Card";
import { Badge } from "@/components/Badge";

const STATUS_TONE: Record<string, "petroleo" | "latiao" | "neutro" | "alerta"> = {
  vigente: "petroleo",
  historico: "latiao",
  comum: "neutro",
  aguardando: "alerta",
};

const STATUS_OPTIONS = Object.entries(STATUS_LABEL);

export default async function ConcursosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");

  const { q = "", status = "" } = await searchParams;
  const collections = await searchCollections(q, status);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-titulo text-3xl font-bold">Biblioteca de concursos</h1>
          <p className="text-sm text-cinza">
            Conteúdo inicial de preparação PMDF, Polícia Federal e PRF. Notas, flashcards e
            questões autorais, com fonte e data de verificação em cada trilha.
          </p>
        </div>
        <Link href="/biblioteca" className="text-sm text-latao underline">
          ← Minha biblioteca
        </Link>
      </header>

      <Card>
        <form method="get" className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs text-cinza">
            Buscar (concurso, matéria ou tema)
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="ex.: penal, trânsito, PMDF"
              className="rounded-md border border-white/10 bg-carvao/40 px-3 py-2 text-sm text-pergaminho"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-cinza">
            Status
            <select
              name="status"
              defaultValue={status}
              className="rounded-md border border-white/10 bg-carvao/40 px-3 py-2 text-sm text-pergaminho"
            >
              <option value="">Todos</option>
              {STATUS_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="rounded-md border border-latao/40 px-4 py-2 text-sm text-latao">
            Filtrar
          </button>
          {q || status ? (
            <Link href="/biblioteca/concursos" className="text-sm text-cinza underline">
              limpar
            </Link>
          ) : null}
        </form>
      </Card>

      {collections.length === 0 ? (
        <Card>
          <CardDescription>
            Nenhuma trilha encontrada{q || status ? " para este filtro." : "."}{" "}
            {q || status ? (
              <Link href="/biblioteca/concursos" className="text-latao underline">
                Limpar filtros
              </Link>
            ) : (
              <>
                Rode <code>npm run db:migrate</code> para carregar o conteúdo inicial.
              </>
            )}
          </CardDescription>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {await Promise.all(
            collections.map(async (c) => {
            const counts = await collectionCounts(c.id);
            return (
              <Card key={c.id} className="flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">
                    <Link href={`/biblioteca/concursos/${c.slug}`} className="hover:text-latao-claro">
                      {c.title}
                    </Link>
                  </CardTitle>
                  <Badge tone={STATUS_TONE[c.status] ?? "neutro"}>
                    {STATUS_LABEL[c.status] ?? c.status}
                  </Badge>
                </div>
                <CardDescription className="mt-2 flex-1">{c.summary}</CardDescription>
                <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                  <Badge tone="neutro">{counts.area ?? 0} matérias</Badge>
                  <Badge tone="neutro">{counts.nota ?? 0} notas</Badge>
                  <Badge tone="neutro">{counts.questao ?? 0} questões</Badge>
                  <Badge tone="neutro">{counts.flashcard ?? 0} flashcards</Badge>
                </div>
                <p className="mt-3 text-xs text-cinza-escuro">
                  {c.edital_ref} · verificado em {c.checked_at}
                </p>
                <Link
                  href={`/biblioteca/concursos/${c.slug}`}
                  className="mt-3 inline-block text-sm text-latao underline"
                >
                  Abrir trilha
                </Link>
              </Card>
              );
            }),
          )}
        </div>
      )}

      <Card>
        <CardTitle className="text-base">Como o status é definido</CardTitle>
        <ul className="mt-2 space-y-1 text-sm text-cinza">
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <li key={k}>
              <Badge tone={STATUS_TONE[k] ?? "neutro"} className="mr-2">
                {v}
              </Badge>
              {k === "vigente"
                ? "há fonte oficial confirmada para o cargo."
                : k === "historico"
                  ? "material baseado no último edital oficial localizado, sem certame novo confirmado."
                  : k === "comum"
                    ? "tema útil, ainda não confirmado em edital de cargo específico."
                    : "fonte não pôde ser aberta/confirmada."}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-cinza-escuro">
          Rótulos de categoria: {Object.values(CATEGORY_LABEL).join(" · ")}
        </p>
      </Card>
    </div>
  );
}
