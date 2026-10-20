import { describe, expect, it } from "vitest";
import { applyReview, DEFAULT_EASE, nextIntervalDays, newState, dueLabel, EASE_MIN, EASE_MAX } from "@/lib/srs";

describe("motor de revisão espaçada (SM-2 simplificado)", () => {
  it("primeiro intervalo é sempre 1 dia", () => {
    expect(nextIntervalDays(newState(), "bom")).toBe(1);
    expect(nextIntervalDays(newState(), "facil")).toBe(1);
    expect(nextIntervalDays(newState(), "dificil")).toBe(1);
  });

  it("cresce o intervalo com 'bom' após a primeira revisão", () => {
    let state = applyReview(newState(), "bom"); // intervalo 1
    state = applyReview(state, "bom"); // 1 * 2.5 * 1.0 = 2.5 → 3
    expect(state.intervalDays).toBe(3);
    state = applyReview(state, "bom"); // 3 * 2.5 = 7.5 → 8
    expect(state.intervalDays).toBe(8);
  });

  it("'facil' acelera e 'dificil' reduz o crescimento", () => {
    const base = { intervalDays: 10, ease: DEFAULT_EASE, reps: 3, lapses: 0 };
    expect(nextIntervalDays(base, "facil")).toBe(Math.round(10 * DEFAULT_EASE * 1.3));
    expect(nextIntervalDays(base, "dificil")).toBe(Math.round(10 * DEFAULT_EASE * 0.6));
  });

  it("'não lembrei' zera para 1 dia, conta lapso e reduz ease com piso", () => {
    let state = { intervalDays: 30, ease: EASE_MIN, reps: 5, lapses: 0 };
    state = applyReview(state, "nao_lembrei");
    expect(state.intervalDays).toBe(1);
    expect(state.lapses).toBe(1);
    expect(state.ease).toBe(EASE_MIN); // piso não ultrapassado
  });

  it("ease respeita teto e piso", () => {
    let state = newState();
    for (let i = 0; i < 10; i++) state = applyReview(state, "facil");
    expect(state.ease).toBeLessThanOrEqual(EASE_MAX);
    for (let i = 0; i < 10; i++) state = applyReview(state, "nao_lembrei");
    expect(state.ease).toBeGreaterThanOrEqual(EASE_MIN);
  });

  it("rótulos de vencimento", () => {
    expect(dueLabel("2026-01-10", "2026-01-10")).toBe("Vence hoje");
    expect(dueLabel("2026-01-11", "2026-01-10")).toBe("Vence amanhã");
    expect(dueLabel("2026-01-08", "2026-01-10")).toBe("Atrasada há 2 dias");
  });
});
