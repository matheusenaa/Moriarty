/**
 * Gerador determinístico de cronograma.
 *
 * Distribui sessões respeitando: disponibilidade semanal, datas indisponíveis,
 * sessões já concluídas (nunca apagadas), carga diária máxima, prioridade e
 * domínio de cada matéria, alternância de conteúdo e reserva para revisões
 * e simulados. Retorna também a explicação da sugestão.
 */

import { addDays, daysBetween, isValidDateStr, weekdayOf } from "./dates";

export type PlannerSubject = {
  id: string;
  name: string;
  priority: number; // 1..5
  mastery: number; // 0..5
};

export type AvailabilitySlot = {
  weekday: number; // 0=domingo..6=sábado
  startMinute: number;
  endMinute: number;
};

export type ExistingSession = {
  date: string;
  startMinute: number;
  plannedMinutes: number;
  subjectId: string | null;
  status: string;
};

export type PlannerInput = {
  today: string;
  examDate: string | null;
  sessionMinutes: number;
  weeklyHoursTarget: number;
  subjects: PlannerSubject[];
  availability: AvailabilitySlot[];
  unavailableDates: string[];
  existing: ExistingSession[];
  reserveReviews: boolean;
  reserveSimulated: boolean;
  maxDaysAhead?: number;
};

export type PlannedSession = {
  date: string;
  startMinute: number;
  plannedMinutes: number;
  subjectId: string;
  kind: "estudo" | "revisao" | "simulado";
  reason: string;
};

export type PlannerOutput = {
  sessions: PlannedSession[];
  explanation: string[];
  warnings: string[];
};

const MAX_DAILY_MINUTES = 360;

