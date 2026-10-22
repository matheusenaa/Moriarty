import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verificarStorage } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errInfo(err: unknown): { code: string | null; message: string } {
  const code =
    typeof err === "object" && err !== null ? (err as { code?: string }).code ?? null : null;
  const message = err instanceof Error ? err.message.slice(0, 300) : "erro desconhecido";
  return { code, message };
}

/**
 * Diagnóstico de saúde (sem dados sensíveis). Confirma, em produção, se o banco
 * responde e se as migrações 0004 (catalog_answers) e 0005 (auth_rate_limits)
 * já foram aplicadas, além do armazenamento de arquivos.
 */
export async function GET() {
  try {
    const ping = await query<{ ok: number }>("SELECT 1 AS ok");
    const table = await query<{ reg: string | null; rl: string | null; qz: string | null }>(
      `SELECT to_regclass('public.catalog_answers') AS reg,
              to_regclass('public.auth_rate_limits') AS rl,
              to_regclass('public.catalog_quiz_attempts') AS qz`,
    );
    const storage = await verificarStorage();
    return NextResponse.json({
      ok: ping[0]?.ok === 1,
      catalogAnswers: table[0]?.reg ?? null,
      rateLimits: table[0]?.rl ?? null,
      quizAttempts: table[0]?.qz ?? null,
      storage: {
        modo: storage.modo,
        bucket: storage.bucket,
        projeto: storage.projeto,
        ok: storage.bucketOk,
        erro: storage.erro,
        statusLista: storage.statusLista,
        buckets: storage.buckets,
      },
    });
  } catch (err) {
    return NextResponse.json({ ok: false, ...errInfo(err) }, { status: 500 });
  }
}
