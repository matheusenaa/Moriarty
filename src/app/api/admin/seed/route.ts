import path from "path";
import { pathToFileURL } from "url";
import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Seed do catálogo via HTTP (idempotente).
 *
 * Por que existe: a rede local pode bloquear a porta 5432 do Supabase, mas a
 * Vercel (onde o app roda) tem acesso aberto. Assim o conteúdo chega ao banco
 * de produção sem depender do SQL Editor manual.
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
    const modulePath = path.join(process.cwd(), "scripts", "seed-catalog.mjs");
    const mod = await import(pathToFileURL(modulePath).href);
    const pool = getPool();
    const result = await mod.seedCatalogPg(pool);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
