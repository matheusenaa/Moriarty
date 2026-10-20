/**
 * Motor de revisão espaçada — SM-2 simplificado, determinístico e testável.
 *
 * Escala de resultado do usuário:
 *   nao_lembrei | dificil | bom | facil
 *
 * Regras documentadas:
 * - Item novo (reps = 0): primeiro intervalo sempre 1 dia.
 * - Depois: intervalo_novo = max(1, arredondar(intervalo_atual * ease * fator))
 *   fator: nao_lembrei = 0, dificil = 0.6, bom = 1.0, facil = 1.3
 * - Ajuste de ease: nao_lembrei -0.25, dificil -0.15, bom 0, facil +0.15
 *   ease limitado entre 1.3 e 2.8.
 * - "não lembrei" conta como lapso, zera o progresso de intervalo (próximo = 1 dia).
 */

export type ReviewResult = "facil" | "bom" | "dificil" | "nao_lembrei";

export type SrsState = {
  intervalDays: number;
  ease: number;
  reps: number;
  lapses: number;
};

export const SRS_INITIAL_INTERVALS = [1, 7, 30] as const;
export const EASE_MIN = 1.3;
export const EASE_MAX = 2.8;
export const DEFAULT_EASE = 2.5;

const FACTOR: Record<ReviewResult, number> = {
  nao_lembrei: 0,
  dificil: 0.6,
  bom: 1,
  facil: 1.3,
};

const EASE_DELTA: Record<ReviewResult, number> = {
  nao_lembrei: -0.25,
  dificil: -0.15,
  bom: 0,
  facil: 0.15,
};

export const RESULT_LABELS: Record<ReviewResult, string> = {
  facil: "Fácil",
  bom: "Bom",
  dificil: "Difícil",
  nao_lembrei: "Não lembrei",
};

function clampEase(ease: number): number {
  return Math.min(EASE_MAX, Math.max(EASE_MIN, ease));
}

export function nextIntervalDays(state: SrsState, result: ReviewResult): number {
  if (result === "nao_lembrei") return 1;
  if (state.reps === 0) return SRS_INITIAL_INTERVALS[0];
  const raw = state.intervalDays * state.ease * FACTOR[result];
  return Math.max(1, Math.round(raw));
}

export function applyReview(state: SrsState, result: ReviewResult): SrsState {
  const interval = nextIntervalDays(state, result);
  const ease = clampEase(state.ease + EASE_DELTA[result]);
  const lapses = state.lapses + (result === "nao_lembrei" ? 1 : 0);
  return {
    intervalDays: interval,
    ease,
    reps: state.reps + 1,
    lapses,
  };
}

export function newState(): SrsState {
  return { intervalDays: 0, ease: DEFAULT_EASE, reps: 0, lapses: 0 };
}

export function dueLabel(dueDate: string, today: string): string {
  const diff = Math.round(
    (Date.parse(dueDate + "T00:00:00Z") - Date.parse(today + "T00:00:00Z")) / 86400000,
  );
  if (diff < -1) return `Atrasada há ${Math.abs(diff)} dias`;
  if (diff === -1) return "Atrasada há 1 dia";
  if (diff === 0) return "Vence hoje";
  if (diff === 1) return "Vence amanhã";
  return `Vence em ${diff} dias`;
}
