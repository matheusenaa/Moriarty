import { execute, nowIso, query, queryOne, uid, withTransaction } from "../db";
import type { UserStatus } from "../user-status";

/** Status tipo MSN do usuário. */
export type { UserStatus };

export type ProfileRow = {
  user_id: string;
  username: string;
  display_name: string;
  timezone: string;
  gamification_enabled: number;
  reminders_enabled: number;
  onboarded: number;
  photo_url: string | null;
  custom_phrase: string | null;
  user_status: UserStatus;
};

export type ChatMessageRow = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

export function getProfile(userId: string): Promise<ProfileRow | null> {
  return queryOne<ProfileRow>("SELECT * FROM profiles WHERE user_id = $1", [userId]);
}

export async function updateProfile(
  userId: string,
  data: {
    displayName?: string;
    timezone?: string;
    gamificationEnabled?: boolean;
    remindersEnabled?: boolean;
    customPhrase?: string | null;
    userStatus?: UserStatus;
  },
): Promise<void> {
  const current = await getProfile(userId);
  if (!current) throw new Error("Perfil não encontrado.");
  await execute(
    `UPDATE profiles
       SET display_name = $1, timezone = $2, gamification_enabled = $3, reminders_enabled = $4,
           custom_phrase = $5, user_status = $6
     WHERE user_id = $7`,
    [
      data.displayName ?? current.display_name,
      data.timezone ?? current.timezone,
      (data.gamificationEnabled ?? current.gamification_enabled === 1) ? 1 : 0,
      (data.remindersEnabled ?? current.reminders_enabled === 1) ? 1 : 0,
      data.customPhrase ?? current.custom_phrase,
      data.userStatus ?? current.user_status,
      userId,
    ],
  );
}

/** Atualiza apenas a foto do perfil (URL do Supabase Storage). */
export async function updateProfilePhoto(userId: string, photoUrl: string): Promise<void> {
  await execute("UPDATE profiles SET photo_url = $1 WHERE user_id = $2", [photoUrl, userId]);
}

/** Define a frase personalizada do perfil. */
export async function updateProfilePhrase(userId: string, phrase: string | null): Promise<void> {
  await execute("UPDATE profiles SET custom_phrase = $1 WHERE user_id = $2", [phrase, userId]);
}

/** Define o status tipo MSN do usuário. */
export async function updateUserStatus(userId: string, status: UserStatus): Promise<void> {
  await execute("UPDATE profiles SET user_status = $1 WHERE user_id = $2", [status, userId]);
}

export async function markOnboarded(userId: string): Promise<void> {
  await execute("UPDATE profiles SET onboarded = 1 WHERE user_id = $1", [userId]);
}

export async function usernameTaken(username: string): Promise<boolean> {
  const row = await queryOne("SELECT 1 FROM profiles WHERE lower(username) = lower($1)", [username]);
  return !!row;
}

export async function findUserByUsername(
  username: string,
): Promise<{ id: string; username: string; display_name: string } | null> {
  return queryOne<{ id: string; username: string; display_name: string }>(
    `SELECT u.id, p.username, p.display_name
       FROM profiles p JOIN users u ON u.id = p.user_id
      WHERE lower(p.username) = lower($1) AND u.deleted_at IS NULL`,
    [username],
  );
}

