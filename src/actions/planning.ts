"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { nowIso } from "@/lib/db";
import { todayStr, addDays, isValidDateStr, parseHHMM, weekStart } from "@/lib/dates";
import {
  addUnavailableDate,
  createActivity,
  createGoal,
  createSession,
  createSubject,
  createTopic,
  deleteActivity,
  deleteSession,
  deleteTimerSession,
  getActivity,
  getTimerSession,
  listActivities,
  listSessions,
  listSubjects,
  listTimerSessions,
  removeUnavailableDate,
  replaceAvailability,
  saveSchedule,
  updateActivity,
  updateGoal,
  updateSession,
  updateSubject,
  updateTimerSession,
} from "@/lib/repo/planning";
import { scheduleReview } from "@/lib/repo/reviews";
import { awardXp, checkCountAchievements } from "@/lib/repo/gamification";
import { generateDailyReminders } from "@/lib/repo/notifications";
import { planSchedule, validatePlannerInput, type PlannerInput } from "@/lib/planner";
import { suggestSchedule } from "@/lib/ai";
import { markOnboarded } from "@/lib/repo/profile";
import type { ActionState } from "./auth";
export type { ActionState };

const goalSchema = z.object({
  title: z.string().min(2, "Informe o nome do objetivo.").max(120),
  examName: z.string().max(120).optional().default(""),
  examDate: z
    .string()
    .optional()
    .transform((v) => (v && isValidDateStr(v) ? v : null)),
  weeklyHoursTarget: z.coerce.number().min(1, "Mínimo 1 hora por semana.").max(80, "Máximo 80h por semana."),
  sessionMinutes: z.coerce.number().min(15, "Mínimo 15 minutos.").max(480, "Máximo 480 minutos."),
  reserveReviews: z.coerce.boolean(),
  reserveSimulated: z.coerce.boolean(),
});

export async function saveGoalAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = goalSchema.safeParse({
    title: String(formData.get("title") ?? "").trim(),
    examName: String(formData.get("examName") ?? "").trim(),
    examDate: String(formData.get("examDate") ?? ""),
    weeklyHoursTarget: formData.get("weeklyHoursTarget"),
    sessionMinutes: formData.get("sessionMinutes"),
    reserveReviews: formData.get("reserveReviews") === "on" || formData.get("reserveReviews") === "true",
    reserveSimulated: formData.get("reserveSimulated") === "on" || formData.get("reserveSimulated") === "true",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const id = String(formData.get("id") ?? "");
  if (id) {
    const updated = await updateGoal(user.id, id, {
      title: parsed.data.title,
      examName: parsed.data.examName ?? "",
      examDate: parsed.data.examDate,
      weeklyHoursTarget: parsed.data.weeklyHoursTarget,
      sessionMinutes: parsed.data.sessionMinutes,
      reserveReviews: parsed.data.reserveReviews,
      reserveSimulated: parsed.data.reserveSimulated,
    });
    if (!updated) return { ok: false, error: "Objetivo não encontrado." };
  } else {
    await createGoal(user.id, {
      title: parsed.data.title,
      examName: parsed.data.examName ?? "",
      examDate: parsed.data.examDate,
      weeklyHoursTarget: parsed.data.weeklyHoursTarget,
      sessionMinutes: parsed.data.sessionMinutes,
      startDate: todayStr(user.timezone),
      reserveReviews: parsed.data.reserveReviews,
      reserveSimulated: parsed.data.reserveSimulated,
    });
  }
  revalidatePath("/plano");
  return { ok: true, message: "Objetivo salvo." };
}

const subjectSchema = z.object({
  name: z.string().min(2, "Informe o nome da matéria.").max(80),
  priority: z.coerce.number().int().min(1).max(5),
  mastery: z.coerce.number().int().min(0).max(5),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida.").default("#c9a227"),
});

export async function saveSubjectAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = subjectSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    priority: formData.get("priority"),
    mastery: formData.get("mastery"),
    color: String(formData.get("color") ?? "#c9a227"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const id = String(formData.get("id") ?? "");
  const goal = await getActiveGoal(user.id);
  if (id) {
    if (!(await updateSubject(user.id, id, parsed.data))) return { ok: false, error: "Matéria não encontrada." };
  } else {
    await createSubject(user.id, { ...parsed.data, goalId: goal?.id ?? null });
  }
  revalidatePath("/materias");
  revalidatePath("/plano");
  return { ok: true, message: "Matéria salva." };
}

export async function archiveSubjectAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await updateSubject(user.id, id, { archived: true });
  revalidatePath("/materias");
}

