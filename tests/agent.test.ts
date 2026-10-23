import { describe, expect, it } from "vitest";
import {
  extractJson,
  normalizeTutorActions,
  parseGeneratedQuestions,
  parseTutorReply,
  validateQuestionForSave,
  type AgentContext,
} from "@/lib/agent";
import { addDays } from "@/lib/dates";

const today = "2026-10-23";
const ctx: AgentContext = {
  today,
  subjects: [
    { id: "sub-1", name: "Direito Constitucional" },
    { id: "sub-2", name: "Português" },
  ],
  hasActiveGoal: false,
};

describe("agente — parsing da resposta da IA", () => {
  it("extrai JSON mesmo cercado por cercas de código", () => {
    const raw = '```json\n{"reply":"Olá","actions":[]}\n```';
    expect(extractJson(raw)).toEqual({ reply: "Olá", actions: [] });
  });

  it("aceita texto puro como resposta sem ações", () => {
    const parsed = parseTutorReply("Estude revisão espaçada hoje.");
    expect(parsed.reply).toContain("revisão espaçada");
    expect(parsed.rawActions).toEqual([]);
  });

  it("não quebra com JSON inválido", () => {
    const parsed = parseTutorReply("{isso não é json");
    expect(parsed.reply.length).toBeGreaterThan(0);
    expect(parsed.rawActions).toEqual([]);
  });
});

describe("agente — validação de ações", () => {
  it("normaliza uma sessão válida para o ID real da matéria", () => {
    const result = normalizeTutorActions(
      [
        {
          kind: "create_session",
          payload: {
            date: addDays(today, 1),
            startMinute: 19 * 60,
            plannedMinutes: 50,
            subjectName: "direito constitucional",
            kind: "estudo",
            notes: "Revisar controle de constitucionalidade",
          },
        },
      ],
      ctx,
    );
    expect(result.warnings).toEqual([]);
    expect(result.actions).toHaveLength(1);
    const action = result.actions[0];
    expect(action.kind).toBe("create_session");
    if (action.kind === "create_session") {
      expect(action.payload.subjectId).toBe("sub-1");
      expect(action.payload.date).toBe(addDays(today, 1));
    }
  });

  it("ignora matéria de terceiros/inexistente", () => {
    const result = normalizeTutorActions(
      [
        {
          kind: "create_session",
          payload: {
            date: addDays(today, 1),
            startMinute: 600,
            plannedMinutes: 50,
            subjectName: "Matéria de outro usuário",
            kind: "estudo",
          },
        },
      ],
      ctx,
    );
    expect(result.actions).toEqual([]);
    expect(result.warnings[0]).toContain("não encontrada");
  });

  it("ignora datas passadas ou fora do limite", () => {
    const result = normalizeTutorActions(
      [
        {
          kind: "create_session",
          payload: {
            date: "2020-01-01",
            startMinute: 600,
            plannedMinutes: 50,
            subjectName: "Português",
            kind: "estudo",
          },
        },
      ],
      ctx,
    );
    expect(result.actions).toEqual([]);
    expect(result.warnings[0]).toContain("data");
  });

  it("transforma dueInDays em data real de revisão", () => {
    const result = normalizeTutorActions(
      [{ kind: "schedule_review", payload: { title: "Crase", subjectName: "Português", dueInDays: 2 } }],
      ctx,
    );
    expect(result.actions[0].kind).toBe("schedule_review");
    if (result.actions[0].kind === "schedule_review") {
      expect(result.actions[0].payload.dueDate).toBe(addDays(today, 2));
      expect(result.actions[0].payload.subjectId).toBe("sub-2");
    }
  });

  it("não propõe novo objetivo quando já existe um ativo", () => {
    const result = normalizeTutorActions(
      [
        {
          kind: "create_goal",
          payload: {
            title: "PF 2027",
            examName: "Polícia Federal",
            examDate: null,
            weeklyHoursTarget: 12,
            sessionMinutes: 50,
          },
        },
      ],
      { ...ctx, hasActiveGoal: true },
    );
    expect(result.actions).toEqual([]);
    expect(result.warnings[0]).toContain("objetivo ativo");
  });

  it("limita a três ações e remove duplicatas", () => {
    const raw = Array.from({ length: 5 }, () => ({
      kind: "schedule_review",
      payload: { title: "Crase", subjectName: "Português", dueInDays: 1 },
    }));
    const result = normalizeTutorActions(raw, ctx);
    expect(result.actions).toHaveLength(1);
  });
});

describe("agente — questões geradas", () => {
  it("valida questões e força Certo/Errado", () => {
    const raw = JSON.stringify({
      questions: [
        {
          statement: "A Constituição Federal é a norma fundamental do ordenamento jurídico brasileiro.",
          type: "certo_errado",
          options: ["Verdadeiro", "Falso"],
          correctIndex: 1,
          explanation: "A CF/88 é a norma fundamental.",
          difficulty: 2,
        },
      ],
    });
    const qs = parseGeneratedQuestions(raw);
    expect(qs).toHaveLength(1);
    expect(qs[0].options).toEqual(["Certo", "Errado"]);
    expect(qs[0].correctIndex).toBe(1);
  });

  it("descarta questões com gabarito fora das alternativas", () => {
    const raw = JSON.stringify({
      questions: [
        {
          statement: "Questão inválida com gabarito fora do intervalo permitido.",
          type: "multipla",
          options: ["A", "B"],
          correctIndex: 5,
          explanation: "",
          difficulty: 3,
        },
      ],
    });
    expect(parseGeneratedQuestions(raw)).toEqual([]);
  });

  it("só permite salvar questão revisada e válida", () => {
    const ok = validateQuestionForSave({
      statement: "Uma questão suficientemente longa para ser válida.",
      type: "multipla",
      options: ["A", "B", "C", "D"],
      correctIndex: 2,
      explanation: "Explicação.",
      difficulty: 3,
    });
    expect(ok?.correctIndex).toBe(2);

    const bad = validateQuestionForSave({
      statement: "Curta",
      type: "multipla",
      options: ["A", "B"],
      correctIndex: 0,
      explanation: "",
      difficulty: 3,
    });
    expect(bad).toBeNull();
  });
});
