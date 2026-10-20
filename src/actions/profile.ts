"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { updateProfile } from "@/lib/repo/profile";
import { upsertReminder, listReminders, markNotificationRead } from "@/lib/repo/notifications";
import { parseHHMM } from "@/lib/dates";
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
  updateProfile(user.id, parsed.data);
  revalidatePath("/perfil");
  revalidatePath("/central");
  return { ok: true, message: "Preferências salvas." };
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
  upsertReminder(user.id, kind, time, days.length > 0 ? days : [0, 1, 2, 3, 4, 5, 6], formData.get("enabled") === "on");
  revalidatePath("/perfil");
  return { ok: true, message: "Lembrete salvo. Ele aparece na plataforma; não prometemos notificação do navegador." };
}

export async function getReminders(userId: string) {
  return listReminders(userId);
}

export async function markNotificationReadAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  markNotificationRead(user.id, String(formData.get("id") ?? ""));
  revalidatePath("/central");
}

export type ExportData = Record<string, unknown>;

export async function exportDataAction(): Promise<ActionState & { data?: ExportData }> {
  const user = await requireUser();
  const { getDb } = await import("@/lib/db");
  const db = getDb();
  const dump: ExportData = {
    exportado_em: new Date().toISOString(),
    usuario: { id: user.id, email: user.email, username: user.username, displayName: user.displayName },
    objetivos: db.prepare("SELECT * FROM study_goals WHERE user_id = ?").all(user.id),
    materias: db.prepare("SELECT * FROM subjects WHERE user_id = ?").all(user.id),
    topicos: db.prepare("SELECT * FROM topics WHERE user_id = ?").all(user.id),
    disponibilidade: db.prepare("SELECT * FROM availability_slots WHERE user_id = ?").all(user.id),
    sessoes: db.prepare("SELECT * FROM study_sessions WHERE user_id = ?").all(user.id),
    revisoes: db.prepare("SELECT * FROM review_items WHERE user_id = ?").all(user.id),
    historico_revisoes: db.prepare("SELECT * FROM review_history WHERE user_id = ?").all(user.id),
    materiais: db.prepare("SELECT * FROM materials WHERE user_id = ?").all(user.id),
    tags: db.prepare("SELECT * FROM material_tags WHERE user_id = ?").all(user.id),
    questoes: db.prepare("SELECT * FROM questions WHERE user_id = ?").all(user.id),
    simulados: db.prepare("SELECT * FROM quizzes WHERE user_id = ?").all(user.id),
    tentativas: db.prepare("SELECT * FROM quiz_attempts WHERE user_id = ?").all(user.id),
    respostas: db.prepare("SELECT * FROM quiz_answers WHERE user_id = ?").all(user.id),
    xp: db.prepare("SELECT * FROM xp_events WHERE user_id = ?").all(user.id),
    conquistas: db.prepare("SELECT * FROM achievements WHERE user_id = ?").all(user.id),
  };
  return { ok: true, message: "Exportação gerada. Baixe o JSON pela tela de perfil.", data: dump };
}
