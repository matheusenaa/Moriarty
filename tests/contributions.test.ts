import { describe, expect, it } from "vitest";
import {
  validarContribuicao,
  normalizarContribuicao,
  itemDaContribuicao,
  textoFlashcard,
  TIPOS_CONTRIBUICAO,
  tipoContribuicao,
  LIMITE_CORPO,
  LIMITE_ALTERNATIVAS,
} from "@/lib/contributions";

function base(): Parameters<typeof validarContribuicao>[0] {
  return {
    collectionSlug: "pf-policial-2025",
    kind: "nota",
    title: "Resumo válido",
    body: "Conteúdo com mais de dez caracteres para passar.",
    options: [],
    correctIndex: null,
    explanation: "",
    sourceUrl: "",
    sourceLabel: "",
  };
}

describe("validação de contribuições", () => {
  it("aceita nota válida", () => {
    expect(validarContribuicao(base())).toHaveLength(0);
  });

  it("rejeita título curto", () => {
    expect(validarContribuicao({ ...base(), title: "ab" })).toEqual([
      "O título precisa de pelo menos 3 caracteres.",
    ]);
  });

  it("rejeita corpo curto", () => {
    expect(validarContribuicao({ ...base(), body: "curto" })).toEqual([
      "Escreva o conteúdo (mínimo 10 caracteres).",
    ]);
  });

  it("rejeita corpo longo demais", () => {
    const longo = "a".repeat(LIMITE_CORPO + 1);
    expect(validarContribuicao({ ...base(), body: longo })).toEqual([
      `O conteúdo precisa ter no máximo ${LIMITE_CORPO} caracteres.`,
    ]);
  });

  it("questão: precisa de pelo menos 2 alternativas", () => {
    expect(
      validarContribuicao({
        ...base(),
        kind: "questao",
        options: ["a"],
        correctIndex: 0,
        explanation: "Explicação válida para o gabarito.",
      }),
    ).toEqual(["A questão precisa de pelo menos 2 alternativas."]);
  });

  it("questão: rejeita mais de 6 alternativas", () => {
    const opts = ["1", "2", "3", "4", "5", "6", "7"];
    expect(
      validarContribuicao({
        ...base(),
        kind: "questao",
        options: opts,
        correctIndex: 0,
        explanation: "Explicação válida para o gabarito.",
      }),
    ).toEqual([`A questão pode ter no máximo ${LIMITE_ALTERNATIVAS} alternativas.`]);
  });

  it("questão: precisa de gabarito válido", () => {
    expect(
      validarContribuicao({
        ...base(),
        kind: "questao",
        options: ["a", "b"],
        correctIndex: -1,
        explanation: "Explicação válida para o gabarito.",
      }),
    ).toEqual(["Indique qual alternativa é o gabarito."]);
  });

  it("questão: precisa de explicação", () => {
    expect(
      validarContribuicao({
        ...base(),
        kind: "questao",
        options: ["a", "b"],
        correctIndex: 0,
        explanation: "curta",
      }),
    ).toEqual(["Explique por que a alternativa correta é a correta."]);
  });

  it("flashcard: exige formato Frente/Verso", () => {
    expect(
      validarContribuicao({ ...base(), kind: "flashcard", body: "sem formatação" }),
    ).toEqual(['Use o formato "Frente: ..." e "Verso: ..." no conteúdo do flashcard.']);
  });

  it("flashcard: aceita formato correto", () => {
    expect(
      validarContribuicao({
        ...base(),
        kind: "flashcard",
        body: "Frente: O que é? Verso: É isso.",
      }),
    ).toHaveLength(0);
  });

  it("fonte: valida URL", () => {
    expect(validarContribuicao({ ...base(), sourceUrl: "nao-e-url" })).toEqual([
      "O link da fonte precisa ser um endereço completo (http:// ou https://).",
    ]);
  });

  it("normaliza: trim e remove alternativas vazias", () => {
    const n = normalizarContribuicao({
      ...base(),
      kind: "questao",
      title: "  Título  ",
      body: "  Corpo válido aqui  ",
      options: ["  a  ", "", "  b  ", "   "],
      correctIndex: 1,
      explanation: "  Explicação ok  ",
      sourceUrl: "  https://exemplo.com  ",
      sourceLabel: "  Fonte  ",
    });
    expect(n.title).toBe("Título");
    expect(n.body).toBe("Corpo válido aqui");
    expect(n.options).toEqual(["a", "b"]);
    expect(n.correctIndex).toBe(1);
    expect(n.explanation).toBe("Explicação ok");
    expect(n.sourceUrl).toBe("https://exemplo.com");
    expect(n.sourceLabel).toBe("Fonte");
  });

  it("itemDaContribuicao: cria item com categoria e autoria", () => {
    const d = normalizarContribuicao({
      ...base(),
      kind: "questao",
      options: ["a", "b"],
      correctIndex: 0,
      explanation: "Porque sim.",
    });
    const item = itemDaContribuicao(d, { id: "catalog:pf-policial-2025:questao:c1", autor: "João", sortOrder: 5 });
    expect(item.kind).toBe("questao");
    expect(item.category).toBe("questao_autoral");
    expect(item.correct_index).toBe(0);
    expect(item.origin_note).toContain("Questão autoral de João");
    expect(item.origin_note).toContain("NÃO é questão oficial");
    expect(item.sort_order).toBe(5);
  });

  it("itemDaContribuicao: flashcard vira categoria flashcard", () => {
    const d = normalizarContribuicao({
      ...base(),
      kind: "flashcard",
      body: "Frente: P Verso: R",
    });
    const item = itemDaContribuicao(d, { id: "x", autor: "A", sortOrder: 1 });
    expect(item.category).toBe("flashcard");
    expect(item.origin_note).toContain("Flashcard autoral de A");
  });

  it("itemDaContribuicao: nota vira resumo_proprio", () => {
    const d = normalizarContribuicao({ ...base(), kind: "nota" });
    const item = itemDaContribuicao(d, { id: "x", autor: "A", sortOrder: 1 });
    expect(item.category).toBe("resumo_proprio");
  });

  it("tipoContribuicao: reconhece valores válidos", () => {
    expect(tipoContribuicao("nota")).toBe(true);
    expect(tipoContribuicao("questao")).toBe(true);
    expect(tipoContribuicao("flashcard")).toBe(true);
    expect(tipoContribuicao("outro")).toBe(false);
  });

  it("textoFlashcard: formata frente/verso", () => {
    expect(textoFlashcard("Pergunta", "Resposta")).toBe("Frente: Pergunta\nVerso: Resposta");
  });

  it("TIPOS_CONTRIBUICAO: tem 3 itens", () => {
    expect(TIPOS_CONTRIBUICAO).toHaveLength(3);
  });
});