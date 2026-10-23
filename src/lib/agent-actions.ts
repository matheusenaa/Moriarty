import { revalidatePath } from "next/cache";
import { z } from "zod";
import { addDays, isValidDateStr, todayStr } from "./dates";
import { createGoal, createSession, getActiveGoal, getSubject, listSessions } from "./repo/planning";
import { scheduleReview } from "./repo/reviews";
import type { AgentActionKind } from "./agent";

export type ActionResult = { ok: boolean; message: string };

const sessionSchema = z.object({
  date: z.string(),
  startMinute: z.coerce.number().int().min(0).max(1439),
  plannedMinutes: z.coerce.number().int().min(15).max(480),
  subjectId: z.string().min(1),
  kind: z.enum(["estudo", "revisao", "simulado"]),
  notes: z.string().max(1000).optional().default(""),
});

const reviewSchema = z.object({
  title: z.string().min(2).max(160),
  subjectId: z.string().nullable().optional(),
  dueDate: z.string(),
});

const goalSchema = z.object({
  title: z.string().min(2).max(120),
  examName: z.string().max(120).optional().default(""),
  examDate: z.string().nullable().optional(),
  weeklyHoursTarget: z.coerce.number().min(1).max(80),
  sessionMinutes: z.coerce.number().int().min(15).max(480),
});

/**
 * Executa uma ação que o usuário confirmou. Revalida tudo no servidor:
 * matéria pertence ao usuário, datas válidas, sem conflito e sem duplicidade.
 */
export async function applyAgentAction(
  userId: string,
  timezone: string,
  kind: AgentActionKind,
  payload: unknown,
): Promise<ActionResult> {
  const today = todayStr(timezone);

  if (kind === "create_session") {
    const parsed = sessionSchema.safeParse(payload);
    if (!parsed.success) return { ok: false, message: "Dados da sessão inválidos." };
    const d = parsed.data;
    if (!isValidDateStr(d.date) || d.date < today || d.date > addDays(today, 120)) {
      return { ok: false, message: "A data da sessão precisa estar entre hoje e os próximos 120 dias." };
    }
    const subject = await getSubject(userId, d.subjectId);
    if (!subject) return { ok: false, message: "Matéria não encontrada na sua conta." };
    const existing = await listSessions(userId, d.date, d.date);
    const conflict = existing.some(
      (s) =>
        s.status !== "adiada" &&
        s.status !== "nao_realizada" &&
        s.start_minute < d.startMinute + d.plannedMinutes &&
        d.startMinute < s.start_minute + s.planned_minutes,
    );
    if (conflict) return { ok: false, message: "Já existe uma sessão nesse horário. Nada foi alterado." };
    const goal = await getActiveGoal(userId);
    await createSession(userId, {
      goalId: goal?.id ?? null,
      subjectId: d.subjectId,
      topicId: null,
      date: d.date,
      startMinute: d.startMinute,
      plannedMinutes: d.plannedMinutes,
      kind: d.kind,
      notes: d.notes ?? "",
    });
    revalidatePath("/plano");
    revalidatePath("/central");
    return { ok: true, message: `Sessão criada em ${d.date} (${d.plannedMinutes} min).` };
  }

  if (kind === "schedule_review") {
    const parsed = reviewSchema.safeParse(payload);
    if (!parsed.success) return { ok: false, message: "Dados da revisão inválidos." };
    const d = parsed.data;
    if (!isValidDateStr(d.dueDate) || d.dueDate < today || d.dueDate > addDays(today, 365)) {
      return { ok: false, message: "A data da revisão precisa estar entre hoje e os próximos 365 dias." };
    }
    if (d.subjectId) {
      const subject = await getSubject(userId, d.subjectId);
      if (!subject) return { ok: false, message: "Matéria não encontrada na sua conta." };
    }
    await scheduleReview(userId, {
      title: d.title.trim(),
      subjectId: d.subjectId || null,
      sourceType: "manual",
      sourceId: null,
      dueDate: d.dueDate,
    });
    revalidatePath("/revisoes");
    revalidatePath("/central");
    return { ok: true, message: `Revisão “${d.title.trim()}” agendada para ${d.dueDate}.` };
  }

  if (kind === "create_goal") {
    const parsed = goalSchema.safeParse(payload);
    if (!parsed.success) return { ok: false, message: "Dados do objetivo inválidos." };
    const d = parsed.data;
    if (await getActiveGoal(userId)) {
      return { ok: false, message: "Você já tem um objetivo ativo. Edite-o em Meu plano." };
    }
    const examDate = d.examDate && isValidDateStr(d.examDate) ? d.examDate : null;
    if (examDate && examDate < today) return { ok: false, message: "A data da prova não pode estar no passado." };
    await createGoal(userId, {
      title: d.title.trim(),
      examName: (d.examName ?? "").trim(),
      examDate,
      weeklyHoursTarget: d.weeklyHoursTarget,
      sessionMinutes: d.sessionMinutes,
      startDate: today,
      reserveReviews: true,
      reserveSimulated: true,
    });
    revalidatePath("/plano");
    revalidatePath("/materias");
    revalidatePath("/central");
    return { ok: true, message: `Objetivo “${d.title.trim()}” criado.` };
  }

  return { ok: false, message: "Ação desconhecida." };
}
