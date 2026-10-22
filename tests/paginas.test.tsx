/**
 * Testes de RENDER das páginas (server components) das trilhas de concursos.
 *
 * As páginas são renderizadas de verdade (ReactDOM server) com o repositório
 * mockado — é o que garante que a página não quebra em runtime (o mesmo bug do
 * `splitFlashcard` que era exportado por um módulo "use client").
 */
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const f = vi.hoisted(() => {
  const agora = "2026-10-20T00:00:00.000Z";
  const collection = {
    id: "col-1",
    slug: "pmdf-cfo",
    title: "PMDF — CFO",
    discipline_label: "Direito",
    summary: "Trilha de CFO da Polícia Civil do Distrito Federal.",
    status: "vigente",
    status_note: "Edital publicado.",
    source_name: "Polícia Civil do DF",
    source_url: "https://www.policiacivil.df.gov.br/",
    edital_ref: "Edital 1/2025",
    checked_at: "2026-10-20",
    created_at: agora,
    updated_at: agora,
  };
  const nota = {
    id: "catalog:pmdf-cfo:nota:1",
    collection_id: "col-1",
    kind: "nota",
    category: "resumo_proprio",
    title: "Princípios da Administração Pública",
    body: "LIMPE: legalidade, impessoalidade, moralidade, publicidade e eficiência.",
    options_json: "[]",
    correct_index: null,
    explanation: "",
    origin_note: "Autoral para prática.",
    ref_label: "CF/88 art. 37",
    url: "",
    sort_order: 1,
    created_at: agora,
    updated_at: agora,
  };
  const flashcard = {
    ...nota,
    id: "catalog:pmdf-cfo:flashcard:1",
    kind: "flashcard",
    title: "Q1",
    body: "O que éempio? --- Resposta: Exemplo de verso.",
    sort_order: 20,
  };
  const questao = {
    ...nota,
    id: "catalog:pmdf-cfo:questao:1",
    kind: "questao",
    title: "Questão autoral PMDF-01",
    body: "Segundo a CF/88, são princípios expressos da Administração Pública:",
    options_json: '["legalidade e moralidade","eficiência e economicidade"]',
    correct_index: 0,
    explanation: "Os princípios expressos são legalidade, impessoalidade, moralidade, publicidade e eficiência.",
    origin_note: "Autoral/gerada para prática — NÃO é questão oficial.",
    sort_order: 100,
  };
  return { collection, nota, flashcard, questao };
});

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(async () => ({
    id: "u1",
    email: "aluno@teste.local",
    username: "aluno",
    displayName: "Aluno Teste",
    timezone: "America/Sao_Paulo",
    onboarded: true,
    gamificationEnabled: true,
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("notFound");
  }),
}));

vi.mock("@/actions/catalog", () => ({
  saveCatalogItemAction: vi.fn(async () => ({ ok: true })),
  scheduleCatalogItemReviewAction: vi.fn(async () => ({ ok: true })),
  importCollectionSubjectsAction: vi.fn(async () => ({ ok: true })),
  answerCatalogQuestionAction: vi.fn(async () => ({ ok: true })),
  setCatalogItemProgressAction: vi.fn(async () => ({ ok: true })),
}));

vi.mock("@/lib/repo/catalog", async (importOriginal) => {
  const original = (await importOriginal()) as Record<string, unknown>;
  return {
    ...original,
    searchCollections: vi.fn(async () => [f.collection]),
    collectionCounts: vi.fn(async () => ({ area: 2, nota: 3, questao: 1, flashcard: 4 })),
    getCollectionWithItems: vi.fn(async () => ({
      collection: f.collection,
      items: [f.nota, f.flashcard, f.questao],
    })),
    getUserProgressMap: vi.fn(async () => ({ "catalog:pmdf-cfo:nota:1": "lido" })),
    collectionProgressCounts: vi.fn(async () => ({ lido: 1, dominado: 0 })),
    getUserQuestionResults: vi.fn(async () => ({})),
    collectionQuestionStats: vi.fn(async () => ({ answered: 0, correct: 0 })),
  };
});

import ConcursosPage from "@/app/(app)/biblioteca/concursos/page";
import ColecaoPage from "@/app/(app)/biblioteca/concursos/[slug]/page";

describe("página de concursos (server component)", () => {
  it("lista as trilhas com status, contagens e data de verificação", async () => {
    const html = renderToStaticMarkup(await ConcursosPage({ searchParams: Promise.resolve({}) }));

    expect(html).toContain("PMDF — CFO");
    expect(html).toContain("Edital vigente/confirmado");
    expect(html).toContain("Abrir trilha");
    expect(html).toContain("3 notas");
    expect(html).toContain("verificado em 2026-10-20");
  });

  it("mantém os filtros de busca e status", async () => {
    const html = renderToStaticMarkup(
      await ConcursosPage({ searchParams: Promise.resolve({ q: "penal", status: "vigente" }) }),
    );
    expect(html).toContain('value="penal"');
    expect(html).toContain('value="vigente"');
  });
});

describe("página da trilha (server component)", () => {
  it("renderiza nota, flashcard e questão da coleção", async () => {
    const html = renderToStaticMarkup(
      await ColecaoPage({ params: Promise.resolve({ slug: "pmdf-cfo" }) }),
    );

    expect(html).toContain("Princípios da Administração Pública");
    expect(html).toContain("LIMPE");
    expect(html).toContain("Questão autoral PMDF-01");
    // A questão autoral deixa claro que não é oficial:
    expect(html).toContain("NÃO é questão oficial");
  });

  it("mostra o progresso do usuário na trilha", async () => {
    const html = renderToStaticMarkup(
      await ColecaoPage({ params: Promise.resolve({ slug: "pmdf-cfo" }) }),
    );
    // 1 de 2 itens acompanháveis (nota + flashcard) marcados como lido.
    expect(html).toContain("50%");
  });

  it("renderiza sem erro de fronteira cliente/servidor (regressão do erro 500)", async () => {
    await expect(
      (async () =>
        renderToStaticMarkup(await ColecaoPage({ params: Promise.resolve({ slug: "pmdf-cfo" }) })))(),
    ).resolves.toContain("Princípios da Administração Pública");
  });
});
