import { execute, nowIso, query, queryOne, uid, withTransaction } from "../db";
import { XP_VALUES, achievementByCode, ACHIEVEMENTS, type XpEventType } from "../xp";

const UNIQUE_VIOLATION = "23505";

/**
 * Concede XP de forma idempotente: a tabela xp_events tem restrição única
 * por (event_type, ref_table, ref_id). Reenviar a mesma requisição não duplica.
 * Retorna o XP efetivamente concedido (0 quando já concedido).
 */
export async function awardXp(
  userId: string,
  eventType: XpEventType,
  refTable: string,
  refId: string,
): Promise<number> {
  const xp = XP_VALUES[eventType];
  try {
    await withTransaction(async (client) => {
      await client.query(
        "INSERT INTO xp_events (id, user_id, event_type, ref_table, ref_id, xp, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [uid(), userId, eventType, refTable, refId, xp, nowIso()],
      );
      await client.query(
        `INSERT INTO user_xp (user_id, xp, updated_at) VALUES ($1, $2, $3)
         ON CONFLICT(user_id) DO UPDATE SET xp = xp + excluded.xp, updated_at = excluded.updated_at`,
        [userId, xp, nowIso()],
      );
    });
    return xp;
  } catch (err) {
    if ((err as { code?: string }).code === UNIQUE_VIOLATION) return 0;
    throw err;
  }
}

export async function getXp(userId: string): Promise<number> {
  const row = await queryOne<{ xp: number }>("SELECT xp FROM user_xp WHERE user_id = $1", [userId]);
  return row?.xp ?? 0;
}

export async function unlockAchievement(userId: string, code: string): Promise<boolean> {
  if (!achievementByCode(code)) return false;
  try {
    await execute("INSERT INTO achievements (user_id, code, unlocked_at) VALUES ($1, $2, $3)", [
      userId,
      code,
      nowIso(),
    ]);
    return true;
  } catch (err) {
    if ((err as { code?: string }).code === UNIQUE_VIOLATION) return false;
    throw err;
  }
}

export function listAchievements(userId: string): Promise<{ code: string; unlocked_at: string }[]> {
  return query<{ code: string; unlocked_at: string }>(
    "SELECT code, unlocked_at FROM achievements WHERE user_id = $1",
    [userId],
  );
}

export async function achievementCatalogWithStatus(userId: string) {
  const unlocked = new Map((await listAchievements(userId)).map((a) => [a.code, a.unlocked_at]));
  return ACHIEVEMENTS.map((a) => ({ ...a, unlockedAt: unlocked.get(a.code) ?? null }));
}

/** Concede conquistas baseadas em contagens — idempotente pela tabela achievements. */
export async function checkCountAchievements(userId: string): Promise<string[]> {
  const unlocked: string[] = [];
  const count = async (sql: string) => {
    const row = await queryOne<{ c: string }>(sql, [userId]);
    return Number(row?.c ?? 0);
  };
  const counts = {
    sessions: await count("SELECT COUNT(*) c FROM study_sessions WHERE user_id = $1 AND status IN ('concluida','parcial')"),
    reviews: await count("SELECT COUNT(*) c FROM review_history WHERE user_id = $1"),
    simulated: await count("SELECT COUNT(*) c FROM quiz_attempts WHERE user_id = $1 AND finished_at IS NOT NULL"),
    materials: await count("SELECT COUNT(*) c FROM materials WHERE user_id = $1 AND archived = 0"),
  };
  if (counts.sessions >= 1 && (await unlockAchievement(userId, "primeira_sessao"))) unlocked.push("primeira_sessao");
  if (counts.sessions >= 10 && (await unlockAchievement(userId, "dez_sessoes"))) unlocked.push("dez_sessoes");
  if (counts.reviews >= 1 && (await unlockAchievement(userId, "primeira_revisao"))) unlocked.push("primeira_revisao");
  if (counts.simulated >= 1 && (await unlockAchievement(userId, "primeiro_simulado"))) unlocked.push("primeiro_simulado");
  if (counts.materials >= 5 && (await unlockAchievement(userId, "cinco_materiais"))) unlocked.push("cinco_materiais");
  return unlocked;
}

export async function gamificationSummary(userId: string, streak: number) {
  const xp = await getXp(userId);
  if (streak >= 3 && xp > 0) await unlockAchievement(userId, "sequencia_3");
  if (streak >= 7 && xp > 0) await unlockAchievement(userId, "sequencia_7");
  return {
    xp,
    achievements: await achievementCatalogWithStatus(userId),
    streak,
  };
}
