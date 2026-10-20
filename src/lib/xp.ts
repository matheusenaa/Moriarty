/**
 * Gamificação discreta: XP por eventos verificados no servidor.
 * A idempotência é garantida pelo banco (UNIQUE em event_type/ref_table/ref_id),
 * não pela interface — repetir requisições não duplica pontos.
 */

export type XpEventType =
  | "sessao_concluida"
  | "revisao_realizada"
  | "simulado_finalizado"
  | "material_criado"
  | "sequencia_diaria";

export const XP_VALUES: Record<XpEventType, number> = {
  sessao_concluida: 25,
  revisao_realizada: 10,
  simulado_finalizado: 20,
  material_criado: 5,
  sequencia_diaria: 15,
};

export type Rank = {
  code: string;
  name: string;
  minXp: number;
};

/** Patentes temáticas, do iniciante ao mestre — voltadas à evolução nos estudos. */
export const RANKS: Rank[] = [
  { code: "aprendiz", name: "Aprendiz", minXp: 0 },
  { code: "escriba", name: "Escriba", minXp: 150 },
  { code: "analista", name: "Analista", minXp: 400 },
  { code: "investigador", name: "Pesquisador", minXp: 900 },
  { code: "dedutor", name: "Mestre do Conteúdo", minXp: 2000 },
  { code: "mestre", name: "Catedrático", minXp: 5000 },
];

export function rankForXp(xp: number): Rank {
  let current = RANKS[0];
  for (const r of RANKS) {
    if (xp >= r.minXp) current = r;
  }
  return current;
}

export function nextRank(xp: number): Rank | null {
  for (const r of RANKS) {
    if (xp < r.minXp) return r;
  }
  return null;
}

export function progressToNextRank(xp: number): { from: number; to: number; pct: number } {
  const current = rankForXp(xp);
  const next = nextRank(xp);
  if (!next) return { from: current.minXp, to: current.minXp, pct: 100 };
  const pct = Math.round(((xp - current.minXp) / (next.minXp - current.minXp)) * 100);
  return { from: current.minXp, to: next.minXp, pct: Math.max(0, Math.min(100, pct)) };
}

export type Achievement = { code: string; name: string; description: string };

export const ACHIEVEMENTS: Achievement[] = [
  { code: "primeira_sessao", name: "Primeiro passo", description: "Conclua sua primeira sessão de estudo." },
  { code: "dez_sessoes", name: "Rotina firme", description: "Conclua 10 sessões de estudo." },
  { code: "primeira_revisao", name: "Memória afiada", description: "Conclua sua primeira revisão." },
  { code: "primeiro_simulado", name: "Prova de fogo", description: "Finalize seu primeiro simulado." },
  { code: "cinco_materiais", name: "Biblioteca montada", description: "Cadastre 5 materiais na biblioteca." },
  { code: "sequencia_3", name: "Três dias seguidos", description: "Estude por 3 dias consecutivos." },
  { code: "sequencia_7", name: "Semana de constância", description: "Estude por 7 dias consecutivos." },
];

export function achievementByCode(code: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.code === code);
}
