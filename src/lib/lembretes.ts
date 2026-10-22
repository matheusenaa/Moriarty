import { minuteToHHMM } from "@/lib/dates";

/** Rótulos curtos dos dias da semana (0 = domingo). */
export const DIAS_NOMES = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

/** Texto amigável para os dias marcados no lembrete. */
export function descreverDias(dias: number[]): string {
  if (dias.length === 0) return "nenhum dia";
  if (dias.length === 7) return "todos os dias";
  const ordenados = [...dias].sort((a, b) => a - b);
  const chave = ordenados.join(",");
  if (chave === "1,2,3,4,5") return "dias úteis";
  if (chave === "0,6") return "finais de semana";
  if (chave === "1,2,3,4,5,6") return "segunda a sábado";
  return ordenados.map((d) => DIAS_NOMES[d]).join(", ");
}

/** Descrição curta do lembrete: "Revisão às 09:00 (dias úteis)". */
export function descreverLembrete(kind: string, timeMinute: number, dias: number[]): string {
  const quando = `às ${minuteToHHMM(timeMinute)} (${descreverDias(dias)})`;
  return kind === "sessao" ? `Sessão de estudo ${quando}` : `Revisão ${quando}`;
}
