import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Diagnóstico de saúde (sem dados sensíveis). Útil para confirmar, em produção,
 * se o banco responde e se a migração 0004 (catalog_answers) já foi aplicada.
 * Retorna apenas códigos/estado — nunca a connection string.
 */
export async function GET() {
  try {
    const ping = await query<{ ok: number }>("SELECT 1 AS ok");
    const table = await query<{ reg: string | null }>(
      "SELECT to_regclass('public.catalog_answers') AS reg",
    );
    return NextResponse.json({
      ok: ping[0]?.ok === 1,
      catalogAnswers: table[0]?.reg ?? null,
    });
  } catch (err) {
    const code =
      typeof err === "object" && err !== null ? (err as { code?: string }).code ?? null : null;
    const message = err instanceof Error ? err.message.slice(0, 200) : "erro desconhecido";
    return NextResponse.json({ ok: false, code, message }, { status: 500 });
  }
}
