import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getMaterialByToken } from "@/lib/repo/materials";
import { copySharedMaterialAction } from "@/actions/materials";
import { Card, CardTitle, CardDescription } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";

/**
 * Página de material compartilhado por link.
 * Exige login por padrão (política do produto): apenas materiais com
 * visibilidade "publico" são exibidos sem sessão.
 */
export default async function CompartilhadoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const material = getMaterialByToken(token);
  const user = await getCurrentUser();

  if (!material) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <Card>
          <CardTitle>Link inválido ou revogado</CardTitle>
          <CardDescription>
            O compartilhamento não existe mais, foi revogado ou o link está incorreto. Peça ao
            autor um novo link.
          </CardDescription>
        </Card>
      </main>
    );
  }

  if (material.visibility !== "publico" && !user) {
    redirect(`/entrar?next=/compartilhado/${token}`);
  }

  const isPublic = material.visibility === "publico";

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.3em] text-latao">Material compartilhado</p>
      <h1 className="mb-2 font-titulo text-3xl font-bold">{material.title}</h1>
      <div className="mb-4 flex gap-2">
        <Badge tone="petroleo">{material.visibility}</Badge>
        <Badge tone="neutro">{material.type}</Badge>
        {material.ai_generated === 1 ? <Badge tone="latiao">gerado por IA</Badge> : null}
      </div>
      <Card>
        {material.description ? <p className="mb-3 text-cinza">{material.description}</p> : null}
        {material.content_text ? (
          <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap font-corpo text-sm">
            {material.content_text}
          </pre>
        ) : null}
        {material.url ? (
          <a href={material.url} target="_blank" rel="noopener noreferrer" className="text-latao underline">
            Abrir link original
          </a>
        ) : null}
        <p className="mt-4 text-xs text-cinza-escuro">
          Compartilhado por {material.author_display ?? material.author_username ?? "autor desconhecido"}.
          Compartilhar material não compartilha progresso, estatísticas ou cronograma de ninguém.
        </p>
      </Card>

      {user ? (
        <form action={copySharedMaterialAction} className="mt-4">
          <input type="hidden" name="id" value={material.id} />
          <input type="hidden" name="token" value={token} />
          <Button type="submit" variant="primario">
            Salvar cópia na minha biblioteca
          </Button>
        </form>
      ) : isPublic ? (
        <p className="mt-4 text-sm text-cinza">
          <Link href="/entrar" className="text-latao underline">
            Entre
          </Link>{" "}
          para salvar uma cópia na sua biblioteca.
        </p>
      ) : null}
    </main>
  );
}
