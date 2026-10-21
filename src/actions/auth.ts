"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "crypto";
import { hashPassword, validatePasswordStrength, verifyPassword } from "@/lib/password";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";
import {
  consumePasswordReset,
  createPasswordReset,
  createUser,
  findUserByEmail,
  setInitialUsername,
  updatePassword,
  usernameTaken,
} from "@/lib/repo/profile";

export type ActionState = { ok: boolean; error?: string; message?: string; data?: Record<string, unknown> };

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

const registerSchema = z.object({
  email: z.string().email("E-mail inválido."),
  username: z
    .string()
    .regex(USERNAME_RE, "Username: 3 a 20 caracteres, apenas letras minúsculas, números e _."),
  displayName: z.string().min(2, "Informe seu nome de exibição.").max(60),
  password: z.string(),
});

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    username: String(formData.get("username") ?? "").trim().toLowerCase(),
    displayName: String(formData.get("displayName") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const strength = validatePasswordStrength(parsed.data.password);
  if (!strength.ok) return { ok: false, error: strength.message };
  if (await findUserByEmail(parsed.data.email)) {
    // Mensagem genérica para dificultar enumeração de contas.
    return { ok: false, error: "Não foi possível concluir o cadastro. Verifique os dados informados." };
  }
  if (await usernameTaken(parsed.data.username)) {
    return { ok: false, error: "Este username já está em uso. Escolha outro." };
  }
  const hash = await hashPassword(parsed.data.password);
  const userId = await createUser(parsed.data.email, hash);
  await setInitialUsername(userId, parsed.data.username, parsed.data.displayName);
  await setSessionCookie({ sub: userId, username: parsed.data.username });
  redirect("/onboarding");
}

const loginSchema = z.object({
  email: z.string().email("E-mail inválido."),
  password: z.string().min(1, "Informe a senha."),
});

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const user = await findUserByEmail(parsed.data.email);
  if (!user || !(await verifyPassword(parsed.data.password, user.password_hash))) {
    return { ok: false, error: "E-mail ou senha incorretos." };
  }
  const { getProfile } = await import("@/lib/repo/profile");
  const profile = await getProfile(user.id);
  await setSessionCookie({ sub: user.id, username: profile?.username ?? "" });
  redirect(profile?.onboarded ? "/central" : "/onboarding");
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/entrar");
}

const resetRequestSchema = z.object({ email: z.string().email("E-mail inválido.") });

export async function requestResetAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = resetRequestSchema.safeParse({ email: String(formData.get("email") ?? "").trim().toLowerCase() });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const user = await findUserByEmail(parsed.data.email);
  // Sempre responde sucesso: não revela se a conta existe.
  if (!user) return { ok: true, message: "Se o e-mail existir, um link de recuperação foi gerado." };
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 30).toISOString();
  await createPasswordReset(user.id, tokenHash, expires);
  // Sem serviço de e-mail configurado: o token fica pronto para o administrador
  // enviar manualmente. A página de recuperação explica isso.
  console.info(`[recuperacao] token para ${user.email}: ${token}`);
  return {
    ok: true,
    message:
      "Se o e-mail existir, um link de recuperação foi gerado. Sem serviço de e-mail configurado, o token foi registrado no servidor (veja a documentação).",
  };
}

const resetSchema = z.object({
  token: z.string().min(32, "Token inválido."),
  password: z.string(),
});

export async function resetPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = resetSchema.safeParse({
    token: String(formData.get("token") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const strength = validatePasswordStrength(parsed.data.password);
  if (!strength.ok) return { ok: false, error: strength.message };
  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const row = await consumePasswordReset(tokenHash);
  if (!row) return { ok: false, error: "Link inválido ou expirado. Solicite um novo." };
  await updatePassword(row.user_id, await hashPassword(parsed.data.password));
  return { ok: true, message: "Senha alterada. Entre com a nova senha." };
}

export async function deleteAccountAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = String(formData.get("userId") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (confirm !== "EXCLUIR") {
    return { ok: false, error: 'Digite EXCLUIR para confirmar a exclusão da conta.' };
  }
  const { softDeleteUser } = await import("@/lib/repo/profile");
  const { readSession } = await import("@/lib/session");
  const session = await readSession();
  if (!session || session.sub !== userId) {
    return { ok: false, error: "Sessão inválida." };
  }
  await softDeleteUser(userId);
  await clearSessionCookie();
  redirect("/entrar");
}
