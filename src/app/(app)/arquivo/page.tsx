import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listFriendIds } from "@/lib/repo/social";
import { listFriendMaterials, listPublicMaterials } from "@/lib/repo/materials";
import { copySharedMaterialAction } from "@/actions/materials";
import { Card, CardTitle, CardDescription } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/Feedback";
import { ConfirmForm } from "@/components/ConfirmForm";

export default async function ArquivoPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const params = await searchParams;
  const friends = await listFriendIds(user.id);
  const fromFriends = await listFriendMaterials(user.id, friends);
  const publics = await listPublicMaterials(params.busca);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="font-titulo text-3xl font-bold">Arquivo compartilhado</h1>
        <p className="text-sm text-cinza">
          Materiais que outros estudantes autorizaram ver. Ver progresso de ninguém — apenas
          conteúdo explicitamente compartilhado.
        </p>
      </header>

      <Card>
        <CardTitle>Materiais de amigos</CardTitle>
        <CardDescription>Visibilidade “amigos” ou “público” de quem aceitou sua amizade.</CardDescription>
        {fromFriends.length === 0 ? (
          <EmptyState
            className="mt-3 border-0 shadow-none"
            title="Nada de amigos por aqui"
            description="Adicione amigos em Amigos; quando eles compartilharem materiais com visibilidade de amigos, eles aparecem aqui."
          />
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {fromFriends.map((m) => (
              <li key={m.id} className="rounded-md border border-white/10 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-pergaminho">{m.title}</p>
                  <Badge tone="petroleo">de @{m.author_username}</Badge>
                </div>
                {m.description ? <p className="mt-1 text-sm text-cinza">{m.description}</p> : null}
                <div className="mt-2 flex items-center gap-3">
                  <ConfirmForm
                    action={copySharedMaterialAction}
                    fields={{ id: m.id }}
                    message="Salvar cópia na sua biblioteca?"
                    className="text-xs text-latao underline"
                  >
                    salvar cópia
                  </ConfirmForm>
                  <span className="text-[11px] text-cinza-escuro">cópia preserva a autoria original</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardTitle>Materiais públicos</CardTitle>
        <CardDescription>
          Qualquer pessoa publicou de forma explícita. A busca abaixo consulta apenas o acervo
          público desta instalação — não fazemos scraping da internet.
        </CardDescription>
        <form className="mt-2 flex gap-2" method="get">
          <input
            name="busca"
            defaultValue={params.busca ?? ""}
            placeholder="Buscar no acervo público"
            className="min-w-48 flex-1 rounded-md border border-latao/20 bg-carvao/70 px-3 py-2 text-sm"
            aria-label="Buscar materiais públicos"
          />
          <button type="submit" className="rounded-md border border-latao/40 px-3 py-2 text-sm hover:bg-latao/10">
            Buscar
          </button>
        </form>
        {publics.length === 0 ? (
          <CardDescription className="mt-3">Nenhum material público encontrado.</CardDescription>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {publics.map((m) => (
              <li key={m.id} className="rounded-md border border-white/10 p-3">
                <p className="font-medium text-pergaminho">{m.title}</p>
                <p className="text-xs text-cinza">por @{m.author_username}</p>
                {m.description ? <p className="mt-1 text-sm text-cinza">{m.description}</p> : null}
                <ConfirmForm
                  action={copySharedMaterialAction}
                  fields={{ id: m.id }}
                  message="Salvar cópia na sua biblioteca?"
                  className="mt-2 text-xs text-latao underline"
                >
                  salvar cópia
                </ConfirmForm>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="text-sm text-cinza">
        Gerencie o compartilhamento dos <em>seus</em> materiais na{" "}
        <Link href="/biblioteca" className="text-latao underline">
          Biblioteca
        </Link>
        .
      </p>
    </div>
  );
}
