import { execute, nowIso, query, queryOne, uid, withTransaction } from "../db";

export type GoalRow = {
  id: string;
  user_id: string;
  title: string;
  exam_name: string;
  exam_date: string | null;
  status: string;
  weekly_hours_target: number;
  session_minutes: number;
  start_date: string;
  reserve_reviews: number;
  reserve_simulated: number;
};

export type SubjectRow = {
  id: string;
  user_id: string;
  goal_id: string | null;
  name: string;
  priority: number;
  mastery: number;
  color: string;
  archived: number;
};

export type TopicRow = {
  id: string;
  user_id: string;
  subject_id: string;
  name: string;
  mastery: number;
  archived: number;
};

export type SessionRow = {
  id: string;
  user_id: string;
  goal_id: string | null;
  schedule_id: string | null;
  subject_id: string | null;
  topic_id: string | null;
  date: string;
  start_minute: number;
  planned_minutes: number;
  actual_minutes: number;
  kind: string;
  status: string;
  notes: string;
};

// ---------- Objetivos ----------

export function listGoals(userId: string): Promise<GoalRow[]> {
  return query<GoalRow>("SELECT * FROM study_goals WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
}

export function getGoal(userId: string, id: string): Promise<GoalRow | null> {
  return queryOne<GoalRow>("SELECT * FROM study_goals WHERE id = $1 AND user_id = $2", [id, userId]);
}

export function getActiveGoal(userId: string): Promise<GoalRow | null> {
  return queryOne<GoalRow>(
    "SELECT * FROM study_goals WHERE user_id = $1 AND status = 'ativo' ORDER BY created_at DESC LIMIT 1",
    [userId],
  );
}

export async function createGoal(
  userId: string,
  data: {
    title: string;
    examName: string;
    examDate: string | null;
    weeklyHoursTarget: number;
    sessionMinutes: number;
    startDate: string;
    reserveReviews: boolean;
    reserveSimulated: boolean;
  },
): Promise<string> {
  const id = uid();
  await execute(
    `INSERT INTO study_goals
      (id, user_id, title, exam_name, exam_date, weekly_hours_target, session_minutes, start_date, reserve_reviews, reserve_simulated, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      id,
      userId,
      data.title,
      data.examName,
      data.examDate,
      data.weeklyHoursTarget,
      data.sessionMinutes,
      data.startDate,
      data.reserveReviews ? 1 : 0,
      data.reserveSimulated ? 1 : 0,
      nowIso(),
    ],
  );
  return id;
}

export async function updateGoal(
  userId: string,
  id: string,
  data: Partial<{
    title: string;
    examName: string;
    examDate: string | null;
    status: string;
    weeklyHoursTarget: number;
    sessionMinutes: number;
    reserveReviews: boolean;
    reserveSimulated: boolean;
  }>,
): Promise<boolean> {
  const current = await getGoal(userId, id);
  if (!current) return false;
  await execute(
    `UPDATE study_goals SET title = $1, exam_name = $2, exam_date = $3, status = $4,
      weekly_hours_target = $5, session_minutes = $6, reserve_reviews = $7, reserve_simulated = $8
     WHERE id = $9 AND user_id = $10`,
    [
      data.title ?? current.title,
      data.examName ?? current.exam_name,
      data.examDate !== undefined ? data.examDate : current.exam_date,
      data.status ?? current.status,
      data.weeklyHoursTarget ?? current.weekly_hours_target,
      data.sessionMinutes ?? current.session_minutes,
      (data.reserveReviews ?? current.reserve_reviews === 1) ? 1 : 0,
      (data.reserveSimulated ?? current.reserve_simulated === 1) ? 1 : 0,
      id,
      userId,
    ],
  );
  return true;
}

// ---------- Matérias e tópicos ----------

export function listSubjects(userId: string, includeArchived = false): Promise<SubjectRow[]> {
  return query<SubjectRow>(
    `SELECT * FROM subjects WHERE user_id = $1 ${includeArchived ? "" : "AND archived = 0"} ORDER BY lower(name)`,
    [userId],
  );
}

export function getSubject(userId: string, id: string): Promise<SubjectRow | null> {
  return queryOne<SubjectRow>("SELECT * FROM subjects WHERE id = $1 AND user_id = $2", [id, userId]);
}

export async function createSubject(
  userId: string,
  data: { name: string; priority: number; mastery: number; color: string; goalId: string | null },
): Promise<string> {
  const id = uid();
  await execute(
    `INSERT INTO subjects (id, user_id, goal_id, name, priority, mastery, color, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, userId, data.goalId, data.name, data.priority, data.mastery, data.color, nowIso()],
  );
  return id;
}

export async function updateSubject(
  userId: string,
  id: string,
  data: Partial<{ name: string; priority: number; mastery: number; color: string; archived: boolean }>,
): Promise<boolean> {
  const current = await getSubject(userId, id);
  if (!current) return false;
  await execute(
    "UPDATE subjects SET name = $1, priority = $2, mastery = $3, color = $4, archived = $5 WHERE id = $6 AND user_id = $7",
    [
      data.name ?? current.name,
      data.priority ?? current.priority,
      data.mastery ?? current.mastery,
      data.color ?? current.color,
      (data.archived ?? current.archived === 1) ? 1 : 0,
      id,
      userId,
    ],
  );
  return true;
}

export function listTopics(userId: string, subjectId: string): Promise<TopicRow[]> {
  return query<TopicRow>(
    "SELECT * FROM topics WHERE user_id = $1 AND subject_id = $2 AND archived = 0 ORDER BY lower(name)",
    [userId, subjectId],
  );
}

export async function createTopic(
  userId: string,
  subjectId: string,
  name: string,
): Promise<string | null> {
  const subject = await getSubject(userId, subjectId);
  if (!subject) return null;
  const id = uid();
  await execute("INSERT INTO topics (id, user_id, subject_id, name, created_at) VALUES ($1, $2, $3, $4, $5)", [
    id,
    userId,
    subjectId,
    name,
    nowIso(),
  ]);
  return id;
}

export async function deleteTopic(userId: string, id: string): Promise<boolean> {
  return (await execute("UPDATE topics SET archived = 1 WHERE id = $1 AND user_id = $2", [id, userId])) > 0;
}

// ---------- Disponibilidade ----------

export type SlotRow = { id: string; weekday: number; start_minute: number; end_minute: number };

export function listAvailability(userId: string): Promise<SlotRow[]> {
  return query<SlotRow>(
    "SELECT id, weekday, start_minute, end_minute FROM availability_slots WHERE user_id = $1",
    [userId],
  );
}

export async function replaceAvailability(
  userId: string,
  slots: { weekday: number; startMinute: number; endMinute: number }[],
): Promise<void> {
  await withTransaction(async (client) => {
    await client.query("DELETE FROM availability_slots WHERE user_id = $1", [userId]);
    for (const s of slots) {
      await client.query(
        "INSERT INTO availability_slots (id, user_id, weekday, start_minute, end_minute, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
        [uid(), userId, s.weekday, s.startMinute, s.endMinute, nowIso()],
      );
    }
  });
}

export async function listUnavailableDates(userId: string): Promise<string[]> {
  const rows = await query<{ date: string }>(
    "SELECT date FROM unavailable_dates WHERE user_id = $1 ORDER BY date",
    [userId],
  );
  return rows.map((r) => r.date);
}

export async function addUnavailableDate(userId: string, date: string, label: string): Promise<void> {
  await execute(
    "INSERT INTO unavailable_dates (id, user_id, date, label, created_at) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (user_id, date) DO NOTHING",
    [uid(), userId, date, label, nowIso()],
  );
}

export async function removeUnavailableDate(userId: string, date: string): Promise<void> {
  await execute("DELETE FROM unavailable_dates WHERE user_id = $1 AND date = $2", [userId, date]);
}

// ---------- Sessões ----------

export function listSessions(userId: string, from: string, to: string): Promise<SessionRow[]> {
  return query<SessionRow>(
    "SELECT * FROM study_sessions WHERE user_id = $1 AND date >= $2 AND date <= $3 ORDER BY date, start_minute",
    [userId, from, to],
  );
}

export function getSession(userId: string, id: string): Promise<SessionRow | null> {
  return queryOne<SessionRow>("SELECT * FROM study_sessions WHERE id = $1 AND user_id = $2", [id, userId]);
}

export async function createSession(
  userId: string,
  data: {
    goalId: string | null;
    scheduleId?: string | null;
    subjectId: string | null;
    topicId: string | null;
    date: string;
    startMinute: number;
    plannedMinutes: number;
    kind: string;
    notes?: string;
  },
): Promise<string> {
  const id = uid();
  const now = nowIso();
  await execute(
    `INSERT INTO study_sessions
      (id, user_id, goal_id, schedule_id, subject_id, topic_id, date, start_minute, planned_minutes, actual_minutes, kind, status, notes, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, $10, 'planejada', $11, $12, $13)`,
    [
      id,
      userId,
      data.goalId,
      data.scheduleId ?? null,
      data.subjectId,
      data.topicId,
      data.date,
      data.startMinute,
      data.plannedMinutes,
      data.kind,
      data.notes ?? "",
      now,
      now,
    ],
  );
  return id;
}

export async function updateSession(
  userId: string,
  id: string,
  data: Partial<{
    date: string;
    startMinute: number;
    plannedMinutes: number;
    actualMinutes: number;
    status: string;
    notes: string;
    subjectId: string | null;
    topicId: string | null;
  }>,
): Promise<SessionRow | null> {
  const current = await getSession(userId, id);
  if (!current) return null;
  await execute(
    `UPDATE study_sessions SET date = $1, start_minute = $2, planned_minutes = $3, actual_minutes = $4,
      status = $5, notes = $6, subject_id = $7, topic_id = $8, updated_at = $9
     WHERE id = $10 AND user_id = $11`,
    [
      data.date ?? current.date,
      data.startMinute ?? current.start_minute,
      data.plannedMinutes ?? current.planned_minutes,
      data.actualMinutes ?? current.actual_minutes,
      data.status ?? current.status,
      data.notes ?? current.notes,
      data.subjectId !== undefined ? data.subjectId : current.subject_id,
      data.topicId !== undefined ? data.topicId : current.topic_id,
      nowIso(),
      id,
      userId,
    ],
  );
  return getSession(userId, id);
}

export async function deleteSession(userId: string, id: string): Promise<boolean> {
  return (await execute("DELETE FROM study_sessions WHERE id = $1 AND user_id = $2", [id, userId])) > 0;
}

export type TimerSessionRow = {
  id: string;
  user_id: string;
  subject_id: string | null;
  topic_id: string | null;
  goal_id: string | null;
  activity_type: string;
  status: string;
  started_at: string;
  resumed_at: string | null;
  last_pause_at: string | null;
  accumulated_seconds: number;
  completed_at: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
};

export async function createTimerSession(
  userId: string,
  data: {
    subjectId: string | null;
    topicId: string | null;
    goalId: string | null;
    activityType: string;
  },
): Promise<string> {
  const id = uid();
  const now = nowIso();
  await execute(
    `INSERT INTO study_timer_sessions
      (id, user_id, subject_id, topic_id, goal_id, activity_type, status, started_at, accumulated_seconds, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'running', $7, 0, $8, $8)`,
    [id, userId, data.subjectId, data.topicId, data.goalId, data.activityType, now, now],
  );
  return id;
}

export async function updateTimerSession(
  userId: string,
  id: string,
  data: Partial<{
    status: string;
    accumulated_seconds: number;
    notes: string;
    resumed_at: string | null;
    last_pause_at: string | null;
    completed_at: string | null;
    actualMinutes: number;
  }>,
): Promise<TimerSessionRow | null> {
  const current = await getTimerSession(userId, id);
  if (!current) return null;
  await execute(
    `UPDATE study_timer_sessions SET status = $1, accumulated_seconds = $2, notes = $3,
      resumed_at = $4, last_pause_at = $5, completed_at = $6, actual_minutes = $7, updated_at = $8
     WHERE id = $9 AND user_id = $10`,
    [
      data.status ?? current.status,
      data.accumulated_seconds ?? current.accumulated_seconds,
      data.notes ?? current.notes,
      data.resumed_at ?? current.resumed_at,
      data.last_pause_at ?? current.last_pause_at,
      data.completed_at ?? current.completed_at,
      data.actualMinutes,
      nowIso(),
      id,
      userId,
    ],
  );
  return getTimerSession(userId, id);
}

export async function getTimerSession(userId: string, id: string): Promise<TimerSessionRow | null> {
  return queryOne<TimerSessionRow>(
    `SELECT * FROM study_timer_sessions WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
}

export async function listTimerSessions(
  userId: string,
  from: string,
  to: string,
): Promise<TimerSessionRow[]> {
  return query<TimerSessionRow>(
    `SELECT * FROM study_timer_sessions WHERE user_id = $1 AND started_at >= $2 AND started_at <= $3 ORDER BY started_at DESC`,
    [userId, from, to],
  );
}

export async function deleteTimerSession(userId: string, id: string): Promise<boolean> {
  return (await execute("DELETE FROM study_timer_sessions WHERE id = $1 AND user_id = $2", [id, userId])) > 0;
}

export type ActivityRow = {
  id: string;
  user_id: string;
  subject_id: string | null;
  topic_id: string | null;
  goal_id: string | null;
  activity_type: string;
  date: string;
  duration_seconds: number;
  duration_minutes: number;
  notes: string;
  source: string;
  timer_session_id: string | null;
  created_at: string;
  updated_at: string;
};

export async function createActivity(
  userId: string,
  data: {
    subjectId: string | null;
    topicId: string | null;
    goalId: string | null;
    activityType: string;
    date: string;
    durationSeconds: number;
    notes: string;
    source: string;
    timerSessionId: string | null;
  },
): Promise<string> {
  const id = uid();
  await execute(
    `INSERT INTO study_activities
      (id, user_id, subject_id, topic_id, goal_id, activity_type, date, duration_seconds, duration_minutes, notes, source, timer_session_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
    [
      id,
      userId,
      data.subjectId,
      data.topicId,
      data.goalId,
      data.activityType,
      data.date,
      data.durationSeconds,
      Math.round(data.durationSeconds / 60),
      data.notes,
      data.source,
      data.timerSessionId,
      nowIso(),
      nowIso(),
    ],
  );
  return id;
}

export async function listActivities(
  userId: string,
  from: string,
  to: string,
): Promise<ActivityRow[]> {
  return query<ActivityRow>(
    `SELECT * FROM study_activities WHERE user_id = $1 AND date >= $2 AND date <= $3 ORDER BY date DESC`,
    [userId, from, to],
  );
}

export async function updateActivity(
  userId: string,
  id: string,
  data: Partial<{
    duration_seconds: number;
    duration_minutes: number;
    notes: string;
    source: string;
  }>,
): Promise<ActivityRow | null> {
  const current = await getActivity(userId, id);
  if (!current) return null;
  await execute(
    `UPDATE study_activities SET duration_seconds = $1, duration_minutes = $2, notes = $3, source = $4, updated_at = $5
     WHERE id = $6 AND user_id = $7`,
    [
      data.duration_seconds ?? current.duration_seconds,
      data.duration_minutes ?? current.duration_minutes,
      data.notes ?? current.notes,
      data.source ?? current.source,
      nowIso(),
      id,
      userId,
    ],
  );
  return getActivity(userId, id);
}

export async function getActivity(userId: string, id: string): Promise<ActivityRow | null> {
  return queryOne<ActivityRow>(
    `SELECT * FROM study_activities WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
}

export async function deleteActivity(userId: string, id: string): Promise<boolean> {
  return (await execute("DELETE FROM study_activities WHERE id = $1 AND user_id = $2", [id, userId])) > 0;
}

export async function saveSchedule(
  userId: string,
  goalId: string,
  weekStart: string,
  source: string,
  explanation: string,
): Promise<string> {
  const existing = await queryOne<{ id: string }>(
    "SELECT id FROM schedules WHERE user_id = $1 AND goal_id = $2 AND week_start = $3",
    [userId, goalId, weekStart],
  );
  const id = existing?.id ?? uid();
  if (existing) {
    await execute("UPDATE schedules SET source = $1, explanation = $2, created_at = $3 WHERE id = $4", [
      source,
      explanation,
      nowIso(),
      id,
    ]);
  } else {
    await execute(
      "INSERT INTO schedules (id, user_id, goal_id, week_start, source, explanation, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [id, userId, goalId, weekStart, source, explanation, nowIso()],
    );
  }
  return id;
}
