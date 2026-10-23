import { z } from "zod";
import { addDays, isValidDateStr } from "./dates";

export const AGENT_ACTION_KINDS = ["create_session", "schedule_review", "create_goal"] as const;
export type AgentActionKind = (typeof AGENT_ACTION_KINDS)[number];

export type AgentSubject = { id: string; name: string };

export type AgentContext = {
  today: string;
  subjects: AgentSubject[];
  hasActiveGoal: boolean;
};

export type ProposedAction =
  | {
      kind: "create_session";
      payload: {
        date: string;
        startMinute: number;
        plannedMinutes: number;
        subjectId: string;
        subjectName: string;
        kind: "estudo" | "revisao" | "simulado";
        notes: string;
      };
    }
  | {
      kind: "schedule_review";
      payload: {
        title: string;
        subjectId: string | null;
        subjectName: string | null;
        dueDate: string;
      };
    }
  | {
      kind: "create_goal";
      payload: {
        title: string;
        examName: string;
        examDate: string | null;
        weeklyHoursTarget: number;
        sessionMinutes: number;
      };
    };

export type NormalizedActions = {
  actions: ProposedAction[];
  warnings: string[];
};

const rawActionSchema = z.object({
  kind: z.enum(AGENT_ACTION_KINDS),
  payload: z.record(z.string(), z.unknown()),
});

const sessionPayloadSchema = z.object({
  date: z.string(),
  startMinute: z.coerce.number().int(),
  plannedMinutes: z.coerce.number().int(),
  subjectName: z.string(),
  kind: z.enum(["estudo", "revisao", "simulado"]).default("estudo"),
  notes: z.string().max(1000).optional().default(""),
});

const reviewPayloadSchema = z.object({
  title: z.string().min(2).max(160),
  subjectName: z.string().optional().nullable(),
  dueInDays: z.coerce.number().int().min(1).max(365),
});

const goalPayloadSchema = z.object({
  title: z.string().min(2).max(120),
  examName: z.string().max(120).optional().default(""),
  examDate: z.string().optional().nullable(),
  weeklyHoursTarget: z.coerce.number().min(1).max(80),
  sessionMinutes: z.coerce.number().int().min(15).max(480),
});

