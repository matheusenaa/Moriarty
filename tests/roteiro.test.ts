/**
 * Testes do gerador de roteiro de estudo (Markdown + HTML imprimível).
 * Verificam: inclusão das seções, aviso de direitos autorais, escape de HTML e
 * o documento imprimível completo.
 */
import { describe, expect, it } from "vitest";
import {
  montarRoteiro,
  documentoImprimivel,
  type ColecaoRoteiro,
  type ItemRoteiro,
} from "@/lib/roteiro";

const colecao: ColecaoRoteiro = {
  slug: "pmdf-cfo",
  title: "PMDF CFO",
  summary: "Trilha de teste.",
  status_note: "Status ok.",
  edital_ref: "Edital nº 03/2025",
  source_name: "Cebraspe",
  source_url: "https://exemplo.gov.br",
  checked_at: "2026-10-20",
};

const itens: ItemRoteiro[] = [
  { kind: "area", category: "oficial", title: "Língua Portuguesa", body: "", ref_label: "", url: "" },
  { kind: "area", category: "oficial", title: "Direito Penal", body: "", ref_label: "", url: "" },
  {
    kind: "nota",
    category: "resumo_proprio",
    title: "Cronograma sugerido — PMDF (12 semanas)",
    body: "Semanas 1-3: base.",
    ref_label: "Sugestão de estudo (não oficial)",
    url: "",
  },
  {
    kind: "nota",
    category: "resumo_proprio",
    title: "Nota de Teste",
    body: "Conteúdo da nota.",
    ref_label: "Lei X",
    url: "https://www.planalto.gov.br",
  },
  {
    kind: "flashcard",
    category: "flashcard",
    title: "Flashcard 1",
    body: "Frente: pergunta?\n\nVerso: resposta.",
    ref_label: "",
    url: "",
  },
  {
    kind: "nota",
    category: "resumo_proprio",
    title: "Fontes oficiais — PMDF CFO 2025",
    body: "Página oficial.",
    ref_label: "Fonte oficial",
    url: "https://www.cebraspe.org.br",
  },
];

describe("montarRoteiro", () => {
  const r = montarRoteiro(colecao, itens, "2026-10-21");

  it("gera título e metadados", () => {
    expect(r.markdown).toContain("# Roteiro de estudo — PMDF CFO");
    expect(r.markdown).toContain("Edital de referência");
    expect(r.markdown).toContain("2026-10-21");
  });

  it("inclui matérias, cronograma, notas, flashcards e fontes", () => {
    expect(r.markdown).toContain("## Matérias (2)");
    expect(r.markdown).toContain("## Cronograma sugerido");
    expect(r.markdown).toContain("## Notas de estudo (1)");
    expect(r.markdown).toContain("## Flashcards (1)");
    expect(r.markdown).toContain("## Fontes oficiais (1)");
    expect(r.markdown).toContain("https://www.cebraspe.org.br");
  });

  it("inclui o aviso de direitos autorais", () => {
    expect(r.markdown.toLowerCase()).toContain("não são questões de prova oficial");
  });

  it("não lista o cronograma nem as fontes como nota comum", () => {
    expect(r.markdown).toContain("## Notas de estudo (1)");
    expect(r.html).toContain("Nota de Teste");
    expect(r.html).not.toContain("Cronograma sugerido — PMDF (12 semanas)</h3>");
  });

  it("escapa HTML no corpo dos itens", () => {
    const comHtml = montarRoteiro(
      colecao,
      [
        {
          kind: "nota",
          category: "resumo_proprio",
          title: "X",
          body: "<script>alert(1)</script>",
          ref_label: "",
          url: "",
        },
      ],
      "2026-10-21",
    );
    expect(comHtml.html).not.toContain("<script>");
    expect(comHtml.html).toContain("&lt;script&gt;");
  });
});

describe("documentoImprimivel", () => {
  it("produz um HTML completo com doctype, título e estilos de impressão", () => {
    const r = montarRoteiro(colecao, itens, "2026-10-21");
    const doc = documentoImprimivel(r);
    expect(doc).toContain("<!doctype html>");
    expect(doc).toContain("<title>");
    expect(doc).toContain("@media print");
    expect(doc).toContain(r.html);
  });
});
