import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listMaterials } from "@/lib/repo/materials";
import { listSubjects } from "@/lib/repo/planning";
import { Card, CardTitle } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/Feedback";
import { MaterialForm } from "@/components/MaterialForm";
import { ConfirmForm } from "@/components/ConfirmForm";
import {
  archiveMaterialAction,
  deleteMaterialAction,
  duplicateMaterialAction,
  scheduleMaterialReviewAction,
  toggleFavoriteAction,
} from "@/actions/materials";

const TYPE_LABEL: Record<string, string> = {
  nota: "Nota",
  link: "Link",
  arquivo: "Arquivo",
  flashcard: "Flashcard",
};

export default async function BibliotecaPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; tag?: string; materia?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const params = await searchParams;
  const materials = await listMaterials(user.id, {
    search: params.busca,
    tag: params.tag,
    subjectId: params.materia,
  });
  const subjects = await listSubjects(user.id);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="font-titulo text-3xl font-bold">Biblioteca</h1>
        <p className="text-sm text-cinza">Notas, links, arquivos e flashcards. Privado por padrão.</p>
        <p className="mt-2 text-sm">
          <Link href="/biblioteca/concursos" className="text-latao underline">
            Ver Biblioteca de concursos (PMDF, PF, PRF)
          </Link>
        </p>
      </header>

      <Card>
        <CardTitle>Novo material</CardTitle>
        <MaterialForm subjects={subjects.map((s) => ({ id: s.id, name: s.name }))} />
      </Card>

      <Card>
        <form className="flex flex-wrap items-end gap-2" method="get">
          <div className="min-w-48 flex-1">
            <label htmlFor="busca" className="mb-1 block text-xs text-cinza">
              Busca
            </label>
            <input
              id="busca"
              name="busca"
              defaultValue={params.busca ?? ""}
              placeholder="Título, descrição ou conteúdo"
              className="w-full rounded-md border border-latao/20 bg-carvao/70 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="materia" className="mb-1 block text-xs text-cinza">
              Matéria
            </label>
            <select
              id="materia"
              name="materia"
              defaultValue={params.materia ?? ""}
              className="rounded-md border border-latao/20 bg-carvao/70 px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="rounded-md border border-latao/40 px-3 py-2 text-sm hover:bg-latao/10">
            Filtrar
          </button>
        </form>
      </Card>

      {materials.length === 0 ? (
        <EmptyState
          title="Biblioteca vazia"
          description="Cadastre uma nota, cole um link oficial de legislação ou envie um PDF de apoio. Você poderá compartilhar depois, com controle de visibilidade."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((m) => (
            <Card key={m.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">
                  <Link href={`/biblioteca/${m.id}`} className="hover:text-latao-claro">
                    {m.title}
                  </Link>
                </CardTitle>
                {m.favorite === 1 ? <Badge tone="latiao">★</Badge> : null}
              </div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Badge tone="neutro">{TYPE_LABEL[m.type] ?? m.type}</Badge>
                {m.visibility !== "privado" ? <Badge tone="petroleo">{m.visibility}</Badge> : null}
                {m.ai_generated === 1 ? <Badge tone="latiao">gerado por IA</Badge> : null}
              </div>
              {m.description ? <p className="mt-2 line-clamp-3 text-sm text-cinza">{m.description}</p> : null}
              {m.tags ? <p className="mt-1 text-xs text-cinza-escuro">{m.tags}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <form action={toggleFavoriteAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <button type="submit" className="text-latao underline">
                    {m.favorite === 1 ? "desfavoritar" : "favoritar"}
                  </button>
                </form>
                <form action={scheduleMaterialReviewAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <button type="submit" className="text-cinza underline hover:text-pergaminho">
                    revisar amanhã
                  </button>
                </form>
                <form action={duplicateMaterialAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <button type="submit" className="text-cinza underline hover:text-pergaminho">
                    duplicar
                  </button>
                </form>
                <form action={archiveMaterialAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <button type="submit" className="text-cinza underline hover:text-pergaminho">
                    arquivar
                  </button>
                </form>
                <ConfirmForm
                  action={deleteMaterialAction}
                  fields={{ id: m.id }}
                  message={`Excluir o material "${m.title}"? Esta ação não pode ser desfeita.`}
                  className="text-alerta-claro underline"
                >
                  excluir
                </ConfirmForm>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
