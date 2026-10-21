import { execute, nowIso, queryOne, uid, withTransaction } from "../db";

export type ProfileRow = {
  user_id: string;
  username: string;
  display_name: string;
  timezone: string;
  gamification_enabled: number;
  reminders_enabled: number;
  onboarded: number;
};

export function getProfile(userId: string): Promise<ProfileRow | null> {
  return queryOne<ProfileRow>("SELECT * FROM profiles WHERE user_id = $1", [userId]);
}

export async function updateProfile(
  userId: string,
  data: { displayName?: string; timezone?: string; gamificationEnabled?: boolean; remindersEnabled?: boolean },
): Promise<void> {
  const current = await getProfile(userId);
  if (!current) throw new Error("Perfil não encontrado.");
  await execute(
    `UPDATE profiles SET display_name = $1, timezone = $2, gamification_enabled = $3, reminders_enabled = $4 WHERE user_id = $5`,
    [
      data.displayName ?? current.display_name,
      data.timezone ?? current.timezone,
      (data.gamificationEnabled ?? current.gamification_enabled === 1) ? 1 : 0,
      (data.remindersEnabled ?? current.reminders_enabled === 1) ? 1 : 0,
      userId,
    ],
  );
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