function stripCodeFence(raw: string): string {
  const text = raw.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)```$/i.exec(text);
  return (fenced ? fenced[1] : text).trim();
}

/** Extrai o primeiro objeto/array JSON de uma resposta que pode vir com texto ao redor. */
export function extractJson(raw: string): unknown {
  const text = stripCodeFence(raw);
  try {
    return JSON.parse(text);
  } catch {
    const start = text.search(/[\[{]/);
    const end = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

/** Converte a resposta bruta da IA em uma resposta de tutor segura para exibição. */
export function parseTutorReply(raw: string): {
  reply: string;
  rawActions: unknown[];
} {
  const parsed = extractJson(raw);
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const obj = parsed as { reply?: unknown; actions?: unknown };
    const reply = typeof obj.reply === "string" ? obj.reply.trim() : "";
    return {
      reply: reply.slice(0, 8000) || "Não consegui formular uma resposta agora. Tente reformular a pergunta.",
      rawActions: Array.isArray(obj.actions) ? obj.actions : [],
    };
  }
  return { reply: stripCodeFence(raw).slice(0, 8000), rawActions: [] };
}

function findSubject(subjects: AgentSubject[], hint: string | null | undefined): AgentSubject | null {
  if (!hint) return null;
  const clean = hint.trim().toLowerCase();
  if (!clean) return null;
  return (
    subjects.find((s) => s.id === hint) ??
    subjects.find((s) => s.name.toLowerCase() === clean) ??
    subjects.find((s) => s.name.toLowerCase().includes(clean) || clean.includes(s.name.toLowerCase())) ??
    null
  );
}

/**
 * Valida ações propostas contra os dados reais do usuário.
 * A IA não escolhe IDs, datas fora do intervalo nem matérias de terceiros.
 */
export function normalizeTutorActions(rawActions: unknown[], ctx: AgentContext): NormalizedActions {
  const actions: ProposedAction[] = [];
  const warnings: string[] = [];
  const seen = new Set<string>();

  for (const raw of rawActions.slice(0, 3)) {
    const parsed = rawActionSchema.safeParse(raw);
    if (!parsed.success) {
      warnings.push("Uma ação sugerida foi ignorada por formato inválido.");
      continue;
    }
    let action: ProposedAction | null = null;

    if (parsed.data.kind === "create_session") {
      const p = sessionPayloadSchema.safeParse(parsed.data.payload);
      if (!p.success) {
        warnings.push("Sessão sugerida ignorada: dados incompletos.");
        continue;
      }
      const subject = findSubject(ctx.subjects, p.data.subjectName);
      const date = p.data.date;
      if (!isValidDateStr(date) || date < ctx.today || date > addDays(ctx.today, 120)) {
        warnings.push("Sessão sugerida ignorada: data fora do período permitido.");
        continue;
      }
      if (!subject) {
        warnings.push(`Sessão sugerida ignorada: matéria “${p.data.subjectName}” não encontrada.`);
        continue;
      }
      if (p.data.startMinute < 0 || p.data.startMinute > 1439) {
        warnings.push("Sessão sugerida ignorada: horário inválido.");
        continue;
      }
      if (p.data.plannedMinutes < 15 || p.data.plannedMinutes > 480) {
        warnings.push("Sessão sugerida ignorada: duração fora de 15–480 minutos.");
        continue;
      }
      action = {
        kind: "create_session",
        payload: {
          date,
          startMinute: p.data.startMinute,
          plannedMinutes: p.data.plannedMinutes,
          subjectId: subject.id,
          subjectName: subject.name,
          kind: p.data.kind,
          notes: p.data.notes ?? "",
        },
      };
    }

    if (parsed.data.kind === "schedule_review") {
      const p = reviewPayloadSchema.safeParse(parsed.data.payload);
      if (!p.success) {
        warnings.push("Revisão sugerida ignorada: dados incompletos.");
        continue;
      }
      const subject = findSubject(ctx.subjects, p.data.subjectName);
      const title = p.data.title.trim();
      if (title.length < 2) {
        warnings.push("Revisão sugerida ignorada: título curto demais.");
        continue;
      }
      action = {
        kind: "schedule_review",
        payload: {
          title,
          subjectId: subject?.id ?? null,
          subjectName: subject?.name ?? null,
          dueDate: addDays(ctx.today, p.data.dueInDays),
        },
      };
    }

    if (parsed.data.kind === "create_goal") {
      if (ctx.hasActiveGoal) {
        warnings.push("Objetivo sugerido ignorado: você já tem um objetivo ativo. Edite-o em Meu plano.");
        continue;
      }
      const p = goalPayloadSchema.safeParse(parsed.data.payload);
      if (!p.success) {
        warnings.push("Objetivo sugerido ignorado: dados incompletos.");
        continue;
      }
      const title = p.data.title.trim();
      if (title.length < 2) {
        warnings.push("Objetivo sugerido ignorado: título curto demais.");
        continue;
      }
      const examDate = p.data.examDate && isValidDateStr(p.data.examDate) ? p.data.examDate : null;
      if (examDate && examDate < ctx.today) {
        warnings.push("Objetivo sugerido ignorado: data da prova no passado.");
        continue;
      }
      action = {
        kind: "create_goal",
        payload: {
          title,
          examName: (p.data.examName ?? "").trim(),
          examDate,
          weeklyHoursTarget: p.data.weeklyHoursTarget,
          sessionMinutes: p.data.sessionMinutes,
        },
      };
    }

    if (!action) continue;
    const key = JSON.stringify(action);
    if (seen.has(key)) continue;
    seen.add(key);
    actions.push(action);
  }

  return { actions, warnings };
}

export function actionLabel(action: { kind: AgentActionKind; payload: unknown }): string {
  if (action.kind === "create_session") {
    const p = action.payload as Extract<ProposedAction, { kind: "create_session" }>["payload"];
    const h = Math.floor(p.startMinute / 60);
    const m = p.startMinute % 60;
    return `Criar sessão de ${p.plannedMinutes} min em ${p.date} às ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} — ${p.subjectName} (${p.kind})`;
  }
  if (action.kind === "schedule_review") {
    const p = action.payload as Extract<ProposedAction, { kind: "schedule_review" }>["payload"];
    return `Agendar revisão “${p.title}” para ${p.dueDate}${p.subjectName ? ` — ${p.subjectName}` : ""}`;
  }
  const p = action.payload as Extract<ProposedAction, { kind: "create_goal" }>["payload"];
  return `Criar objetivo “${p.title}”${p.examDate ? ` (prova em ${p.examDate})` : ""}`;
}

const generatedQuestionSchema = z.object({
  statement: z.string().min(10).max(5000),
  type: z.enum(["multipla", "certo_errado"]).default("multipla"),
  options: z.array(z.string().min(1).max(500)).min(2).max(6),
  correctIndex: z.coerce.number().int().min(0),
  explanation: z.string().max(3000).optional().default(""),
  difficulty: z.coerce.number().int().min(1).max(5).default(3),
});

export type GeneratedQuestionSanitized = {
  statement: string;
  type: "multipla" | "certo_errado";
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: number;
};

/** Valida questões geradas por IA antes de exibir para revisão humana. */
export function parseGeneratedQuestions(raw: string, max = 10): GeneratedQuestionSanitized[] {
  const parsed = extractJson(raw);
  const list =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as { questions?: unknown }).questions
      : Array.isArray(parsed)
        ? parsed
        : [];
  if (!Array.isArray(list)) return [];
  const out: GeneratedQuestionSanitized[] = [];
  for (const item of list.slice(0, max)) {
    const q = generatedQuestionSchema.safeParse(item);
    if (!q.success) continue;
    const statement = q.data.statement.trim();
    if (statement.length < 10) continue;
    let options = q.data.options.map((o) => o.trim()).filter(Boolean);
    const correctIndex = q.data.correctIndex;
    if (q.data.type === "certo_errado") {
      if (correctIndex !== 0 && correctIndex !== 1) continue;
      options = ["Certo", "Errado"];
    }
    if (options.length < 2 || correctIndex >= options.length) continue;
    out.push({
      statement,
      type: q.data.type,
      options,
      correctIndex,
      explanation: (q.data.explanation ?? "").trim(),
      difficulty: q.data.difficulty,
    });
  }
  return out;
}

export function validateQuestionForSave(input: {
  statement: string;
  type: "multipla" | "certo_errado";
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: number;
}): GeneratedQuestionSanitized | null {
  const q = generatedQuestionSchema.safeParse(input);
  if (!q.success) return null;
  const statement = q.data.statement.trim();
  if (statement.length < 10) return null;
  let options = q.data.options.map((o) => o.trim()).filter(Boolean);
  const correctIndex = q.data.correctIndex;
  if (q.data.type === "certo_errado") {
    if (correctIndex !== 0 && correctIndex !== 1) return null;
    options = ["Certo", "Errado"];
  }
  if (options.length < 2 || correctIndex >= options.length) return null;
  return {
    statement,
    type: q.data.type,
    options,
    correctIndex,
    explanation: (q.data.explanation ?? "").trim(),
    difficulty: q.data.difficulty,
  };
}
