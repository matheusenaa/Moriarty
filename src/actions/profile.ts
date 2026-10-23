"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  getProfile,
  updateProfile,
  updateProfilePhoto,
  updateProfilePhrase,
  updateUserStatus,
} from "@/lib/repo/profile";
import { upsertReminder, listReminders, markNotificationRead, markAllNotificationsRead } from "@/lib/repo/notifications";
import { parseHHMM } from "@/lib/dates";
import { uid } from "@/lib/db";
import { removerArquivo, salvarArquivo } from "@/lib/storage";
import { USER_STATUSES, type UserStatus } from "@/lib/user-status";
import type { ActionState } from "./auth";
export type { ActionState };

const profileSchema = z.object({
  displayName: z.string().min(2, "Informe seu nome.").max(60),
  timezone: z.string().min(3).max(60),
  gamificationEnabled: z.coerce.boolean(),
  remindersEnabled: z.coerce.boolean(),
});

export async function saveProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({
    displayName: String(formData.get("displayName") ?? "").trim(),
    timezone: String(formData.get("timezone") ?? user.timezone),
    gamificationEnabled: formData.get("gamificationEnabled") === "on" || formData.get("gamificationEnabled") === "true",
    remindersEnabled: formData.get("remindersEnabled") === "on" || formData.get("remindersEnabled") === "true",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  await updateProfile(user.id, parsed.data);
  revalidatePath("/perfil");
  revalidatePath("/central");
  return { ok: true, message: "Preferências salvas." };
}

export async function updateProfilePhotoAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) return { ok: false, error: "Selecione uma imagem." };
  if (file.size > 4 * 1024 * 1024) return { ok: false, error: "Arquivo excede o limite de 4 MB." };
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) return { ok: false, error: "Formato inválido. Use JPG, PNG ou WebP." };

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
  const destino = `${user.id}/avatar-${uid().slice(0, 8)}.${ext}`;
  const resultado = await salvarArquivo(destino, buffer, file.type);
  if (!resultado.ok) return { ok: false, error: resultado.erro ?? "Falha no upload." };

  const atual = await getProfile(user.id);
  if (atual?.photo_url && atual.photo_url !== destino) {
    await removerArquivo(atual.photo_url);
  }

  await updateProfilePhoto(user.id, destino);
  revalidatePath("/perfil");
  revalidatePath("/amigos");
  return { ok: true, message: "Foto atualizada." };
}

export async function updateProfilePhraseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const phrase = String(formData.get("phrase") ?? "").trim();
  if (phrase.length > 200) return { ok: false, error: "A frase deve ter no máximo 200 caracteres." };
  await updateProfilePhrase(user.id, phrase || null);
  revalidatePath("/perfil");
  revalidatePath("/amigos");
  return { ok: true, message: "Frase atualizada." };
}

export async function updateUserStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const status = String(formData.get("status") ?? "") as UserStatus;
  if (!(USER_STATUSES as readonly string[]).includes(status)) return { ok: false, error: "Status inválido." };
  await updateUserStatus(user.id, status);
  revalidatePath("/perfil");
  revalidatePath("/amigos");
  revalidatePath("/central");
  return { ok: true, message: "Status atualizado." };
}

export async function saveReminderAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const kind = String(formData.get("kind") ?? "") as "revisao" | "sessao";
  if (!["revisao", "sessao"].includes(kind)) return { ok: false, error: "Tipo de lembrete inválido." };
  const time = parseHHMM(String(formData.get("time") ?? "09:00"));
  if (time === null) return { ok: false, error: "Horário inválido." };
  const days = String(formData.get("days") ?? "0,1,2,3,4,5,6")
    .split(",")
    .map((d) => Number(d.trim()))
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
  await upsertReminder(user.id, kind, time, days.length > 0 ? days : [0, 1, 2, 3, 4, 5, 6], formData.get("enabled") === "on");
  revalidatePath("/perfil");
  revalidatePath("/central");
  return {
    ok: true,
    message:
      "Lembrete salvo. O aviso aparece no sino da plataforma perto do horário escolhido (não é notificação de navegador).",
  };
}

export async function getReminders(userId: string) {
  return listReminders(userId);
}

export async function markNotificationReadAction(id: string): Promise<void> {
  const user = await requireUser();
  await markNotificationRead(user.id, id);
  revalidatePath("/", "layout");
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const user = await requireUser();
  await markAllNotificationsRead(user.id);
  revalidatePath("/", "layout");
}

export type ExportData = Record<string, unknown>;

export async function exportDataAction(): Promise<ActionState & { data?: ExportData }> {
  const user = await requireUser();
  const { query } = await import("@/lib/db");
  const dump: ExportData = {
    exportado_em: new Date().toISOString(),
    usuario: { id: user.id, email: user.email, username: user.username, displayName: user.displayName },
    objetivos: await query("SELECT * FROM study_goals WHERE user_id = $1", [user.id]),
    materias: await query("SELECT * FROM subjects WHERE user_id = $1", [user.id]),
    topicos: await query("SELECT * FROM topics WHERE user_id = $1", [user.id]),
    disponibilidade: await query("SELECT * FROM availability_slots WHERE user_id = $1", [user.id]),
    sessoes: await query("SELECT * FROM study_sessions WHERE user_id = $1", [user.id]),
    revisoes: await query("SELECT * FROM review_items WHERE user_id = $1", [user.id]),
    historico_revisoes: await query("SELECT * FROM review_history WHERE user_id = $1", [user.id]),
    materiais: await query("SELECT * FROM materials WHERE user_id = $1", [user.id]),
    tags: await query("SELECT * FROM material_tags WHERE user_id = $1", [user.id]),
    questoes: await query("SELECT * FROM questions WHERE user_id = $1", [user.id]),
    simulados: await query("SELECT * FROM quizzes WHERE user_id = $1", [user.id]),
    tentativas: await query("SELECT * FROM quiz_attempts WHERE user_id = $1", [user.id]),
    respostas: await query("SELECT * FROM quiz_answers WHERE user_id = $1", [user.id]),
    xp: await query("SELECT * FROM xp_events WHERE user_id = $1", [user.id]),
    conquistas: await query("SELECT * FROM achievements WHERE user_id = $1", [user.id]),
  };
  return { ok: true, message: "Exportação gerada. Baixe o JSON pela tela de perfil.", data: dump };
}
