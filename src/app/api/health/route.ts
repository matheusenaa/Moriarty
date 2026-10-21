import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errInfo(err: unknown): { code: string | null; message: string } {
  const code =
    typeof err === "object" && err !== null ? (err as { code?: string }).code ?? null : null;
  const message = err instanceof Error ? err.message.slice(0, 300) : "erro desconhecido";
  return { code, message };
}

/**
 * Diagnóstico de saúde (sem dados sensíveis). Útil para confirmar, em produção,
 * se o banco responde e se a migração 0004 (catalog_answers) já foi aplicada.
 * `?deep=1` executa as mesmas consultas do layout/páginas para o primeiro usuário
 * e aponta o passo que falha (não retorna dados pessoais).
 */
export async function GET(req: Request) {
  const deep = new URL(req.url).searchParams.get("deep") === "1";
  try {
    const ping = await query<{ ok: number }>("SELECT 1 AS ok");
    const table = await query<{ reg: string | null }>(
      "SELECT to_regclass('public.catalog_answers') AS reg",
    );
    const base = { ok: ping[0]?.ok === 1, catalogAnswers: table[0]?.reg ?? null };
    if (!deep) return NextResponse.json(base);

    const steps: { step: string; ok: boolean; code?: string | null; message?: string }[] = [];
    const run = async (step: string, fn: () => Promise<unknown>) => {
      try {
        await fn();
        steps.push({ step, ok: true });
      } catch (err) {
        steps.push({ step, ok: false, ...errInfo(err) });
      }
    };

    const prof = await queryOne<{ user_id: string; timezone: string }>(
      "SELECT user_id, timezone FROM profiles LIMIT 1",
    );
    if (!prof) return NextResponse.json({ ...base, deep: { error: "sem usuários" } });

    const { todayStr } = await import("@/lib/dates");
    const today = todayStr(prof.timezone);
    const notifications = await import("@/lib/repo/notifications");
    const stats = await import("@/lib/repo/stats");
    const gamification = await import("@/lib/repo/gamification");
    const catalog = await import("@/lib/repo/catalog");

    await run("generateDailyReminders", () => notifications.generateDailyReminders(prof.user_id, today));
    await run("listNotifications", () => notifications.listNotifications(prof.user_id));
    let streak = 0;
    await run("studyStreak", async () => {
      streak = await stats.studyStreak(prof.user_id, today);
    });
    await run("gamificationSummary", () => gamification.gamificationSummary(prof.user_id, streak));

    let colId = "";
    await run("getCollectionBySlug", async () => {
      const col = await catalog.getCollectionBySlug("pmdf-cfo");
      colId = col?.id ?? "";
    });
    await run("listItems", () => catalog.listItems(colId));
    let qIds: string[] = [];
    await run("listQuestions", async () => {
      const items = await catalog.listItems(colId, "questao");
      qIds = items.map((i) => i.id);
    });
    await run("getUserQuestionResults", () => catalog.getUserQuestionResults(prof.user_id, qIds));
    await run("collectionQuestionStats", () => catalog.collectionQuestionStats(prof.user_id, colId));
    await run("catalogQuestionStats", () => catalog.catalogQuestionStats(prof.user_id));
    await run("listMissedQuestions", () => catalog.listMissedQuestions(prof.user_id));

    return NextResponse.json({ ...base, deep: steps });
  } catch (err) {
    return NextResponse.json({ ok: false, ...errInfo(err) }, { status: 500 });
  }
}