export async function saveTopicAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const subjectId = String(formData.get("subjectId") ?? "");
  if (name.length < 2) return { ok: false, error: "Informe o nome do tópico." };
  if (!(await createTopic(user.id, subjectId, name))) return { ok: false, error: "Matéria não encontrada." };
  revalidatePath("/materias");
  return { ok: true, message: "Tópico adicionado." };
}

export async function deleteTopicAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  await deleteTopic(user.id, String(formData.get("id") ?? ""));
  revalidatePath("/materias");
}

const availabilitySchema = z.object({
  slots: z.array(
    z.object({
      weekday: z.coerce.number().int().min(0).max(6),
      startMinute: z.coerce.number().int().min(0).max(1439),
      endMinute: z.coerce.number().int().min(1).max(1440),
    }),
  ),
  unavailableDates: z.array(z.string()),
});

export async function saveAvailabilityAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const rawSlots = JSON.parse(String(formData.get("slots") ?? "[]")) as { weekday: number; start: string; end: string }[];
  const slots: { weekday: number; startMinute: number; endMinute: number }[] = [];
  for (const s of rawSlots) {
    const startMinute = parseHHMM(s.start);
    const endMinute = parseHHMM(s.end);
    if (startMinute === null || endMinute === null || endMinute <= startMinute) {
      return { ok: false, error: "Horário inválido nos seus horários disponíveis." };
    }
    slots.push({ weekday: s.weekday, startMinute, endMinute });
  }
  const parsed = availabilitySchema.safeParse({ slots, unavailableDates: [] });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  await replaceAvailability(user.id, parsed.data.slots);
  revalidatePath("/plano");
  return { ok: true, message: "Disponibilidade salva." };
}

export async function addUnavailableDateAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const date = String(formData.get("date") ?? "");
  if (isValidDateStr(date)) {
    await addUnavailableDate(user.id, date, String(formData.get("label") ?? ""));
  }
  revalidatePath("/plano");
}

export async function removeUnavailableDateAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  await removeUnavailableDate(user.id, String(formData.get("date") ?? ""));
  revalidatePath("/plano");
}

async function buildPlannerInput(userId: string, timezone: string): Promise<PlannerInput> {
  const goal = await getActiveGoal(userId);
  const subjects = (await listSubjects(userId)).map((s) => ({
    id: s.id,
    name: s.name,
    priority: s.priority,
    mastery: s.mastery,
  }));
  const availability = (await listAvailability(userId)).map((a) => ({
    weekday: a.weekday,
    startMinute: a.start_minute,
    endMinute: a.end_minute,
  }));
  const today = todayStr(timezone);
  const existing = (await listSessions(userId, today, addDays(today, 30))).map((s) => ({
    date: s.date,
    startMinute: s.start_minute,
    plannedMinutes: s.planned_minutes,
    subjectId: s.subject_id,
    status: s.status,
  }));
  return {
    today,
    examDate: goal?.exam_date ?? null,
    sessionMinutes: goal?.session_minutes ?? 50,
    weeklyHoursTarget: goal?.weekly_hours_target ?? 10,
    subjects,
    availability,
    unavailableDates: await listUnavailableDates(userId),
    existing,
    reserveReviews: goal ? goal.reserve_reviews === 1 : true,
    reserveSimulated: goal ? goal.reserve_simulated === 1 : true,
  };
}

