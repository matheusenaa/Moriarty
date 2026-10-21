/**
 * Regras de administração do Moriarty.
 *
 * O e-mail padrão de admin está fixado abaixo. Também é possível adicionar
 * outros administradores pela variável de ambiente ADMIN_EMAIL (lista separada
 * por vírgula), sem precisar mexer no código.
 */

/** Administradores fixos (sempre ativos, independente de variáveis). */
const ADMINS_FIXOS = ["matheusenaa@gmail.com"];

/** Retorna a lista completa de e-mails admin (fixos + ADMIN_EMAIL da env). */
export function listaAdmins(): string[] {
  const env = (process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const fixos = ADMINS_FIXOS.map((e) => e.trim().toLowerCase());
  return Array.from(new Set([...fixos, ...env]));
}

/** Verifica se um e-mail pertence a um administrador. */
export function ehAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return listaAdmins().includes(email.trim().toLowerCase());
}
