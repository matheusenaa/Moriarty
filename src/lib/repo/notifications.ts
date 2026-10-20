import { getDb, nowIso, uid } from "../db";

export type ReminderRow = {
  id: string;
  kind: string;
  time_minute: number;
  days_json: string;
  enabled: number;
};

export function listReminders(userId: string): ReminderRow[] {
  return getDb().prepare("SELECT * FROM reminders WHERE user_id = ?").all(userId) as ReminderRow[];
}

export function upsertReminder(userId: string, kind: "revisao" | "sessao", timeMinute: number, days: number[], enabled: boolean): void {
  getDb()
    .prepare(
      `INSERT INTO reminders (id, user_id, kind, time_minute, days_json, enabled, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (user_id, kind) DO UPDATE SET time_minute = excluded.time_minute, days_json = excluded.days_json, enabled = excluded.enabled`,
    )
    .run(uid(), userId, kind, timeMinute, JSON.stringify(days), enabled ? 1 : 0, nowIso());
}

export type NotificationRow = {
  id: string;
  kind: string;
  title: string;
  body: string;
  date: string;
  read_at: string | null;
};

/** Lembretes internos (não usamos notificação de navegador como garantia). */
export function listNotifications(userId: string, limit = 30): NotificationRow[] {
  return getDb()
    .prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY date DESC LIMIT ?")
    .all(userId, limit) as NotificationRow[];
}

/** Insere notificação deduplicada por dia+chave: não repete o mesmo aviso no mesmo dia. */
export function pushNotification(userId: string, kind: string, title: string, body: string, date: string): boolean {
  const dedupe = `${kind}:${date}`;
  try {
    getDb()
      .prepare(
        "INSERT INTO notifications (id, user_id, kind, title, body, date, dedupe_key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run(uid(), userId, kind, title, body, date, dedupe, nowIso());
    return true;
  } catch {
    return false;
  }
}

export function markNotificationRead(userId: string, id: string): void {
  getDb().prepare("UPDATE notifications SET read_at = ? WHERE id = ? AND user_id = ?").run(nowIso(), id, userId);
}

/** Gera lembretes do dia: revisões vencidas/hoje e sessões de hoje. */
export function generateDailyReminders(userId: string, today: string): void {
  const db = getDb();
  const overdue = (
    db
      .prepare("SELECT COUNT(*) c FROM review_items WHERE user_id = ? AND state != 'concluida' AND due_date < ?")
      .get(userId, today) as { c: number }
  ).c;
  const dueToday = (
    db
      .prepare("SELECT COUNT(*) c FROM review_items WHERE user_id = ? AND state != 'concluida' AND due_date = ?")
      .get(userId, today) as { c: number }
  ).c;
  const sessions = (
    db
      .prepare("SELECT COUNT(*) c FROM study_sessions WHERE user_id = ? AND date = ? AND status = 'planejada'")
      .get(userId, today) as { c: number }
  ).c;

  if (overdue > 0) {
    pushNotification(userId, "revisao_atrasada", "Revisões atrasadas", `${overdue} revisão(ões) vencida(s). Recupere a fila em Revisões.`, today);
  }
  if (dueToday > 0) {
    pushNotification(userId, "revisao_hoje", "Revisões para hoje", `${dueToday} revisão(ões) vencem hoje.`, today);
  }
  if (sessions > 0) {
    pushNotification(userId, "sessoes_hoje", "Sessões de hoje", `Você tem ${sessions} sessão(ões) planejada(s) para hoje.`, today);
  }
}