export async function createUser(email: string, passwordHash: string): Promise<string> {
  const id = uid();
  const now = nowIso();
  await withTransaction(async (client) => {
    await client.query("INSERT INTO users (id, email, password_hash, created_at) VALUES ($1, $2, $3, $4)", [
      id,
      email,
      passwordHash,
      now,
    ]);
    await client.query(
      `INSERT INTO profiles (user_id, username, display_name, timezone, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, `estudante${id.slice(0, 6)}`, "Estudante", "America/Sao_Paulo", now],
    );
  });
  return id;
}

export async function setInitialUsername(
  userId: string,
  username: string,
  displayName: string,
): Promise<void> {
  await execute("UPDATE profiles SET username = $1, display_name = $2 WHERE user_id = $3", [
    username,
    displayName,
    userId,
  ]);
}

export function getUserAuth(
  userId: string,
): Promise<{ id: string; email: string; password_hash: string } | null> {
  return queryOne<{ id: string; email: string; password_hash: string }>(
    "SELECT id, email, password_hash FROM users WHERE id = $1 AND deleted_at IS NULL",
    [userId],
  );
}

export function findUserByEmail(
  email: string,
): Promise<{ id: string; email: string; password_hash: string } | null> {
  return queryOne<{ id: string; email: string; password_hash: string }>(
    "SELECT id, email, password_hash FROM users WHERE lower(email) = lower($1) AND deleted_at IS NULL",
    [email],
  );
}

export async function updatePassword(userId: string, passwordHash: string): Promise<void> {
  await execute("UPDATE users SET password_hash = $1 WHERE id = $2", [passwordHash, userId]);
}

export async function softDeleteUser(userId: string): Promise<void> {
  const now = nowIso();
  await withTransaction(async (client) => {
    await client.query("UPDATE users SET deleted_at = $1, email = email || '.excluido.' || $2 WHERE id = $3", [
      now,
      uid().slice(0, 8),
      userId,
    ]);
    await client.query("DELETE FROM profiles WHERE user_id = $1", [userId]);
  });
}

export async function physicalDeleteUser(userId: string): Promise<void> {
  await withTransaction(async (client) => {
    await client.query("DELETE FROM users WHERE id = $1", [userId]);
  });
}

export async function createPasswordReset(
  userId: string,
  tokenHash: string,
  expiresAt: string,
): Promise<void> {
  await execute(
    "INSERT INTO password_resets (id, user_id, token_hash, expires_at, created_at) VALUES ($1, $2, $3, $4, $5)",
    [uid(), userId, tokenHash, expiresAt, nowIso()],
  );
}

export async function consumePasswordReset(tokenHash: string): Promise<{ user_id: string } | null> {
  const row = await queryOne<{ user_id: string }>(
    "SELECT user_id FROM password_resets WHERE token_hash = $1 AND used_at IS NULL AND expires_at > $2",
    [tokenHash, nowIso()],
  );
  if (!row) return null;
  await execute("UPDATE password_resets SET used_at = $1 WHERE token_hash = $2", [nowIso(), tokenHash]);
  return row;
}

/** Verdadeiro quando os dois usuários são amigos e não há bloqueio entre eles. */
export async function canChat(userId: string, otherUserId: string): Promise<boolean> {
  if (!userId || !otherUserId || userId === otherUserId) return false;
  const [a, b] = userId < otherUserId ? [userId, otherUserId] : [otherUserId, userId];
  const friend = await queryOne("SELECT 1 FROM friendships WHERE user_a = $1 AND user_b = $2", [a, b]);
  if (!friend) return false;
  const blocked = await queryOne(
    `SELECT 1 FROM blocks
      WHERE (blocker = $1 AND blocked = $2) OR (blocker = $2 AND blocked = $1)`,
    [userId, otherUserId],
  );
  return !blocked;
}

/** Envia uma mensagem de chat para um amigo. */
export async function sendChatMessage(
  fromUserId: string,
  toUserId: string,
  body: string,
): Promise<string> {
  const id = uid();
  const now = nowIso();
  await execute(
    "INSERT INTO chat_messages (id, from_user_id, to_user_id, body, created_at) VALUES ($1,$2,$3,$4,$5)",
    [id, fromUserId, toUserId, body, now],
  );
  return id;
}

/** Busca mensagens de uma conversa (paginado, mais recentes primeiro). */
export async function getChatMessages(
  userId: string,
  otherUserId: string,
  limit = 50,
  before?: string,
): Promise<ChatMessageRow[]> {
  const limite = Math.min(Math.max(Math.trunc(limit) || 50, 1), 100);
  const params: (string | number)[] = [userId, otherUserId, otherUserId, userId];
  let sql = `
    SELECT * FROM chat_messages
    WHERE ((from_user_id = $1 AND to_user_id = $2) OR (from_user_id = $3 AND to_user_id = $4))
  `;
  if (before) {
    params.push(before);
    sql += ` AND created_at < $${params.length}`;
  }
  params.push(limite);
  sql += ` ORDER BY created_at DESC LIMIT $${params.length}`;
  return query<ChatMessageRow>(sql, params);
}

/** Marca mensagens de uma conversa como lidas. */
export async function markChatMessagesRead(userId: string, fromUserId: string): Promise<void> {
  await execute(
    `UPDATE chat_messages SET read_at = $1
      WHERE to_user_id = $2 AND from_user_id = $3 AND read_at IS NULL`,
    [nowIso(), userId, fromUserId],
  );
}

/** Conta mensagens não lidas de um remetente específico. */
export async function countUnreadFrom(userId: string, fromUserId: string): Promise<number> {
  const row = await queryOne<{ cnt: number }>(
    "SELECT COUNT(*) AS cnt FROM chat_messages WHERE to_user_id = $1 AND from_user_id = $2 AND read_at IS NULL",
    [userId, fromUserId],
  );
  return Number(row?.cnt ?? 0);
}

/** Conta total de mensagens não lidas (para badge no menu). */
export async function countTotalUnread(userId: string): Promise<number> {
  const row = await queryOne<{ cnt: number }>(
    "SELECT COUNT(*) AS cnt FROM chat_messages WHERE to_user_id = $1 AND read_at IS NULL",
    [userId],
  );
  return Number(row?.cnt ?? 0);
}
