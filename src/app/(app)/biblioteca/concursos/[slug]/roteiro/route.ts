import { notFound } from "next/navigation";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCollectionWithItems } from "@/lib/repo/catalog";
import { montarRoteiro, documentoImprimivel } from "@/lib/roteiro";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Roteiro de estudo de uma trilha, em HTML imprimível (salvar como PDF pelo
 * navegador). Com ?formato=md, baixa o Markdown para editar/copiar.
 */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/entrar", req.url));
  }
  const { slug } = await ctx.params;
  const data = await getCollectionWithItems(slug);
  if (!data) notFound();

  const formato = new URL(req.url).searchParams.get("formato");
  const geradoEm = new Date().toISOString().slice(0, 10);
  const roteiro = montarRoteiro(
    {
      slug: data.collection.slug,
      title: data.collection.title,
      summary: data.collection.summary,
      status_note: data.collection.status_note,
      edital_ref: data.collection.edital_ref,
      source_name: data.collection.source_name,
      source_url: data.collection.source_url,
      checked_at: data.collection.checked_at,
    },
    data.items.map((i) => ({
      kind: i.kind,
      category: i.category,
      title: i.title,
      body: i.body,
      ref_label: i.ref_label,
      url: i.url,
    })),
    geradoEm,
  );

  if (formato === "md") {
    return new Response(roteiro.markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="roteiro-${slug}.md"`,
      },
    });
  }

  return new Response(documentoImprimivel(roteiro), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
