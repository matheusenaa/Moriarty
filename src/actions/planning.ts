"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { nowIso } from "@/lib/db";
import { todayStr, addDays, isValidDateStr, parseHHMM, weekStart } from "@/lib/dates";
import {
  createActivity,
  createGoal,
  createSession,
  createSubject,
  createTopic,
  deleteSession,
  deleteTopic,
  deleteTimerSession,
  getActivity,
  getSession,
  getSubject,
  listActivities,
  listAvailability,
  listSessions,
  listSubjects,
  listTimerSessions,
  listUnavailableDates,
  replaceAvailability,
  saveSchedule,
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
export type { ActionState };