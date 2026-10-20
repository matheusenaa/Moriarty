import { getDb, nowIso, uid } from "../db";

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

export function listGoals(userId: string): GoalRow[] {
  return getDb()
    .prepare("SELECT * FROM study_goals WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId) as GoalRow[];
}

export function getGoal(userId: string, id: string): GoalRow | null {
  const db = getDb();
  return (
    (db.prepare("SELECT * FROM study_goals WHERE id = ? AND user_id = ?").get(id, userId) as GoalRow) ??
    null
  );
}

export function getActiveGoal(userId: string): GoalRow | null {
  const db = getDb();
  return (
    (db
      .prepare("SELECT * FROM study_goals WHERE user_id = ? AND status = 'ativo' ORDER BY created_at DESC LIMIT 1")
      .get(userId) as GoalRow) ?? null
  );
}

export function createGoal(
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
): string {
  const id = uid();
  getDb()
    .prepare(
      `INSERT INTO study_goals
        (id, user_id, title, exam_name, exam_date, weekly_hours_target, session_minutes, start_date, reserve_reviews, reserve_simulated, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
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
    );
  return id;
}

export function updateGoal(
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
): boolean {
  const current = getGoal(userId, id);
  if (!current) return false;
  getDb()
    .prepare(
      `UPDATE study_goals SET title = ?, exam_name = ?, exam_date = ?, status = ?,
        weekly_hours_target = ?, session_minutes = ?, reserve_reviews = ?, reserve_simulated = ?
       WHERE id = ? AND user_id = ?`,
    )
    .run(
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
    );
  return true;
}

// ---------- Matérias e tópicos ----------

export function listSubjects(userId: string, includeArchived = false): SubjectRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM subjects WHERE user_id = ? ${includeArchived ? "" : "AND archived = 0"} ORDER BY name COLLATE NOCASE`,
    )
    .all(userId) as SubjectRow[];
}

export function getSubject(userId: string, id: string): SubjectRow | null {
  const db = getDb();
  return (
    (db.prepare("SELECT * FROM subjects WHERE id = ? AND user_id = ?").get(id, userId) as SubjectRow) ??
    null
  );
}

export function createSubject(
  userId: string,
  data: { name: string; priority: number; mastery: number; color: string; goalId: string | null },
): string {
  const id = uid();
  getDb()
    .prepare(
      `INSERT INTO subjects (id, user_id, goal_id, name, priority, mastery, color, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(id, userId, data.goalId, data.name, data.priority, data.mastery, data.color, nowIso());
  return id;
}

export function updateSubject(
  userId: string,
  id: string,
  data: Partial<{ name: string; priority: number; mastery: number; color: string; archived: boolean }>,
): boolean {
  const current = getSubject(userId, id);
  if (!current) return false;
  getDb()
    .prepare(
      "UPDATE subjects SET name = ?, priority = ?, mastery = ?, color = ?, archived = ? WHERE id = ? AND user_id = ?",
    )
    .run(
      data.name ?? current.name,
      data.priority ?? current.priority,
      data.mastery ?? current.mastery,
      data.color ?? current.color,
      (data.archived ?? current.archived === 1) ? 1 : 0,
      id,
      userId,
    );
  return true;
}

export function listTopics(userId: string, subjectId: string): TopicRow[] {
  return getDb()
    .prepare("SELECT * FROM topics WHERE user_id = ? AND subject_id = ? AND archived = 0 ORDER BY name COLLATE NOCASE")
    .all(userId, subjectId) as TopicRow[];
}

export function createTopic(userId: string, subjectId: string, name: string): string | null {
  const subject = getSubject(userId, subjectId);
  if (!subject) return null;
  const id = uid();
  getDb()
    .prepare("INSERT INTO topics (id, user_id, subject_id, name, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(id, userId, subjectId, name, nowIso());
  return id;
}

export function deleteTopic(userId: string, id: string): boolean {
  return (
    getDb().prepare("UPDATE topics SET archived = 1 WHERE id = ? AND user_id = ?").run(id, userId).changes > 0
  );
}

// ---------- Disponibilidade ----------

export type SlotRow = { id: string; weekday: number; start_minute: number; end_minute: number };

export function listAvailability(userId: string): SlotRow[] {
  return getDb()
    .prepare("SELECT id, weekday, start_minute, end_minute FROM availability_slots WHERE user_id = ?")
    .all(userId) as SlotRow[];
}

export function replaceAvailability(userId: string, slots: { weekday: number; startMinute: number; endMinute: number }[]): void {
  const db = getDb();
  db.transaction(() => {
    db.prepare("DELETE FROM availability_slots WHERE user_id = ?").run(userId);
    const ins = db.prepare(
      "INSERT INTO availability_slots (id, user_id, weekday, start_minute, end_minute, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    );
    for (const s of slots) {
      ins.run(uid(), userId, s.weekday, s.startMinute, s.endMinute, nowIso());
    }
  })();
}

export function listUnavailableDates(userId: string): string[] {
  const rows = getDb()
    .prepare("SELECT date FROM unavailable_dates WHERE user_id = ? ORDER BY date")
    .all(userId) as { date: string }[];
  return rows.map((r) => r.date);
}

export function addUnavailableDate(userId: string, date: string, label: string): void {
  getDb()
    .prepare(
      "INSERT OR IGNORE INTO unavailable_dates (id, user_id, date, label, created_at) VALUES (?, ?, ?, ?, ?)",
    )
    .run(uid(), userId, date, label, nowIso());
}

export function removeUnavailableDate(userId: string, date: string): void {
  getDb().prepare("DELETE FROM unavailable_dates WHERE user_id = ? AND date = ?").run(userId, date);
}

// ---------- Sessões ----------

export function listSessions(userId: string, from: string, to: string): SessionRow[] {
  return getDb()
    .prepare("SELECT * FROM study_sessions WHERE user_id = ? AND date >= ? AND date <= ? ORDER BY date, start_minute")
    .all(userId, from, to) as SessionRow[];
}

export function getSession(userId: string, id: string): SessionRow | null {
  const db = getDb();
  return (
    (db.prepare("SELECT * FROM study_sessions WHERE id = ? AND user_id = ?").get(id, userId) as SessionRow) ??
    null
  );
}

export function createSession(
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
): string {
  const id = uid();
  const now = nowIso();
  getDb()
    .prepare(
      `INSERT INTO study_sessions
        (id, user_id, goal_id, schedule_id, subject_id, topic_id, date, start_minute, planned_minutes, actual_minutes, kind, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'planejada', ?, ?, ?)`,
    )
    .run(
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
    );
  return id;
}

export function updateSession(
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
): SessionRow | null {
  const current = getSession(userId, id);
  if (!current) return null;
  getDb()
    .prepare(
      `UPDATE study_sessions SET date = ?, start_minute = ?, planned_minutes = ?, actual_minutes = ?,
        status = ?, notes = ?, subject_id = ?, topic_id = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
    )
    .run(
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
    );
  return getSession(userId, id);
}

export function deleteSession(userId: string, id: string): boolean {
  return getDb().prepare("DELETE FROM study_sessions WHERE id = ? AND user_id = ?").run(id, userId).changes > 0;
}

export function saveSchedule(
  userId: string,
  goalId: string,
  weekStart: string,
  source: string,
  explanation: string,
): string {
  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM schedules WHERE user_id = ? AND goal_id = ? AND week_start = ?")
    .get(userId, goalId, weekStart) as { id: string } | undefined;
  const id = existing?.id ?? uid();
  if (existing) {
    db.prepare("UPDATE schedules SET source = ?, explanation = ?, created_at = ? WHERE id = ?").run(
      source,
      explanation,
      nowIso(),
      id,
    );
  } else {
    db.prepare(
      "INSERT INTO schedules (id, user_id, goal_id, week_start, source, explanation, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run(id, userId, goalId, weekStart, source, explanation, nowIso());
  }
  return id;
}