export type PlanPreview = {
  sessions: { date: string; startMinute: number; plannedMinutes: number; subjectId: string; subjectName: string; kind: string; reason: string }[];
  explanation: string[];
  warnings: string[];
  source: string;
  aiNote?: string;
};

export async function previewPlanAction(useAi: boolean): Promise<ActionState & { plan?: PlanPreview }> {
  const user = await requireUser();
  const goal = await getActiveGoal(user.id);
  if (!goal) return { ok: false, error: "Cadastre um objetivo de estudo antes de gerar o plano." };
  const input = await buildPlannerInput(user.id, user.timezone);
  const errors = validatePlannerInput(input);
  if (errors.length > 0) return { ok: false, error: errors[0] };
  const result = useAi ? await suggestSchedule(input) : { ...planSchedule(input), source: "deterministico" as const };
  const names = new Map((await listSubjects(user.id)).map((s) => [s.id, s.name]));
  return {
    ok: true,
    plan: {
      sessions: result.sessions.map((s) => ({
        ...s,
        subjectName: names.get(s.subjectId) ?? "Matéria",
      })),
      explanation: result.explanation,
      warnings: result.warnings,
      source: result.source,
      aiNote: "aiNote" in result ? result.aiNote : undefined,
    },
  };
}

const savePlanSchema = z.object({
  sessions: z.array(
    z.object({
      date: z.string(),
      startMinute: z.number(),
      plannedMinutes: z.number(),
      subjectId: z.string(),
      kind: z.string(),
      reason: z.string(),
    }),
  ),
  source: z.string().default("deterministico"),
  explanation: z.string().default(""),
});

export async function savePlanAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const goal = await getActiveGoal(user.id);
  if (!goal) return { ok: false, error: "Cadastre um objetivo antes de salvar o plano." };
  const parsed = savePlanSchema.safeParse({
    sessions: JSON.parse(String(formData.get("sessions") ?? "[]")),
    source: String(formData.get("source") ?? "deterministico"),
    explanation: String(formData.get("explanation") ?? ""),
  });
  if (!parsed.success) return { ok: false, error: "Plano inválido." };
  if (parsed.data.sessions.length === 0) return { ok: false, error: "O plano está vazio." };

  // Conflito: mesma data/horário já ocupado por sessão existente.
  const dates = parsed.data.sessions.map((s) => s.date);
  const minDate = dates.reduce((a, b) => (a < b ? a : b));
  const maxDate = dates.reduce((a, b) => (a > b ? a : b));
  const existing = await listSessions(user.id, minDate, maxDate);
  const conflicts = parsed.data.sessions.filter((s) =>
    existing.some(
      (e) =>
        e.date === s.date &&
        e.start_minute < s.startMinute + s.plannedMinutes &&
        s.startMinute < e.start_minute + e.planned_minutes,
    ),
  );
  if (conflicts.length > 0) {
    return {
      ok: false,
      error: `${conflicts.length} sessão(ões) conflitam com horários já existentes. Ajuste o plano ou o horário existente antes de salvar.`,
    };
  }

  const ws = weekStart(parsed.data.sessions[0].date);
  const scheduleId = await saveSchedule(user.id, goal.id, ws, parsed.data.source, parsed.data.explanation.slice(0, 2000));
  for (const s of parsed.data.sessions) {
    const subject = await getSubject(user.id, s.subjectId);
    if (!subject) continue;
    await createSession(user.id, {
      goalId: goal.id,
      scheduleId,
      subjectId: s.subjectId,
      topicId: null,
      date: s.date,
      startMinute: s.startMinute,
      plannedMinutes: s.plannedMinutes,
      kind: ["estudo", "revisao", "simulado"].includes(s.kind) ? s.kind : "estudo",
      notes: s.reason,
    });
  }
  await generateDailyReminders(user.id, todayStr(user.timezone));
  revalidatePath("/plano");
  revalidatePath("/central");
  return { ok: true, message: `Plano salvo com ${parsed.data.sessions.length} sessão(ões).` };
}

