import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getMaterial } from "@/lib/repo/materials";
import { lerArquivo } from "@/lib/storage";

/**
 * Serve arquivos privados apenas para o dono autenticado.
 * Não há URL pública permanente: o caminho do arquivo nunca é exposto.
 * A leitura usa o adaptador de storage (Supabase Storage em produção, disco local em dev).
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await ctx.params;
  const material = await getMaterial(user.id, id);
  if (!material || !material.file_path) {
    return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
  }
  const buffer = await lerArquivo(material.file_path);
  if (!buffer) {
    return NextResponse.json({ error: "Arquivo indisponível no armazenamento." }, { status: 404 });
  }
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": material.mime_type || "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(material.title)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
