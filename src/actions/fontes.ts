"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createMaterial } from "@/lib/repo/materials";
import { buscarFontes, type ResultadoBusca } from "@/lib/fontes";

/**
 * Busca determinística em fontes oficiais fixas (sem IA paga, sem scraping).
 * Roda no servidor e devolve as normas/artigos curados mais relevantes.
 */
export async function buscarFontesAction(
  consulta: string,
): Promise<ResultadoBusca[]> {
  await requireUser();
  return buscarFontes(consulta);
}

/**
 * Salva um trecho/fonte oficial como material privado do usuário, preservando
 * a citação do artigo e o link oficial. Cria sempre uma CÓPIA para o usuário.
 */
export async function salvarFonteAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const rotulo = String(formData.get("rotulo") ?? "").trim();
  const norma = String(formData.get("norma") ?? "").trim();
  const sobre = String(formData.get("sobre") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  if (!norma || !url) return;

  await createMaterial(user.id, {
    title: rotulo || norma,
    description: `Fonte oficial — ${norma}.`,
    type: "link",
    contentText: [
      norma,
      sobre,
      "",
      `Fonte oficial: ${url}`,
      "",
      "Referência consultada na base de fontes oficiais do Moriarty (Ops junto ao estudo, fonte primária).",
    ].join("\n"),
    url,
    subjectId: null,
    tags: ["fontes-oficiais", "lei"],
  });
  revalidatePath("/biblioteca");
  revalidatePath("/arquivo");
}
