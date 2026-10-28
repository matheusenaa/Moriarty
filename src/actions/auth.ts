"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "crypto";
import { hashPassword, validatePasswordStrength, verifyPassword } from "@/lib/password";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";
import { identificadorIp, ipDoRequisicao } from "@/lib/request";
import {
  checarLimite,
  limparBucket,
  mensagemLimite,
  registrarTentativa,
} from "@/lib/rate-limit";
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

/** Limites anti-abuso (ver docs/SEGURANCA.md). */
const LIMITE = {
  loginPorConta: 10, // falhas por conta em 15 min
  loginPorIp: 30, // falhas por IP em 15 min
  cadastroPorIp: 5, // cadastros por IP em 1 h
  recuperacaoPorEmail: 3, // pedidos por e-mail em 1 h
  recuperacaoPorIp: 10, // pedidos por IP em 1 h
};

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
  // Anti-abuso: no máximo 5 cadastros por IP em 1 hora.
  const ip = identificadorIp(await ipDoRequisicao());
  const limite = await checarLimite("cadastro", ip, LIMITE.cadastroPorIp);
  if (limite.bloqueado) return { ok: false, error: mensagemLimite("cadastro") };
  if (!parsed.success) {
    await registrarTentativa("cadastro", ip);
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const strength = validatePasswordStrength(parsed.data.password);
  if (!strength.ok) {
    await registrarTentativa("cadastro", ip);
    return { ok: false, error: strength.message };
  }
  if (await findUserByEmail(parsed.data.email)) {
    await registrarTentativa("cadastro", ip);
    // Mensagem genérica para dificultar enumeração de contas.
    return { ok: false, error: "Não foi possível concluir o cadastro. Verifique os dados informados." };
  }
  if (await usernameTaken(parsed.data.username)) {
    await registrarTentativa("cadastro", ip);
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

  // Anti-abuso: 10 falhas por conta e 30 por IP em 15 minutos.
  const ip = identificadorIp(await ipDoRequisicao());
  const [limiteConta, limiteIp] = await Promise.all([
    checarLimite("login", parsed.data.email, LIMITE.loginPorConta),
    checarLimite("login", ip, LIMITE.loginPorIp),
  ]);
  if (limiteConta.bloqueado || limiteIp.bloqueado) {
    return { ok: false, error: mensagemLimite("login") };
  }

  const user = await findUserByEmail(parsed.data.email);
  if (!user || !(await verifyPassword(parsed.data.password, user.password_hash))) {
    await registrarTentativa("login", parsed.data.email);
    await registrarTentativa("login", ip);
    return { ok: false, error: "E-mail ou senha incorretos." };
  }
  await limparBucket("login", parsed.data.email);
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

  // Anti-abuso: 3 pedidos por e-mail e 10 por IP em 1 hora (protege o envio de e-mail).
  const ip = identificadorIp(await ipDoRequisicao());
  const [limiteEmail, limiteIp] = await Promise.all([
    checarLimite("recuperacao", parsed.data.email, LIMITE.recuperacaoPorEmail),
    checarLimite("recuperacao", ip, LIMITE.recuperacaoPorIp),
  ]);
  if (limiteEmail.bloqueado || limiteIp.bloqueado) {
    return { ok: false, error: mensagemLimite("recuperacao") };
  }
  await registrarTentativa("recuperacao", parsed.data.email);
  await registrarTentativa("recuperacao", ip);

  const user = await findUserByEmail(parsed.data.email);
  // Resposta idêntica exista ou não a conta: não revela se o e-mail está cadastrado.
  const resposta = {
    ok: true,
    message: "Se o e-mail existir, enviamos o link de recuperação para ele.",
  };
  if (!user) return resposta;

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 30).toISOString();
  await createPasswordReset(user.id, tokenHash, expires);

  const { emailConfigurado, enviarEmail, htmlRecuperacaoSenha, linkRecuperacao } = await import(
    "@/lib/email"
  );
  if (emailConfigurado()) {
    const link = linkRecuperacao(token);
    const envio = await enviarEmail({
      para: user.email,
      assunto: "Recuperação de senha — Moriarty",
      html: htmlRecuperacaoSenha(link),
      texto: `Recebemos um pedido para redefinir a senha da sua conta no Moriarty. Redefina em: ${link} (válido por 30 minutos).`,
    });
    if (envio.ok) {
      console.info(`[recuperacao] e-mail enviado para ${user.email} (id ${envio.id})`);
      return resposta;
    }
    console.error(`[recuperacao] falha no envio de e-mail: ${envio.erro}`);
    return {
      ok: true,
      message:
        "Se o e-mail existir, enviamos o link de recuperação para ele. Não conseguimos entregar agora — tente novamente em alguns minutos.",
    };
  }

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

/** Exclusão FÍSICA (LGPD) — irreversível, remove todos os dados do usuário. */
export async function physicalDeleteAccountAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = String(formData.get("userId") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (confirm !== "EXCLUIR DEFINITIVAMENTE") {
    return { ok: false, error: 'Digite EXCLUIR DEFINITIVAMENTE para confirmar a exclusão permanente (LGPD).' };
  }
  const { physicalDeleteUser } = await import("@/lib/repo/profile");
  const { readSession } = await import("@/lib/session");
  const session = await readSession();
  if (!session || session.sub !== userId) {
    return { ok: false, error: "Sessão inválida." };
  }
  await physicalDeleteUser(userId);
  await clearSessionCookie();
  redirect("/entrar");
}
