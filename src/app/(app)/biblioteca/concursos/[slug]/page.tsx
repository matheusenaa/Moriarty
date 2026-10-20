import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  getCollectionWithItems,
  getUserProgressMap,
  collectionProgressCounts,
  STATUS_LABEL,
  CATEGORY_LABEL,
} from "@/lib/repo/catalog";
import { Card, CardTitle, CardDescription } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { saveCatalogItemAction, scheduleCatalogItemReviewAction, importCollectionSubjectsAction } from "@/actions/catalog";
import { CatalogQuestion } from "@/components/CatalogQuestion";
import { CatalogFlashcard, splitFlashcard } from "@/components/CatalogFlashcard";
import { CatalogProgressButtons } from "@/components/CatalogProgressButtons";

const STATUS_TONE: Record<string, "petroleo" | "latiao" | "neutro" | "alerta"> = {
  vigente: "petroleo",
  historico: "latiao",
  comum: "neutro",
  aguardando: "alerta",
};

export default async function ColecaoPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const { slug } = await params;
  const data = getCollectionWithItems(slug);
  if (!data) notFound();

  const { collection: c, items } = data;
  const areas = items.filter((i) => i.kind === "area");
  const notas = items.filter((i) => i.kind === "nota");
  const flashcards = items.filter((i) => i.kind === "flashcard");
  const questoes = items.filter((i) => i.kind === "questao");

  const progress = getUserProgressMap(user.id, items.map((i) => i.id));
  const progressCounts = collectionProgressCounts(user.id, c.id);
  const trackableCount = notas.length + flashcards.length;
  const doneCount = progressCounts.lido + progressCounts.dominado;
  const pct = trackableCount > 0 ? Math.round((doneCount / trackableCount) * 100) : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <Link href="/biblioteca/concursos" className="text-sm text-latao underline">
          ← Biblioteca de concursos
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="font-titulo text-3xl font-bold">{c.title}</h1>
          <Badge tone={STATUS_TONE[c.status] ?? "neutro"}>
            {STATUS_LABEL[c.status] ?? c.status}
          </Badge>
        </div>
        <p className="mt-2 text-sm text-cinza">{c.summary}</p>
        <form action={importCollectionSubjectsAction} className="mt-3">
          <input type="hidden" name="slug" value={c.slug} />
          <button
            type="submit"
            className="rounded-md border border-latao/40 px-4 py-2 text-sm text-latao hover:bg-latao/10"
          >
            Adicionar as matérias desta trilha ao meu plano
          </button>
          <span className="ml-3 text-xs text-cinza-escuro">
            Cria as matérias no seu plano (sem duplicar as que você já tem).
          </span>
        </form>
      </header>

      <Card>
        <CardTitle className="text-base">Status e fonte</CardTitle>
        <p className="mt-2 text-sm text-cinza">{c.status_note}</p>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-cinza-escuro">Edital de referência</dt>
            <dd className="text-pergaminho/90">{c.edital_ref || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-cinza-escuro">Fonte consultada</dt>
            <dd className="text-pergaminho/90">{c.source_name || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-cinza-escuro">Verificado em</dt>
            <dd className="text-pergaminho/90">{c.checked_at}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-cinza-escuro">Link oficial</dt>
            <dd>
              {c.source_url ? (
                <a
                  href={c.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-latao underline"
                >
                  {c.source_url}
                </a>
              ) : (
                "—"
              )}
            </dd>
          </div>
        </dl>
      </Card>

      <Card>
        <CardTitle className="text-base">Seu progresso nesta trilha</CardTitle>
        <p className="mt-2 text-sm text-cinza">
          {doneCount} de {trackableCount} itens revisáveis marcados ({pct}%) —{" "}
          {progressCounts.lido} lidos, {progressCounts.dominado} dominados.
        </p>
        <div
          className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso na trilha"
        >
          <div className="h-full bg-latao" style={{ width: `${pct}%` }} />
        </div>
        <CardDescription className="mt-2">
          O progresso é seu; o conteúdo da trilha permanece igual para todos.
        </CardDescription>
      </Card>

      <Card>
        <CardTitle className="text-base">Matérias da trilha ({areas.length})</CardTitle>
        <div className="mt-3 flex flex-wrap gap-2">
          {areas.map((a) => (
            <Badge key={a.id} tone="neutro">
              {a.title}
            </Badge>
          ))}
        </div>
        <CardDescription className="mt-3">
          Mapa de disciplinas conforme o edital de referência. Ajuste suas matérias pessoais em{" "}
          <Link href="/materias" className="text-latao underline">
            Matérias
          </Link>
          .
        </CardDescription>
      </Card>

      <section className="space-y-4">
        <h2 className="font-titulo text-xl font-bold">Notas de estudo ({notas.length})</h2>
        {notas.map((n) => (
          <Card key={n.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">{n.title}</CardTitle>
              <div className="flex gap-1.5">
                <Badge tone="neutro">{CATEGORY_LABEL[n.category] ?? n.category}</Badge>
                {n.ref_label ? <Badge tone="latiao">{n.ref_label}</Badge> : null}
              </div>
            </div>
            <div className="mt-2 whitespace-pre-line text-sm text-pergaminho/90">{n.body}</div>
            {n.url ? (
              <a
                href={n.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block break-all text-xs text-latao underline"
              >
                Fonte oficial
              </a>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-3 text-xs">
              <form action={saveCatalogItemAction}>
                <input type="hidden" name="itemId" value={n.id} />
                <button type="submit" className="text-latao underline">
                  salvar na minha biblioteca
                </button>
              </form>
              <form action={scheduleCatalogItemReviewAction}>
                <input type="hidden" name="itemId" value={n.id} />
                <button type="submit" className="text-cinza underline hover:text-pergaminho">
                  revisar amanhã
                </button>
              </form>
            </div>
            <CatalogProgressButtons itemId={n.id} slug={c.slug} state={progress[n.id] ?? null} />
          </Card>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="font-titulo text-xl font-bold">Flashcards ({flashcards.length})</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {flashcards.map((f) => {
            const { front, back } = splitFlashcard(f.body, f.title);
            return (
              <CatalogFlashcard
                key={f.id}
                item={{ id: f.id, title: f.title, front, back, refLabel: f.ref_label, url: f.url }}
                slug={c.slug}
                state={progress[f.id] ?? null}
              />
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-titulo text-xl font-bold">Questões de treino ({questoes.length})</h2>
        <p className="text-sm text-cinza">
          Todas as questões são <strong>autorais</strong> (geradas para prática) — não são questões
          de prova oficial. O gabarito e a explicação são de autoria própria.
        </p>
        {questoes.map((q) => {
          let options: string[] = [];
          try {
            options = JSON.parse(q.options_json) as string[];
          } catch {
            options = [];
          }
          return (
            <CatalogQuestion
              key={q.id}
              item={{
                id: q.id,
                title: q.title,
                statement: q.body,
                options,
                correctIndex: q.correct_index ?? 0,
                explanation: q.explanation,
                originNote: q.origin_note || "Autoral/gerada para prática — não oficial.",
              }}
            />
          );
        })}
      </section>

      <footer className="pt-4 text-xs text-cinza-escuro">
        Conteúdo inicial de autoria própria + legislação oficial. Links apontam para páginas
        oficiais. Status e data de verificação estão sempre visíveis; confira o edital mais recente
        antes da prova.
      </footer>
    </div>
  );
}
