import { getDb, nowIso, uid } from "../db";
import { XP_VALUES, achievementByCode, ACHIEVEMENTS, type XpEventType } from "../xp";

/**
 * Concede XP de forma idempotente: a tabela xp_events tem restrição única
 * por (event_type, ref_table, ref_id). Reenviar a mesma requisição não duplica.
 * Retorna o XP efetivamente concedido (0 quando já concedido).
 */
export function awardXp(userId: string, eventType: XpEventType, refTable: string, refId: string): number {
  const xp = XP_VALUES[eventType];
  const db = getDb();
  try {
    db.prepare(
      "INSERT INTO xp_events (id, user_id, event_type, ref_table, ref_id, xp, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run(uid(), userId, eventType, refTable, refId, xp, nowIso());
  } catch {
    return 0; // UNIQUE violation → evento já pontuado
  }
  db.prepare(
    `INSERT INTO user_xp (user_id, xp, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET xp = xp + excluded.xp, updated_at = excluded.updated_at`,
  ).run(userId, xp, nowIso());
  return xp;
}

export function getXp(userId: string): number {
  const row = getDb().prepare("SELECT xp FROM user_xp WHERE user_id = ?").get(userId) as { xp: number } | undefined;
  return row?.xp ?? 0;
}

export function unlockAchievement(userId: string, code: string): boolean {
  if (!achievementByCode(code)) return false;
  const db = getDb();
  try {
    db.prepare("INSERT INTO achievements (user_id, code, unlocked_at) VALUES (?, ?, ?)").run(userId, code, nowIso());
    return true;
  } catch {
    return false;
  }
}

export function listAchievements(userId: string): { code: string; unlocked_at: string }[] {
  return getDb()
    .prepare("SELECT code, unlocked_at FROM achievements WHERE user_id = ?")
    .all(userId) as { code: string; unlocked_at: string }[];
}

export function achievementCatalogWithStatus(userId: string) {
  const unlocked = new Map(listAchievements(userId).map((a) => [a.code, a.unlocked_at]));
  return ACHIEVEMENTS.map((a) => ({ ...a, unlockedAt: unlocked.get(a.code) ?? null }));
}

/** Concede conquistas baseadas em contagens — idempotente pela tabela achievements. */
export function checkCountAchievements(userId: string): string[] {
  const db = getDb();
  const unlocked: string[] = [];
  const counts = {
    sessions: (db.prepare("SELECT COUNT(*) c FROM study_sessions WHERE user_id = ? AND status IN ('concluida','parcial')").get(userId) as { c: number }).c,
    reviews: (db.prepare("SELECT COUNT(*) c FROM review_history WHERE user_id = ?").get(userId) as { c: number }).c,
    simulated: (db.prepare("SELECT COUNT(*) c FROM quiz_attempts WHERE user_id = ? AND finished_at IS NOT NULL").get(userId) as { c: number }).c,
    materials: (db.prepare("SELECT COUNT(*) c FROM materials WHERE user_id = ? AND archived = 0").get(userId) as { c: number }).c,
  };
  if (counts.sessions >= 1 && unlockAchievement(userId, "primeira_sessao")) unlocked.push("primeira_sessao");
  if (counts.sessions >= 10 && unlockAchievement(userId, "dez_sessoes")) unlocked.push("dez_sessoes");
  if (counts.reviews >= 1 && unlockAchievement(userId, "primeira_revisao")) unlocked.push("primeira_revisao");
  if (counts.simulated >= 1 && unlockAchievement(userId, "primeiro_simulado")) unlocked.push("primeiro_simulado");
  if (counts.materials >= 5 && unlockAchievement(userId, "cinco_materiais")) unlocked.push("cinco_materiais");
  return unlocked;
}

export function gamificationSummary(userId: string, streak: number) {
  const xp = getXp(userId);
  if (streak >= 3 && xp > 0) unlockAchievement(userId, "sequencia_3");
  if (streak >= 7 && xp > 0) unlockAchievement(userId, "sequencia_7");
  return {
    xp,
    achievements: achievementCatalogWithStatus(userId),
    streak,
  };
}
