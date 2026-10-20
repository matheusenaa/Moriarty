import bcrypt from "bcryptjs";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export type PasswordIssue = { ok: true } | { ok: false; message: string };

export function validatePasswordStrength(password: string): PasswordIssue {
  if (password.length < 8) {
    return { ok: false, message: "A senha precisa ter no mínimo 8 caracteres." };
  }
  if (password.length > 128) {
    return { ok: false, message: "A senha pode ter no máximo 128 caracteres." };
  }
  if (!/[a-zA-ZÀ-ÿ]/.test(password) || !/[0-9]/.test(password)) {
    return { ok: false, message: "Use ao menos uma letra e um número." };
  }
  return { ok: true };
}
