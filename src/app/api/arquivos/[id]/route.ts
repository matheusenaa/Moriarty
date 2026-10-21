import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getMaterial } from "@/lib/repo/materials";

/**
 * Serve arquivos privados apenas para o dono autenticado.
 * Não há URL pública permanente: o caminho do arquivo nunca é exposto.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { id } = await ctx.params;
  const material = await getMaterial(user.id, id);
  if (!material || !material.file_path) {
    return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
  }
  // Defesa em profundidade: o path deve estar dentro da pasta do usuário.
  const normalized = path.normalize(material.file_path);
  if (normalized.startsWith("..") || path.isAbsolute(normalized)) {
    return NextResponse.json({ error: "Caminho inválido." }, { status: 400 });
  }
  const absolute = path.join(process.cwd(), "uploads", normalized);
  try {
    const buffer = await readFile(absolute);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": material.mime_type || "application/octet-stream",
        "Content-Disposition": `inline; filename="${encodeURIComponent(material.title)}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Arquivo não encontrado no disco." }, { status: 404 });
  }
}
