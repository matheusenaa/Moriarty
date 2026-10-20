import { getDb, nowIso, uid } from "../db";

export type ProfileRow = {
  user_id: string;
  username: string;
  display_name: string;
  timezone: string;
  gamification_enabled: number;
  reminders_enabled: number;
  onboarded: number;
};

export function getProfile(userId: string): ProfileRow | null {
  const db = getDb();
  return (db.prepare("SELECT * FROM profiles WHERE user_id = ?").get(userId) as ProfileRow) ?? null;
}

export function updateProfile(
  userId: string,
  data: { displayName?: string; timezone?: string; gamificationEnabled?: boolean; remindersEnabled?: boolean },
): void {
  const db = getDb();
  const current = getProfile(userId);
  if (!current) throw new Error("Perfil não encontrado.");
  db.prepare(
    `UPDATE profiles SET display_name = ?, timezone = ?, gamification_enabled = ?, reminders_enabled = ? WHERE user_id = ?`,
  ).run(
    data.displayName ?? current.display_name,
    data.timezone ?? current.timezone,
    (data.gamificationEnabled ?? current.gamification_enabled === 1) ? 1 : 0,
    (data.remindersEnabled ?? current.reminders_enabled === 1) ? 1 : 0,
    userId,
  );
}

export function markOnboarded(userId: string): void {
  getDb().prepare("UPDATE profiles SET onboarded = 1 WHERE user_id = ?").run(userId);
}

export function usernameTaken(username: string): boolean {
  return !!getDb().prepare("SELECT 1 FROM profiles WHERE username = ?").get(username);
}

export function findUserByUsername(username: string): { id: string; username: string; display_name: string } | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT u.id, p.username, p.display_name
         FROM profiles p JOIN users u ON u.id = p.user_id
        WHERE p.username = ? AND u.deleted_at IS NULL`,
    )
    .get(username) as { id: string; username: string; display_name: string } | undefined;
  return row ?? null;
}

export function createUser(email: string, passwordHash: string): string {
  const db = getDb();
  const id = uid();
  db.transaction(() => {
    db.prepare("INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)").run(
      id,
      email,
      passwordHash,
      nowIso(),
    );
    db.prepare(
      `INSERT INTO profiles (user_id, username, display_name, timezone, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(id, `estudante${id.slice(0, 6)}`, "Estudante", "America/Sao_Paulo", nowIso());
  })();
  return id;
}

export function setInitialUsername(userId: string, username: string, displayName: string): void {
  getDb()
    .prepare("UPDATE profiles SET username = ?, display_name = ? WHERE user_id = ?")
    .run(username, displayName, userId);
}

export function getUserAuth(userId: string): { id: string; email: string; password_hash: string } | null {
  const db = getDb();
  const row = db
    .prepare("SELECT id, email, password_hash FROM users WHERE id = ? AND deleted_at IS NULL")
    .get(userId) as { id: string; email: string; password_hash: string } | undefined;
  return row ?? null;
}

export function findUserByEmail(email: string): { id: string; email: string; password_hash: string } | null {
  const db = getDb();
  const row = db
    .prepare("SELECT id, email, password_hash FROM users WHERE email = ? AND deleted_at IS NULL")
    .get(email) as { id: string; email: string; password_hash: string } | undefined;
  return row ?? null;
}

export function updatePassword(userId: string, passwordHash: string): void {
  getDb().prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(passwordHash, userId);
}

export function softDeleteUser(userId: string): void {
  const db = getDb();
  const now = nowIso();
  db.transaction(() => {
    db.prepare("UPDATE users SET deleted_at = ?, email = email || '.excluido.' || ? WHERE id = ?").run(now, uid().slice(0, 8), userId);
    db.prepare("DELETE FROM profiles WHERE user_id = ?").run(userId);
  })();
}

export function createPasswordReset(userId: string, tokenHash: string, expiresAt: string): void {
  getDb()
    .prepare(
      "INSERT INTO password_resets (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)",
    )
    .run(uid(), userId, tokenHash, expiresAt, nowIso());
}

export function consumePasswordReset(tokenHash: string): { user_id: string } | null {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT user_id FROM password_resets WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?",
    )
    .get(tokenHash, nowIso()) as { user_id: string } | undefined;
  if (!row) return null;
  db.prepare("UPDATE password_resets SET used_at = ? WHERE token_hash = ?").run(nowIso(), tokenHash);
  return row;
}
