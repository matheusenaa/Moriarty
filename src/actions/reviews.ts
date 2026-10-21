"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { todayStr, isValidDateStr, addDays } from "@/lib/dates";
import {
  completeReview,
  deferReview,
  getReview,
  reviewHistory,
  reviewQueue,
  reviewStats,
  scheduleReview,
} from "@/lib/repo/reviews";
import { awardXp, checkCountAchievements } from "@/lib/repo/gamification";
import type { ReviewResult } from "@/lib/srs";
import type { ActionState } from "./auth";
export type { ActionState };

export async function completeReviewAction(input: { reviewId: string; result: ReviewResult }): Promise<ActionState> {
  const user = await requireUser();
  const today = todayStr(user.timezone);
  const outcome = await completeReview(user.id, input.reviewId, input.result, today);
  if (!outcome) return { ok: false, error: "Revisão não encontrada." };
  const granted = await awardXp(user.id, "revisao_realizada", "review_items", `${input.reviewId}:${today}`);
  await checkCountAchievements(user.id);
  revalidatePath("/revisoes");
  revalidatePath("/central");
  revalidatePath("/desempenho");
  return {
    ok: true,
    message: `Registrado. Próxima revisão em ${outcome.dueDate} (intervalo de ${outcome.state.intervalDays} dia(s)).${granted > 0 ? ` +${granted} XP.` : ""}`,
  };
}

export async function deferReviewAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const days = Number(formData.get("days") ?? 1);
  const review = await getReview(user.id, id);
  if (!review) return { ok: false, error: "Revisão não encontrada." };
  const today = todayStr(user.timezone);
  const newDue = addDays(today, Number.isFinite(days) && days > 0 && days <= 30 ? Math.round(days) : 1);
  await deferReview(user.id, id, newDue);
  revalidatePath("/revisoes");
  return { ok: true, message: `Revisão adiada para ${newDue}. O adiamento fica no histórico.` };
}

export async function createManualReviewAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const subjectId = String(formData.get("subjectId") ?? "") || null;
  const due = String(formData.get("due") ?? "");
  if (title.length < 2) return { ok: false, error: "Informe um título para a revisão." };
  const today = todayStr(user.timezone);
  const dueDate = isValidDateStr(due) ? due : addDays(today, 1);
  const id = await scheduleReview(user.id, { title, subjectId, sourceType: "manual", sourceId: null, dueDate });
  if (!id) return { ok: false, error: "Já existe uma revisão pendente para este item." };
  revalidatePath("/revisoes");
  return { ok: true, message: "Revisão agendada." };
}

export async function reviewsPageData(userId: string, timezone: string) {
  const today = todayStr(timezone);
  return {
    today,
    queue: await reviewQueue(userId, today),
    history: await reviewHistory(userId),
    stats: await reviewStats(userId, today),
  };
}
