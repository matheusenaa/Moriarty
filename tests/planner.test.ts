import { describe, expect, it } from "vitest";
import { planSchedule, validatePlannerInput, type PlannerInput } from "@/lib/planner";

function baseInput(): PlannerInput {
  return {
    today: "2026-03-02", // segunda
    examDate: "2026-04-15",
    sessionMinutes: 50,
    weeklyHoursTarget: 10,
    subjects: [
      { id: "s1", name: "Direito", priority: 5, mastery: 1 },
      { id: "s2", name: "Português", priority: 3, mastery: 3 },
      { id: "s3", name: "Matemática", priority: 4, mastery: 2 },
    ],
    availability: [
      { weekday: 1, startMinute: 19 * 60, endMinute: 22 * 60 },
      { weekday: 3, startMinute: 19 * 60, endMinute: 22 * 60 },
      { weekday: 6, startMinute: 9 * 60, endMinute: 12 * 60 },
    ],
    unavailableDates: [],
    existing: [],
    reserveReviews: true,
    reserveSimulated: true,
    maxDaysAhead: 14,
  };
}

describe("gerador determinístico de cronograma", () => {
  it("gera sessões apenas em dias disponíveis", () => {
    const out = planSchedule(baseInput());
    expect(out.sessions.length).toBeGreaterThan(0);
    for (const s of out.sessions) {
      const wd = new Date(s.date + "T00:00:00Z").getUTCDay();
      expect([1, 3, 6]).toContain(wd);
    }
  });

  it("respeita a duração da sessão e a janela disponível", () => {
    const input = baseInput();
    const out = planSchedule(input);
    const windowByWeekday = new Map(input.availability.map((a) => [a.weekday, a]));
    for (const s of out.sessions) {
      expect(s.plannedMinutes).toBe(50);
      const wd = new Date(s.date + "T00:00:00Z").getUTCDay();
      const slot = windowByWeekday.get(wd)!;
      expect(s.startMinute).toBeGreaterThanOrEqual(slot.startMinute);
      expect(s.startMinute + s.plannedMinutes).toBeLessThanOrEqual(slot.endMinute);
    }
  });

  it("prioriza matéria com maior prioridade e menor domínio", () => {
    const out = planSchedule(baseInput());
    const estudo = out.sessions.filter((s) => s.kind === "estudo");
    const bySubject: Record<string, number> = {};
    for (const s of estudo) bySubject[s.subjectId] = (bySubject[s.subjectId] ?? 0) + 1;
    expect(bySubject["s1"] ?? 0).toBeGreaterThanOrEqual(bySubject["s2"] ?? 0);
  });

  it("preserva sessões existentes na contagem de ocupação", () => {
    const input = baseInput();
    input.existing = [
      { date: "2026-03-02", startMinute: 19 * 60, plannedMinutes: 50, subjectId: "s1", status: "concluida" },
    ];
    const out = planSchedule(input);
    const monday = out.sessions.filter((s) => s.date === "2026-03-02");
    // A primeira vaga (19:00) está ocupada; as novas começam depois.
    for (const s of monday) {
      expect(s.startMinute).toBeGreaterThanOrEqual(19 * 60 + 50 + 10);
    }
  });

  it("não gera nada sem disponibilidade e avisa", () => {
    const input = baseInput();
    input.availability = [];
    const out = planSchedule(input);
    expect(out.sessions).toHaveLength(0);
    expect(out.warnings.length).toBeGreaterThan(0);
  });

  it("não gera nada sem matérias", () => {
    const input = baseInput();
    input.subjects = [];
    const out = planSchedule(input);
    expect(out.sessions).toHaveLength(0);
  });

  it("respeita datas indisponíveis", () => {
    const input = baseInput();
    input.unavailableDates = ["2026-03-02", "2026-03-04", "2026-03-07"];
    const out = planSchedule(input);
    expect(out.sessions.filter((s) => ["2026-03-02", "2026-03-04", "2026-03-07"].includes(s.date))).toHaveLength(0);
  });

  it("inclui explicações para o usuário", () => {
    const out = planSchedule(baseInput());
    expect(out.explanation.length).toBeGreaterThan(0);
  });

  it("valida entradas", () => {
    const input = baseInput();
    input.sessionMinutes = 5;
    expect(validatePlannerInput(input).length).toBeGreaterThan(0);
  });
});
