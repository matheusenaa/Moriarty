/**
 * Camada adaptadora de IA — 100% opcional.
 *
 * Se AI_PROVIDER/AI_API_KEY não estiverem configurados, qualquer chamada
 * lança NotConfiguredError e o sistema usa o motor determinístico local.
 * A chave jamais é exposta ao navegador: este módulo só roda no servidor.
 */

import { planSchedule, type PlannerInput, type PlannerOutput } from "./planner";

export class NotConfiguredError extends Error {
  constructor() {
    super("Provedor de IA não configurado.");
    this.name = "NotConfiguredError";
  }
}

export class ProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderError";
  }
}

export function aiConfigured(): boolean {
  return Boolean(process.env.AI_PROVIDER && process.env.AI_API_KEY);
}

export function aiInfo(): { configured: boolean; provider: string; dailyLimit: number } {
  return {
    configured: aiConfigured(),
    provider: process.env.AI_PROVIDER || "nenhum",
    dailyLimit: Number(process.env.AI_DAILY_LIMIT || 20),
  };
}

type AiSession = {
  date: string;
  startMinute: number;
  plannedMinutes: number;
  subjectName: string;
  kind: string;
  reason: string;
};

type AiPlan = { sessions: AiSession[]; explanation: string[] };

/**
 * Tenta sugerir um plano com IA. Em qualquer falha (sem chave, timeout,
 * limite, JSON inválido) retorna o plano determinístico local, sinalizando
 * a origem — a plataforma nunca fica inutilizável por causa da IA.
 */
export async function suggestSchedule(input: PlannerInput): Promise<PlannerOutput & { source: "deterministico" | "ia"; aiNote?: string }> {
  const fallback = planSchedule(input);
  if (!aiConfigured()) {
    return { ...fallback, source: "deterministico", aiNote: "IA não configurada; plano gerado pelo algoritmo local." };
  }
  try {
    const subjectNames = input.subjects.map((s) => s.name);
    const prompt = `Você é um planejador de estudos. Gere um plano para o usuário.
Disponibilidade (dia 0=domingo..6=sábado, minutos desde 00:00): ${JSON.stringify(input.availability)}
Matérias (nome, prioridade 1-5, domínio 0-5): ${JSON.stringify(input.subjects.map((s) => [s.name, s.priority, s.mastery]))}
Sessão de ${input.sessionMinutes} minutos. Meta semanal: ${input.weeklyHoursTarget}h. Hoje: ${input.today}. Prova: ${input.examDate ?? "sem data"}.
Responda SOMENTE JSON: {"sessions":[{"date":"AAAA-MM-DD","startMinute":0,"plannedMinutes":50,"subjectName":"...","kind":"estudo|revisao|simulado","reason":"..."}],"explanation":["..."]}.
Máximo 21 dias, respeite a disponibilidade e a lista de matérias: ${JSON.stringify(subjectNames)}.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + (process.env.AI_MODEL || "gemini-2.0-flash") + ":generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.AI_API_KEY || "",
      },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new ProviderError(`Provedor respondeu ${res.status}.`);
    const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new ProviderError("Resposta vazia do provedor.");
    const parsed = JSON.parse(text) as AiPlan;
    if (!Array.isArray(parsed.sessions)) throw new ProviderError("Resposta da IA sem campo sessions.");

    // Validação do servidor: só aceita sessões cujas matérias existem e datas são válidas.
    const byName = new Map(input.subjects.map((s) => [s.name, s.id]));
    const sessions = parsed.sessions
      .filter((s) => byName.has(s.subjectName) && /^\d{4}-\d{2}-\d{2}$/.test(s.date))
      .slice(0, 200)
      .map((s) => ({
        date: s.date,
        startMinute: Number(s.startMinute) || 0,
        plannedMinutes: Number(s.plannedMinutes) || input.sessionMinutes,
        subjectId: byName.get(s.subjectName)!,
        kind: (["estudo", "revisao", "simulado"].includes(s.kind) ? s.kind : "estudo") as "estudo" | "revisao" | "simulado",
        reason: typeof s.reason === "string" ? s.reason.slice(0, 300) : "Sugestão da IA.",
      }));
    if (sessions.length === 0) throw new ProviderError("IA não retornou sessões válidas.");

    return {
      sessions,
      explanation: (parsed.explanation ?? []).slice(0, 12).map((e) => String(e).slice(0, 300)),
      warnings: ["Plano sugerido por IA. Revise antes de salvar; a IA pode não conhecer seu edital."],
      source: "ia",
      aiNote: "Plano gerado com IA e validado pelo servidor.",
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "erro desconhecido";
    return {
      ...fallback,
      source: "deterministico",
      aiNote: `IA indisponível (${msg}). Plano gerado pelo algoritmo local determinístico.`,
    };
  }
}
