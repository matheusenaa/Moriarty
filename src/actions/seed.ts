"use server";

import path from "path";
import { pathToFileURL } from "url";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { getPool } from "@/lib/db";

export type SeedState = { ok: boolean; message: string };

/**
 * Roda o seed do catálogo (idempotente) direto pela interface, sem terminal.
 *
 * Segurança: só o usuário cujo e-mail bate com ADMIN_EMAIL pode executar.
 * Se ADMIN_EMAIL não estiver configurado, ninguém pode (recurso desativado).
 * Roda no servidor (Vercel), que tem acesso aberto ao banco.
 */
export async function rodarSeedAction(): Promise<SeedState> {
  const user = await requireUser();
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) {
    return { ok: false, message: "Recurso desativado (ADMIN_EMAIL não configurado)." };
  }
  if (user.email.trim().toLowerCase() !== adminEmail) {
    return { ok: false, message: "Você não tem permissão para esta ação." };
  }

  try {
    const modulePath = path.join(process.cwd(), "scripts", "seed-catalog.mjs");
    const mod = await import(pathToFileURL(modulePath).href);
    const result = (await mod.seedCatalogPg(getPool())) as {
      collections: number;
      items: number;
      inserted: number;
    };
    revalidatePath("/biblioteca/concursos");
    revalidatePath("/fontes");
    revalidatePath("/perfil");
    return {
      ok: true,
      message: `Pronto: ${result.collections} trilhas e ${result.items} itens no banco.`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, message: `Falha ao rodar o seed: ${message}` };
  }
}
