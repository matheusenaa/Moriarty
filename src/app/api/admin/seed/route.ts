import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { seedCatalogPg } from "../../../../../scripts/seed-catalog.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Seed do catálogo via HTTP (idempotente).
 *
 * O módulo do seed é importado ESTATICAMENTE de propósito: assim o bundler
 * embute o conteúdo no pacote da função (na Vercel, `scripts/` não existe em
 * disco em runtime).
 *
 * Segurança: exige header `x-seed-token` igual a SEED_TOKEN (variável de
 * ambiente). Sem SEED_TOKEN configurado, o endpoint fica desativado (404).
 * A ação é idempotente (ON CONFLICT), então pode ser repetida com segurança.
 */
export async function POST(req: Request) {
  const expected = process.env.SEED_TOKEN;
  if (!expected) {
    return NextResponse.json({ error: "Seed desativado." }, { status: 404 });
  }
  const provided = req.headers.get("x-seed-token");
  if (!provided || provided !== expected) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const result = await seedCatalogPg(getPool());
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
