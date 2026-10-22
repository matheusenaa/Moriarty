import { describe, expect, it } from "vitest";
import {
  itemParaQuestao,
  questoesParaCliente,
  simularResultado,
  sortearQuestoes,
  type ItemQuestao,
} from "@/lib/catalogQuiz";

function item(overrides: Partial<ItemQuestao> & { id: string }): ItemQuestao {
  return {
    kind: "questao",
    title: `Questão ${overrides.id}`,
    body: "Enunciado",
    options_json: JSON.stringify(["a", "b", "c", "d"]),
    correct_index: 1,
    explanation: "Porque sim.",
    origin_note: "NÃO é questão oficial.",
    ref_label: "Ref.",
    ...overrides,
  };
}

describe("simulado de trilha", () => {
  it("converte item do catálogo em questão quando há alternativas e gabarito", () => {
    const q = itemParaQuestao(item({ id: "a" }));
    expect(q).not.toBeNull();
    expect(q?.options).toEqual(["a", "b", "c", "d"]);
    expect(q?.correctIndex).toBe(1);
  });

  it("descarta itens sem alternativas suficientes ou sem gabarito", () => {
    expect(itemParaQuestao(item({ id: "b", options_json: JSON.stringify(["a"]) }))).toBeNull();
    expect(itemParaQuestao(item({ id: "c", correct_index: null }))).toBeNull();
    expect(itemParaQuestao(item({ id: "d", options_json: "quebrado" }))).toBeNull();
    expect(itemParaQuestao(item({ id: "e", correct_index: 9 }))).toBeNull();
  });

  it("sorteia apenas questões e respeita a quantidade pedida", () => {
    const itens = [
      item({ id: "q1" }),
      item({ id: "q2" }),
      item({ id: "q3" }),
      item({ id: "n1", kind: "nota" }),
    ];
    const sorteadas = sortearQuestoes(itens, 2, 42);
    expect(sorteadas).toHaveLength(2);
    expect(sorteadas.every((q) => q.id.startsWith("q"))).toBe(true);
  });

  it("mesma semente gera o mesmo sorteio (reprodutível nos testes)", () => {
    const itens = Array.from({ length: 8 }, (_, i) => item({ id: `q${i}` }));
    const a = sortearQuestoes(itens, 4, 7).map((q) => q.id);
    const b = sortearQuestoes(itens, 4, 7).map((q) => q.id);
    expect(a).toEqual(b);
  });

  it("nunca sorteia mais questões do que existem", () => {
    const itens = [item({ id: "q1" }), item({ id: "q2" })];
    expect(sortearQuestoes(itens, 20, 3)).toHaveLength(2);
  });

  it("corrige as respostas e monta o resultado", () => {
    const questoes = sortearQuestoes([item({ id: "q1" }), item({ id: "q2" })], 2, 1);
    const respostas = [{ itemId: questoes[0].id, chosenIndex: questoes[0].correctIndex }];
    const r = simularResultado(questoes, respostas);
    expect(r.total).toBe(2);
    expect(r.answered).toBe(1);
    expect(r.correct).toBe(1);
    expect(r.pct).toBe(50);
    expect(r.detalhes[0].correct).toBe(true);
    expect(r.detalhes[1].correct).toBe(false);
    expect(r.detalhes[1].chosenIndex).toBeNull();
  });

  it("percentual zero quando não há questões", () => {
    const r = simularResultado([], []);
    expect(r.pct).toBe(0);
    expect(r.total).toBe(0);
  });

  it("versão enviada ao cliente não carrega gabarito nem explicação", () => {
    const questoes = sortearQuestoes([item({ id: "q1" })], 1, 5);
    const cliente = questoesParaCliente(questoes);
    expect(cliente[0]).not.toHaveProperty("correctIndex");
    expect(cliente[0]).not.toHaveProperty("explanation");
    expect(cliente[0].options).toHaveLength(4);
  });
});