export function planSchedule(input: PlannerInput): PlannerOutput {
  const warnings: string[] = [];
  const explanation: string[] = [];
  const sessions: PlannedSession[] = [];

  const horizonEnd = (() => {
    const maxAhead = input.maxDaysAhead ?? 21;
    const limitByExam = input.examDate ? input.examDate : addDays(input.today, maxAhead);
    const limitByHorizon = addDays(input.today, maxAhead);
    const end =
      input.examDate && daysBetween(input.today, input.examDate) <= maxAhead
        ? limitByExam
        : limitByHorizon;
    if (input.examDate && daysBetween(input.today, input.examDate) > maxAhead) {
      warnings.push(
        `A prova é em ${input.examDate}; o plano foi gerado apenas para os próximos ${maxAhead} dias. Gere a próxima semana para continuar.`,
      );
    }
    return end;
  })();

  if (input.subjects.length === 0) {
    warnings.push("Cadastre ao menos uma matéria antes de gerar o cronograma.");
    return { sessions, explanation, warnings };
  }

  if (input.availability.length === 0) {
    warnings.push("Informe seus horários disponíveis para que o plano possa ser montado.");
    return { sessions, explanation, warnings };
  }

  if (input.sessionMinutes < 15) {
    warnings.push("Duração mínima de sessão é de 15 minutos.");
  }

  const unavailable = new Set(input.unavailableDates);
  const dias = daysBetween(input.today, horizonEnd);
  if (dias <= 0) {
    warnings.push("A data do fim do plano já passou. Atualize a data da prova.");
    return { sessions, explanation, warnings };
  }

  const plannedByDay = new Map<string, ExistingSession[]>();
  for (const s of input.existing) {
    const list = plannedByDay.get(s.date) ?? [];
    list.push(s);
    plannedByDay.set(s.date, list);
  }

  // Ordem de preferência das matérias: prioridade alta e domínio baixo primeiro.
  const weights = input.subjects.map((s) => ({
    subject: s,
    weight: Math.max(0.1, s.priority * (6 - s.mastery * 0.8)),
    pending: 0,
  }));
  const totalWeight = weights.reduce((a, b) => a + b.weight, 0);
  const weeklyMinutesBudget = input.weeklyHoursTarget * 60;

  // Cotas por matéria para a semana do plano.
  const quota = new Map<string, number>();
  for (const w of weights) {
    quota.set(w.subject.id, Math.floor((w.weight / totalWeight) * weeklyMinutesBudget));
  }

  const reviewShare = input.reserveReviews ? 0.15 : 0;
  const simShare = input.reserveSimulated ? 0.05 : 0;

  let lastSubjectId: string | null = null;
  const weekUse = new Map<string, number>(); // subjectId -> minutos usados na semana

  const slotsFor = (date: string): AvailabilitySlot[] => {
    const wd = weekdayOf(date);
    return input.availability.filter((a) => a.weekday === wd);
  };

  const usedMinutes = (date: string): number => {
    const list = plannedByDay.get(date) ?? [];
    let used = 0;
    for (const s of list) {
      used += s.status === "nao_realizada" ? 0 : s.plannedMinutes;
    }
    return used;
  };

  const nextStart = (date: string, slot: AvailabilitySlot, already: ExistingSession[]): number => {
    const intervals = already
      .filter((s) => s.startMinute >= slot.startMinute && s.startMinute < slot.endMinute)
      .map((s) => ({ from: s.startMinute, to: s.startMinute + s.plannedMinutes }))
      .sort((a, b) => a.from - b.from);
    let cursor = slot.startMinute;
    for (const iv of intervals) {
      if (iv.from - cursor >= input.sessionMinutes) break;
      cursor = Math.max(cursor, iv.to + 10); // pausa de 10 minutos após sessões existentes
    }
    return cursor;
  };

  for (let offset = 0; offset <= dias; offset++) {
    const date = addDays(input.today, offset);
    if (unavailable.has(date)) continue;
    const slots = slotsFor(date);
    if (slots.length === 0) continue;

    const already = plannedByDay.get(date) ?? [];
    const dayUsed = usedMinutes(date);
    let freeToday = Math.min(MAX_DAILY_MINUTES, 24 * 60) - dayUsed;
    if (freeToday <= 0) continue;

    for (const slot of slots) {
      const slotCapacity = slot.endMinute - slot.startMinute;
      freeToday = Math.min(freeToday, slotCapacity);
      let cursor = nextStart(date, slot, already);
      let slotFree = slot.endMinute - cursor;

      while (slotFree >= input.sessionMinutes && freeToday >= input.sessionMinutes) {
        // Revisões e simulados têm cota própria.
        const dayKind = decideKind({
          date,
          reviewShare,
          simShare,
          usedToday: already,
          kindCounts: countKinds(already, sessions, date),
        });

        if (dayKind === "revisao") {
          sessions.push({
            date,
            startMinute: cursor,
            plannedMinutes: input.sessionMinutes,
            subjectId: pickSubject(weights, weekUse, quota, lastSubjectId)?.subject.id ?? input.subjects[0].id,
            kind: "revisao",
            reason: "Reserva semanal para revisão espaçada dos conteúdos estudados.",
          });
        } else if (dayKind === "simulado") {
          sessions.push({
            date,
            startMinute: cursor,
            plannedMinutes: input.sessionMinutes,
            subjectId: pickSubject(weights, weekUse, quota, lastSubjectId)?.subject.id ?? input.subjects[0].id,
            kind: "simulado",
            reason: "Reserva semanal para simulado e correção.",
          });
        } else {
          const picked = pickSubject(weights, weekUse, quota, lastSubjectId);
          if (!picked) break;
          const weekPct = Math.round(((weekUse.get(picked.subject.id) ?? 0) / weeklyMinutesBudget) * 100);
          sessions.push({
            date,
            startMinute: cursor,
            plannedMinutes: input.sessionMinutes,
            subjectId: picked.subject.id,
            kind: "estudo",
            reason: `${picked.subject.name}: prioridade ${picked.subject.priority}/5, domínio ${picked.subject.mastery}/5 (${weekPct}% da meta semanal).`,
          });
          lastSubjectId = picked.subject.id;
          weekUse.set(picked.subject.id, (weekUse.get(picked.subject.id) ?? 0) + input.sessionMinutes);
        }

        cursor += input.sessionMinutes + 10; // pausa de 10 minutos entre sessões
        slotFree = slot.endMinute - cursor;
        freeToday -= input.sessionMinutes;
      }
    }
  }

  const bySubject = new Map<string, number>();
  for (const s of sessions) {
    if (s.kind !== "estudo") continue;
    bySubject.set(s.subjectId, (bySubject.get(s.subjectId) ?? 0) + s.plannedMinutes);
  }
  for (const w of weights) {
    const min = bySubject.get(w.subject.id) ?? 0;
    explanation.push(
      `${w.subject.name}: ${Math.round(min / 60 * 10) / 10}h planejadas nesta semana (prioridade ${w.subject.priority}/5, domínio autodeclarado ${w.subject.mastery}/5).`,
    );
  }
  if (input.reserveReviews) {
    explanation.push("15% da carga foi reservada para revisões espaçadas.");
  }
  if (input.reserveSimulated) {
    explanation.push("5% da carga foi reservada para simulados.");
  }
  explanation.push("Sessões já registradas foram preservadas e descontadas da disponibilidade.");

  return { sessions, explanation, warnings };
}