const sessionSchema = z.object({
  subjectId: z.string().optional().default(""),
  date: z.string().refine(isValidDateStr, "Data inválida."),
  start: z.string(),
  plannedMinutes: z.coerce.number().int().min(15).max(480),
  kind: z.enum(["estudo", "revisao", "simulado"]),
  notes: z.string().max(1000).optional().default(""),
});

export async function createSessionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = sessionSchema.safeParse({
    subjectId: String(formData.get("subjectId") ?? ""),
    date: String(formData.get("date") ?? ""),
    start: String(formData.get("start") ?? "19:00"),
    plannedMinutes: formData.get("plannedMinutes"),
    kind: String(formData.get("kind") ?? "estudo"),
    notes: String(formData.get("notes") ?? ""),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const startMinute = parseHHMM(parsed.data.start);
  if (startMinute === null) return { ok: false, error: "Horário de início inválido." };
  const goal = await getActiveGoal(user.id);
  await createSession(user.id, {
    goalId: goal?.id ?? null,
    subjectId: parsed.data.subjectId || null,
    topicId: null,
    date: parsed.data.date,
    startMinute,
    plannedMinutes: parsed.data.plannedMinutes,
    kind: parsed.data.kind,
    notes: parsed.data.notes,
  });
  revalidatePath("/plano");
  revalidatePath("/central");
  return { ok: true, message: "Sessão criada." };
}

export type CompleteSessionInput = {
  sessionId: string;
  status: "concluida" | "parcial" | "adiada" | "nao_realizada";
  actualMinutes: number;
  notes?: string;
  reviewTitles: string[];
};

export async function completeSessionAction(input: CompleteSessionInput): Promise<ActionState> {
  const user = await requireUser();
  const session = await getSession(user.id, input.sessionId);
  if (!session) return { ok: false, error: "Sessão não encontrada." };
  const actual = Math.max(0, Math.min(1440, Math.round(input.actualMinutes)));
  await updateSession(user.id, input.sessionId, {
    status: input.status,
    actualMinutes: actual,
    notes: input.notes?.slice(0, 1000) ?? session.notes,
  });

  let granted = 0;
  if (input.status === "concluida" || input.status === "parcial") {
    granted += await awardXp(user.id, "sessao_concluida", "study_sessions", input.sessionId);
    // Revisões programadas a partir dos tópicos escolhidos (vence em 1 dia).
    const due = addDays(todayStr(user.timezone), 1);
    for (const title of input.reviewTitles.slice(0, 20)) {
      const clean = title.trim();
      if (clean.length < 2) continue;
      await scheduleReview(user.id, {
        title: clean,
        subjectId: session.subject_id,
        sourceType: "sessao",
        sourceId: `${input.sessionId}:${clean.toLowerCase()}`,
        dueDate: due,
      });
    }
  }
  await checkCountAchievements(user.id);
  revalidatePath("/central");
  revalidatePath("/plano");
  revalidatePath("/revisoes");
  revalidatePath("/desempenho");
  return { ok: true, message: granted > 0 ? `Sessão registrada. +${granted} XP.` : "Sessão registrada." };
}

export async function deleteSessionAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  await deleteSession(user.id, String(formData.get("id") ?? ""));
  revalidatePath("/plano");
  revalidatePath("/central");
}

export async function rescheduleSessionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const date = String(formData.get("date") ?? "");
  const start = String(formData.get("start") ?? "");
  if (!isValidDateStr(date)) return { ok: false, error: "Data inválida." };
  const startMinute = parseHHMM(start);
  if (startMinute === null) return { ok: false, error: "Horário inválido." };
  const updated = await updateSession(user.id, id, { date, startMinute });
  if (!updated) return { ok: false, error: "Sessão não encontrada." };
  revalidatePath("/plano");
  revalidatePath("/central");
  return { ok: true, message: "Sessão reagendada. O histórico foi preservado." };
}

