import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { getMaterial, countMaterials } from "@/lib/repo/materials";
import { listSubjects } from "@/lib/repo/planning";
import { listFriends } from "@/lib/repo/social";
import { Card, CardTitle, CardDescription } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { VisibilityControls } from "@/components/VisibilityControls";
import { EditMaterialForm } from "@/components/EditMaterialForm";
import { scheduleMaterialReviewAction } from "@/actions/materials";

export default async function MaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const { id } = await params;
  const material = await getMaterial(user.id, id);
  if (!material) notFound();

  const subjects = await listSubjects(user.id);
  const friends = await listFriends(user.id);
  const originAuthor =
    material.source_user_id !== null
      ? (
          await queryOne<{ username: string }>("SELECT username FROM profiles WHERE user_id = $1", [
            material.source_user_id,
          ])
        )?.username ?? "desconhecido"
      : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <nav className="text-sm text-cinza">
        <Link href="/biblioteca" className="underline hover:text-pergaminho">
          Biblioteca
        </Link>{" "}
        / {material.title}
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-titulo text-3xl font-bold">{material.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone="neutro">{material.type}</Badge>
            <Badge tone={material.visibility === "privado" ? "neutro" : "petroleo"}>{material.visibility}</Badge>
            {material.ai_generated === 1 ? <Badge tone="latiao">gerado por IA — revise antes de usar</Badge> : null}
          </div>
        </div>
        <form action={scheduleMaterialReviewAction}>
          <input type="hidden" name="id" value={material.id} />
          <button type="submit" className="rounded-md border border-latao/40 px-3 py-2 text-sm hover:bg-latao/10">
            Revisar amanhã
          </button>
        </form>
      </header>

      {material.description ? <p className="text-cinza">{material.description}</p> : null}

      {material.type === "link" && material.url ? (
        <Card>
          <CardTitle className="text-base">Link externo</CardTitle>
          <p className="mt-2 break-all text-sm">
            <a href={material.url} target="_blank" rel="noopener noreferrer" className="text-latao underline">
              {material.url}
            </a>
          </p>
          <CardDescription className="mt-2">
            Fonte cadastrada por você. O Moriarty não verifica automaticamente se o conteúdo foi
            atualizado; confira a data da fonte antes de confiar em informações legais.
          </CardDescription>
        </Card>
      ) : null}

      {material.type === "arquivo" && material.file_path ? (
        <Card>
          <CardTitle className="text-base">Arquivo</CardTitle>
          <CardDescription>
            {material.mime_type} · {(material.file_size / 1024).toFixed(0)} KB
          </CardDescription>
          <a
            href={`/api/arquivos/${material.id}`}
            className="mt-2 inline-block rounded-md border border-latao/40 px-3 py-2 text-sm hover:bg-latao/10"
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir arquivo
          </a>
          <CardDescription className="mt-2">
            O arquivo é servido apenas para o dono autenticado. Não há URL pública permanente.
          </CardDescription>
        </Card>
      ) : null}

      {material.content_text ? (
        <Card>
          <CardTitle className="text-base">Conteúdo</CardTitle>
          <pre className="mt-2 max-h-96 overflow-y-auto whitespace-pre-wrap font-corpo text-sm text-pergaminho/90">
            {material.content_text}
          </pre>
        </Card>
      ) : null}

      {material.tags ? (
        <p className="text-sm text-cinza">
          Etiquetas: <span className="text-pergaminho">{material.tags}</span>
        </p>
      ) : null}

      {originAuthor ? (
        <p className="text-sm text-cinza">
          Cópia de material original de <span className="text-pergaminho">@{originAuthor}</span>. Você
          não pode editar o original.
        </p>
      ) : null}

      <Card>
        <CardTitle>Compartilhamento</CardTitle>
        <CardDescription>
          Por padrão, materiais compartilhados exigem login. <strong>Amigos</strong> libera apenas
          quem tem amizade aceita. <strong>Link</strong> libera qualquer usuário autenticado com o
          link. <strong>Público</strong> (escolha explícita) não exige login.
        </CardDescription>
        <VisibilityControls
          materialId={material.id}
          visibility={material.visibility}
          shareEnabled={material.share_enabled === 1}
          shareToken={material.share_token}
        />
        {friends.length > 0 ? (
          <p className="mt-3 text-xs text-cinza">
            Amigos atuais: {friends.map((f) => `@${f.username}`).join(", ")}
          </p>
        ) : null}
      </Card>

      <Card>
        <CardTitle>Editar</CardTitle>
        <EditMaterialForm
          material={{
            id: material.id,
            title: material.title,
            description: material.description,
            content_text: material.content_text,
            url: material.url,
            subject_id: material.subject_id,
          }}
          subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
        />
      </Card>

      <p className="text-xs text-cinza-escuro">
        Materiais na biblioteca: {await countMaterials(user.id)} · Criado em {material.created_at.slice(0, 10)} ·
        Atualizado em {material.updated_at.slice(0, 10)}
      </p>
    </div>
  );
}