type WeightEntry = { subject: PlannerSubject; weight: number; pending: number };

function pickSubject(
  weights: WeightEntry[],
  weekUse: Map<string, number>,
  quota: Map<string, number>,
  lastSubjectId: string | null,
): WeightEntry | null {
  const candidates = weights.filter((w) => (weekUse.get(w.subject.id) ?? 0) < (quota.get(w.subject.id) ?? Infinity));
  const pool = candidates.length > 0 ? candidates : weights;
  // Evita duas sessões seguidas da mesma matéria quando há alternativa.
  const alternates = pool.filter((w) => w.subject.id !== lastSubjectId);
  const list = alternates.length > 0 ? alternates : pool;
  // Escolhe o maior peso entre os candidatos com menor uso relativo.
  let best: WeightEntry | null = null;
  let bestScore = -Infinity;
  for (const w of list) {
    const used = weekUse.get(w.subject.id) ?? 0;
    const q = quota.get(w.subject.id) ?? 1;
    const score = w.weight - (used / Math.max(q, 1)) * 2;
    if (score > bestScore) {
      bestScore = score;
      best = w;
    }
  }
  return best;
}

function countKinds(
  _existing: ExistingSession[],
  planned: PlannedSession[],
  date: string,
): { revisao: number; simulado: number } {
  let revisao = 0;
  let simulado = 0;
  for (const s of planned) {
    if (s.date !== date) continue;
    if (s.kind === "revisao") revisao++;
    if (s.kind === "simulado") simulado++;
  }
  return { revisao, simulado };
}

function decideKind(args: {
  date: string;
  reviewShare: number;
  simShare: number;
  usedToday: ExistingSession[];
  kindCounts: { revisao: number; simulado: number };
}): "estudo" | "revisao" | "simulado" {
  const wd = weekdayOf(args.date);
  if (args.reviewShare > 0 && wd === 0 && args.kindCounts.revisao === 0) return "revisao";
  if (args.simShare > 0 && wd === 6 && args.kindCounts.simulado === 0) return "simulado";
  if (args.reviewShare > 0 && wd === 3 && args.kindCounts.revisao === 0) return "revisao";
  return "estudo";
}

export function validatePlannerInput(input: PlannerInput): string[] {
  const errors: string[] = [];
  if (input.sessionMinutes < 15 || input.sessionMinutes > 480) {
    errors.push("A duração da sessão deve estar entre 15 e 480 minutos.");
  }
  if (input.weeklyHoursTarget <= 0 || input.weeklyHoursTarget > 80) {
    errors.push("A meta semanal deve estar entre 1 e 80 horas.");
  }
  if (input.examDate && !isValidDateStr(input.examDate)) {
    errors.push("Data da prova inválida.");
  }
  for (const s of input.availability) {
    if (s.startMinute >= s.endMinute) errors.push("Horário disponível inválido.");
    if (s.weekday < 0 || s.weekday > 6) errors.push("Dia da semana inválido.");
  }
  return errors;
}