export type StartTimerInput = {
  subjectId: string | null;
  topicId: string | null;
  activityType: string;
};

export async function startTimerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const subjectId = String(formData.get("subjectId") ?? "").trim() || null;
  const topicId = String(formData.get("topicId") ?? "").trim() || null;
  const activityType = String(formData.get("activityType") ?? "").trim() || "";

  // If there's already a running session for this user, pause it first
  const existingRunning = await listTimerSessions(user.id, todayStr(user.timezone), todayStr(user.timezone));
  if (existingRunning.length > 0) {
    const current = existingRunning[0];
    await updateTimerSession(user.id, current.id, {
      status: "paused",
      last_pause_at: nowIso(),
      resumed_at: current.resumed_at, // keep existing resumed_at
    });
    await createActivity(user.id, {
      subjectId: current.subject_id,
      topicId: current.topic_id,
      goalId: current.goal_id,
      activityType: current.activity_type,
      date: current.started_at.slice(0, 10),
      durationSeconds: 0, // will be updated when resumed/completed
      notes: "",
      source: "timer",
      timerSessionId: current.id,
    });
  }

  const input: StartTimerInput = { subjectId, topicId, activityType };
  const timerId = await createTimerSession(user.id, {
    subjectId,
    topicId,
    goalId: null,
    activityType,
  });

  return { ok: true, message: "Cronômetro iniciado.", timerId };
}

export type PauseTimerInput = {
  timerId: string;
  notes?: string;
};

export async function pauseTimerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const timerId = String(formData.get("timerId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();

  const timer = await getTimerSession(user.id, timerId);
  if (!timer) return { ok: false, error: "Sessão de timer não encontrada." };

  if (timer.status !== "running") {
    return { ok: false, error: "Não é possível pausar uma sessão que não está em execução." };
  }

  await updateTimerSession(user.id, timerId, {
    status: "paused",
    last_pause_at: nowIso(),
  });

  // Create activity record for the paused segment
  await createActivity(user.id, {
    subjectId: timer.subject_id,
    topicId: timer.topic_id,
    goalId: timer.goal_id,
    activityType: timer.activity_type,
    date: timer.started_at.slice(0, 10),
    durationSeconds: timer.accumulated_seconds,
    notes,
    source: "timer",
    timerSessionId: timerId,
  });

  return { ok: true, message: "Sessão pausada." };
}

export type ResumeTimerInput = {
  timerId: string;
};

export async function resumeTimerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const timerId = String(formData.get("timerId") ?? "");

  const timer = await getTimerSession(user.id, timerId);
  if (!timer) return { ok: false, error: "Sessão de timer não encontrada." };

  if (timer.status !== "paused") {
    return { ok: false, error: "Não é possível retomar uma sessão que não está pausada." };
  }

  // Calculate new accumulated time - the timer was paused, so we keep the accumulated seconds
  // When resuming, we don't change accumulated_seconds - the visual timer handles the counting up
  await updateTimerSession(user.id, timerId, {
    status: "running",
    resumed_at: nowIso(),
  });

  return { ok: true, message: "Sessão retomada." };
}

export type CompleteTimerInput = {
  timerId: string;
  status: "concluida" | "parcial" | "adiada" | "cancelada";
  actualMinutes: number;
  notes?: string;
};

