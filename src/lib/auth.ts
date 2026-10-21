import { queryOne } from "./db";
import { readSession } from "./session";

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  timezone: string;
  gamificationEnabled: boolean;
  remindersEnabled: boolean;
  onboarded: boolean;
};

/** Lê a sessão atual e carrega o perfil. Retorna null se não autenticado. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await readSession();
  if (!session) return null;
  const row = await queryOne<{
    id: string;
    email: string;
    username: string;
    display_name: string;
    timezone: string;
    gamification_enabled: number;
    reminders_enabled: number;
    onboarded: number;
  }>(
    `SELECT u.id, u.email, p.username, p.display_name, p.timezone,
            p.gamification_enabled, p.reminders_enabled, p.onboarded
       FROM users u
       JOIN profiles p ON p.user_id = u.id
      WHERE u.id = $1 AND u.deleted_at IS NULL`,
    [session.sub],
  );
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    displayName: row.display_name,
    timezone: row.timezone,
    gamificationEnabled: row.gamification_enabled === 1,
    remindersEnabled: row.reminders_enabled === 1,
    onboarded: row.onboarded === 1,
  };
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("Sessão expirada ou inexistente. Entre novamente.");
  }
  return user;
}
