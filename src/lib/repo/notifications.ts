import { execute, nowIso, query, queryOne, uid } from "../db";

const UNIQUE_VIOLATION = "23505";

export type ReminderRow = {
  id: string;
  kind: string;
  time_minute: number;
  days_json: string;
  enabled: number;
};

export function listReminders(userId: string): Promise<ReminderRow[]> {
  return query<ReminderRow>("SELECT * FROM reminders WHERE user_id = $1", [userId]);
}

export async function upsertReminder(
  userId: string,
  kind: "revisao" | "sessao",
  timeMinute: number,
  days: number[],
  enabled: boolean,
): Promise<void> {
  await execute(
    `INSERT INTO reminders (id, user_id, kind, time_minute, days_json, enabled, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id, kind) DO UPDATE SET time_minute = excluded.time_minute, days_json = excluded.days_json, enabled = excluded.enabled`,
    [uid(), userId, kind, timeMinute, JSON.stringify(days), enabled ? 1 : 0, nowIso()],
  );
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
export function listNotifications(userId: string, limit = 30): Promise<NotificationRow[]> {
  return query<NotificationRow>(
    "SELECT * FROM notifications WHERE user_id = $1 ORDER BY date DESC LIMIT $2",
    [userId, limit],
  );
}

/** Insere notificação deduplicada por dia+chave: não repete o mesmo aviso no mesmo dia. */
export async function pushNotification(
  userId: string,
  kind: string,
  title: string,
  body: string,
  date: string,
): Promise<boolean> {
  const dedupe = `${kind}:${date}`;
  try {
    await execute(
      "INSERT INTO notifications (id, user_id, kind, title, body, date, dedupe_key, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [uid(), userId, kind, title, body, date, dedupe, nowIso()],
    );
    return true;
  } catch (err) {
    if ((err as { code?: string }).code === UNIQUE_VIOLATION) return false;
    throw err;
  }
}

export async function markNotificationRead(userId: string, id: string): Promise<void> {
  await execute("UPDATE notifications SET read_at = $1 WHERE id = $2 AND user_id = $3", [
    nowIso(),
    id,
    userId,
  ]);
}

/** Marca todas as notificações não lidas do usuário como lidas. */
export async function markAllNotificationsRead(userId: string): Promise<number> {
  return execute(
    "UPDATE notifications SET read_at = $1 WHERE user_id = $2 AND read_at IS NULL",
    [nowIso(), userId],
  );
}

/** Gera lembretes do dia: revisões vencidas/hoje e sessões de hoje. */
export async function generateDailyReminders(userId: string, today: string): Promise<void> {
  const count = async (sql: string, params: unknown[]) => {
    const row = await queryOne<{ c: string }>(sql, params);
    return Number(row?.c ?? 0);
  };
  const overdue = await count(
    "SELECT COUNT(*) c FROM review_items WHERE user_id = $1 AND state != 'concluida' AND due_date < $2",
    [userId, today],
  );
  const dueToday = await count(
    "SELECT COUNT(*) c FROM review_items WHERE user_id = $1 AND state != 'concluida' AND due_date = $2",
    [userId, today],
  );
  const sessions = await count(
    "SELECT COUNT(*) c FROM study_sessions WHERE user_id = $1 AND date = $2 AND status = 'planejada'",
    [userId, today],
  );

  if (overdue > 0) {
    await pushNotification(userId, "revisao_atrasada", "Revisões atrasadas", `${overdue} revisão(ões) vencida(s). Recupere a fila em Revisões.`, today);
  }
  if (dueToday > 0) {
    await pushNotification(userId, "revisao_hoje", "Revisões para hoje", `${dueToday} revisão(ões) vencem hoje.`, today);
  }
  if (sessions > 0) {
    await pushNotification(userId, "sessoes_hoje", "Sessões de hoje", `Você tem ${sessions} sessão(ões) planejada(s) para hoje.`, today);
  }
}
