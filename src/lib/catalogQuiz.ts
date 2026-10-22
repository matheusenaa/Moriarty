/**
 * Simulado de trilha: sorteio das questões, correção e resultado.
 *
 * Funções puras (sem banco e sem servidor) — o gabarito é sempre conferido aqui,
 * no servidor, a partir do item do catálogo; o cliente nunca recebe o gabarito.
 */
import { shuffleComSemente } from "@/lib/quiz";

export type QuestaoSimulado = {
  id: string;
  statement: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  originNote: string;
  refLabel: string;
};

export type ItemQuestao = {
  id: string;
  kind: string;
  title: string;
  body: string;
  options_json: string;
  correct_index: number | null;
  explanation: string;
  origin_note: string;
  ref_label: string;
};

export type RespostaSimulado = { itemId: string; chosenIndex: number };

export type DetalheSimulado = {
  itemId: string;
  statement: string;
  options: string[];
  chosenIndex: number | null;
  correctIndex: number;
  correct: boolean;
  explanation: string;
  originNote: string;
  refLabel: string;
};

export type ResultadoSimulado = {
  total: number;
  answered: number;
  correct: number;
  pct: number;
  detalhes: DetalheSimulado[];
};

/** Converte um item do catálogo em questão de simulado (sem gabarito). */
export function itemParaQuestao(item: ItemQuestao): QuestaoSimulado | null {
  let options: string[] = [];
  try {
    const parsed = JSON.parse(item.options_json || "[]");
    if (Array.isArray(parsed)) options = parsed.map((o) => String(o));
  } catch {
    options = [];
  }
  const correctIndex = item.correct_index ?? -1;
  if (options.length < 2 || correctIndex < 0 || correctIndex >= options.length) return null;
  return {
    id: item.id,
    statement: item.body,
    options,
    correctIndex,
    explanation: item.explanation ?? "",
    originNote: item.origin_note ?? "",
    refLabel: item.ref_label ?? "",
  };
}

/** Sorteia as questões do simulado (determinístico com a semente informada). */
export function sortearQuestoes(
  itens: ItemQuestao[],
  quantidade: number,
  seed: number,
): QuestaoSimulado[] {
  const validas = itens
    .filter((i) => i.kind === "questao")
    .map(itemParaQuestao)
    .filter((q): q is QuestaoSimulado => q !== null);
  const embaralhadas = shuffleComSemente(validas, seed);
  const limite = Math.max(1, Math.min(quantidade, embaralhadas.length));
  return embaralhadas.slice(0, limite);
}

/** Corrige as respostas e monta o resultado detalhado. */
export function simularResultado(
  questoes: QuestaoSimulado[],
  respostas: RespostaSimulado[],
): ResultadoSimulado {
  const mapa = new Map(respostas.map((r) => [r.itemId, r.chosenIndex]));
  const detalhes: DetalheSimulado[] = questoes.map((q) => {
    const chosenIndex = mapa.has(q.id) ? (mapa.get(q.id) as number) : null;
    return {
      itemId: q.id,
      statement: q.statement,
      options: q.options,
      chosenIndex,
      correctIndex: q.correctIndex,
      correct: chosenIndex !== null && chosenIndex === q.correctIndex,
      explanation: q.explanation,
      originNote: q.originNote,
      refLabel: q.refLabel,
    };
  });
  const correct = detalhes.filter((d) => d.correct).length;
  const answered = detalhes.filter((d) => d.chosenIndex !== null).length;
  return {
    total: detalhes.length,
    answered,
    correct,
    pct: detalhes.length === 0 ? 0 : Math.round((correct / detalhes.length) * 100),
    detalhes,
  };
}

/** Versão sem gabarito, segura para enviar ao navegador. */
export type QuestaoCliente = Omit<QuestaoSimulado, "correctIndex" | "explanation">;

export function questoesParaCliente(questoes: QuestaoSimulado[]): QuestaoCliente[] {
  return questoes.map((q) => ({
    id: q.id,
    statement: q.statement,
    options: q.options,
    originNote: q.originNote,
    refLabel: q.refLabel,
  }));
}
