import type { AuthUser } from "./auth";
import type { AgentContext } from "./agent";
import type { TutorContext } from "./ai";
import { addDays, todayStr } from "./dates";
import { getActiveGoal, listSessions, listSubjects } from "./repo/planning";
import { reviewQueue } from "./repo/reviews";
import { listMaterialIndex } from "./repo/materials";
import { questionAccuracyBySubject, studyStreak } from "./repo/stats";

export type BuiltAgentContext = {
  prompt: TutorContext;
  actions: AgentContext;
  subjects: { id: string; name: string }[];
};

/**
 * Monta o contexto do tutor apenas com dados do próprio usuário.
 * Nunca inclui e-mail, senha, amigos, mensagens de chat ou dados de terceiros.
 */
export async function buildAgentContext(user: AuthUser): Promise<BuiltAgentContext> {
  const today = todayStr(user.timezone);
  const goal = await getActiveGoal(user.id);
  const subjects = await listSubjects(user.id);
  const sessions = await listSessions(user.id, today, addDays(today, 14));
  const reviews = await reviewQueue(user.id, today);
  const materials = await listMaterialIndex(user.id);
  const accuracy = await questionAccuracyBySubject(user.id);
  const streak = await studyStreak(user.id, today);
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));

  const prompt: TutorContext = {
    user: { displayName: user.displayName },
    today,
    timezone: user.timezone,
    goal: goal
      ? {
          title: goal.title,
          examName: goal.exam_name,
          examDate: goal.exam_date,
          weeklyHoursTarget: goal.weekly_hours_target,
        }
      : null,
    subjects: subjects.map((s) => ({ name: s.name, priority: s.priority, mastery: s.mastery })),
    sessions: sessions.slice(0, 30).map((s) => ({
      date: s.date,
      startMinute: s.start_minute,
      plannedMinutes: s.planned_minutes,
      subjectName: subjectMap.get(s.subject_id ?? "") ?? null,
      kind: s.kind,
      status: s.status,
    })),
    reviewsDue: reviews.filter((r) => r.due_date <= today).length,
    reviews: reviews.slice(0, 12).map((r) => ({
      title: r.title,
      dueDate: r.due_date,
      subjectName: subjectMap.get(r.subject_id ?? "") ?? null,
    })),
    materials: materials.slice(0, 40).map((m) => ({
      title: m.title,
      type: m.type,
      subjectName: subjectMap.get(m.subject_id ?? "") ?? null,
    })),
    accuracy: accuracy.slice(0, 12).map((a) => ({ subjectName: a.name, correct: a.correct, total: a.total })),
    streak,
  };

  return {
    prompt,
    actions: {
      today,
      subjects: subjects.map((s) => ({ id: s.id, name: s.name })),
      hasActiveGoal: Boolean(goal),
    },
    subjects: subjects.map((s) => ({ id: s.id, name: s.name })),
  };
}