export async function completeTimerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const timerId = String(formData.get("timerId") ?? "");
  const status = String(formData.get("status") ?? "concluida");
  const actualMinutes = Number(formData.get("actualMinutes") ?? 0);
  const notes = String(formData.get("notes") ?? "").trim();

  const timer = await getTimerSession(user.id, timerId);
  if (!timer) return { ok: false, error: "Sessão de timer não encontrada." };

  const actual = Math.max(0, Math.min(1440, Math.round(actualMinutes)));
  await updateTimerSession(user.id, timerId, {
    status,
    actualMinutes: actual,
    notes,
    completed_at: nowIso(),
  });

  // Create final activity record
  await createActivity(user.id, {
    subjectId: timer.subject_id,
    topicId: timer.topic_id,
    goalId: timer.goal_id,
    activityType: timer.activity_type,
    date: timer.started_at.slice(0, 10),
    durationSeconds: timer.accumulated_seconds,
    notes,
    source: "timer",
    timerSessionId: timerId,
  });

  // Award XP for completed sessions
  let granted = 0;
  if (status === "concluida" || status === "parcial") {
    granted += await awardXp(user.id, "sessao_concluida", "study_timer_sessions", timerId);
    // Schedule reviews based on topics (due in 1 day)
    const due = addDays(todayStr(user.timezone), 1);
    // We could schedule reviews, but we need topic titles - for now just award XP
  }
  await checkCountAchievements(user.id);

  revalidatePath("/central");
  revalidatePath("/plano");
  revalidatePath("/desempenho");
  return { ok: true, message: granted > 0 ? `Sessão registrada. +${granted} XP.` : "Sessão registrada." };
}

export type ManualActivityInput = {
  subjectId: string | null;
  topicId: string | null;
  activityType: string;
  date: string;
  durationMinutes: number;
  notes: string;
};

export async function manualActivityAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const subjectId = String(formData.get("subjectId") ?? "").trim() || null;
  const topicId = String(formData.get("topicId") ?? "").trim() || null;
  const activityType = String(formData.get("activityType") ?? "estudo").trim() || "estudo";
  const date = String(formData.get("date") ?? todayStr(user.timezone));
  const durationMinutes = Number(formData.get("durationMinutes") ?? 0);
  const notes = String(formData.get("notes") ?? "").trim();

  if (!isValidDateStr(date)) {
    return { ok: false, error: "Data inválida." };
  }
  if (durationMinutes < 15) {
    return { ok: false, error: "Mínimo 15 minutos." };
  }
  if (durationMinutes > 480) {
    return { ok: false, error: "Máximo 480 minutos." };
  }

  await createActivity(user.id, {
    subjectId,
    topicId,
    goalId: null,
    activityType,
    date,
    durationSeconds: durationMinutes * 60,
    notes,
    source: "manual",
    timerSessionId: null,
  });

  revalidatePath("/central");
  revalidatePath("/plano");
  return { ok: true, message: "Atividade manual registrada." };
}

/** Onboarding: cria objetivo + matérias + disponibilidade de uma vez e marca como concluído. */
export async function completeOnboardingAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const goalResult = await saveGoalAction(_prev, formData);
  if (!goalResult.ok) return goalResult;

  const subjectsRaw = String(formData.get("subjects") ?? "").trim();
  const subjects = subjectsRaw
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length >= 2)
    .slice(0, 20);
  const goal = await getActiveGoal(user.id);
  for (const name of subjects) {
    await createSubject(user.id, { name, priority: 3, mastery: 2, color: "#c9a227", goalId: goal?.id ?? null });
  }

  const slotsRaw = String(formData.get("slots") ?? "[]");
  try {
    const slots = (JSON.parse(slotsRaw) as { weekday: number; start: string; end: string }[]).map((s) => ({
      weekday: s.weekday,
      startMinute: parseHHMM(s.start) ?? 0,
      endMinute: parseHHMM(s.end) ?? 0,
    }));
    const valid = slots.filter((s) => s.endMinute > s.startMinute);
    if (valid.length > 0) await replaceAvailability(user.id, valid);
  } catch {
    // Slots inválidos não bloqueiam o onboarding; o usuário ajusta em Meu plano.
  }

  await markOnboarded(user.id);
  revalidatePath("/central");
  revalidatePath("/plano");
  redirect("/central");
}
