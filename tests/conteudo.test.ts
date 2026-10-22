/**
 * Testes de integridade do CONTEÚDO do catálogo (todas as trilhas).
 *
 * Não dependem de banco: validam a fonte única de conteúdo (scripts/*.mjs) e
 * servem de rotina de revisão periódica: quando uma trilha é atualizada, o
 * CHECKED_AT precisa ser renovado, senão o teste falha.
 *
 * Regras cobertas (ver docs/CONTEUDO_INICIAL_CONCURSOS.md):
 * - status ∈ {vigente, historico, comum, aguardando} e fonte oficial https;
 * - edital_ref e checked_at sempre preenchidos;
 * - questões autorais com gabarito, explicação e aviso "não é questão oficial";
 * - links apenas em domínios oficiais;
 * - nada de prova vazada / gabarito de prova real.
 */
import { describe, expect, it } from "vitest";
import { COLLECTIONS, CHECKED_AT, SOURCES } from "../scripts/seed-catalog.mjs";
import { TRILHAS_ADICIONAIS } from "../scripts/conteudo-trilhas.mjs";
import { EXTRAS_POR_SLUG, FONTES_OFICIAIS } from "../scripts/conteudo-extra.mjs";

type Item = {
  title: string;
  kind: string;
  order: number;
  category?: string;
  body?: string;
  options?: string[];
  correctIndex?: number;
  explanation?: string;
  originNote?: string;
  refLabel?: string;
  url?: string;
};

type Trilha = {
  slug: string;
  title: string;
  summary: string;
  status: string;
  statusNote: string;
  source: { name: string; url: string };
  editalRef: string;
  areas: string[];
  items: Item[];
};

const trilhas = [...(COLLECTIONS as Trilha[]), ...(TRILHAS_ADICIONAIS as Trilha[])];
const statusValidos = ["vigente", "historico", "comum", "aguardando"];
const kindsValidos = ["area", "nota", "flashcard", "questao", "fonte"];
const categoriasValidas = [
  "oficial",
  "resumo_proprio",
  "questao_autoral",
  "flashcard",
  "fonte_externa",
];

/** Domínios oficiais/autorais em que os links podem apontar. */
const dominiosOficiais = [
  "planalto.gov.br",
  "www4.planalto.gov.br",
  "gov.br",
  "www.gov.br",
  "cebraspe.org.br",
  "www.cebraspe.org.br",
  "pcdf.df.gov.br",
  "www.pcdf.df.gov.br",
  "ohchr.org",
  "www.ohchr.org",
  "unesco.org",
  "www.unesco.org",
];

function hostDe(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
}

function ehUrlOficial(url: string): boolean {
  const host = hostDe(url);
  return host !== "" && dominiosOficiais.some((d) => host === d || host.endsWith(`.${d}`));
}

function dataIso(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

describe("catálogo — trilhas", () => {
  it("tem as 6 trilhas com slugs únicos", () => {
    const slugs = trilhas.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of [
      "pmdf-cfo",
      "pf-policial-2025",
      "prf-policial",
      "pcdf-agente",
      "pmdf-soldado",
      "policia-penal",
    ]) {
      expect(slugs).toContain(s);
    }
    expect(trilhas.length).toBe(6);
  });

  it("cada trilha tem metadados completos e status válido", () => {
    for (const t of trilhas) {
      expect(t.slug).toMatch(/^[a-z0-9-]+$/);
      expect(t.title.length).toBeGreaterThan(5);
      expect(t.summary.length).toBeGreaterThan(20);
      expect(statusValidos).toContain(t.status);
      expect(t.statusNote.length).toBeGreaterThan(20);
      expect(t.source.name.length).toBeGreaterThan(3);
      expect(t.source.url.startsWith("https://")).toBe(true);
      expect(ehUrlOficial(t.source.url), `fonte de ${t.slug}`).toBe(true);
      expect(t.editalRef.length).toBeGreaterThan(3);
      expect(t.areas.length).toBeGreaterThanOrEqual(5);
    }
  });

  it("cada trilha tem nota, flashcard e questões suficientes", () => {
    for (const t of trilhas) {
      const porKind = (k: string) => t.items.filter((i) => i.kind === k);
      expect(porKind("nota").length, `notas em ${t.slug}`).toBeGreaterThanOrEqual(3);
      expect(porKind("flashcard").length, `flashcards em ${t.slug}`).toBeGreaterThanOrEqual(1);
      expect(porKind("questao").length, `questões em ${t.slug}`).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("catálogo — itens", () => {
  it("ids e títulos são únicos por trilha (banco tem UNIQUE nestas chaves)", () => {
    for (const t of trilhas) {
      const ids = t.items.map((i) => `catalog:${t.slug}:${i.kind}:${i.order}`);
      expect(new Set(ids).size, `ids em ${t.slug}`).toBe(ids.length);

      const chaves = t.items.map((i) => `${i.title}|${i.kind}`);
      expect(new Set(chaves).size, `títulos em ${t.slug}`).toBe(chaves.length);

      const ordens = t.items.map((i) => i.order);
      expect(new Set(ordens).size, `ordens em ${t.slug}`).toBe(ordens.length);
    }
  });

  it("todo item tem título, tipo e categoria válidos", () => {
    for (const t of trilhas) {
      for (const i of t.items) {
        expect(i.title.length, `título em ${t.slug}`).toBeGreaterThan(3);
        expect(kindsValidos).toContain(i.kind);
        expect(typeof i.order).toBe("number");
        if (i.category) expect(categoriasValidas).toContain(i.category);
      }
    }
  });

  it("questões autorais têm alternativas, gabarito, explicação e aviso de não oficial", () => {
    for (const t of trilhas) {
      for (const q of t.items.filter((i) => i.kind === "questao")) {
        expect(Array.isArray(q.options), `alternativas em ${t.slug}/${q.title}`).toBe(true);
        expect(q.options!.length).toBeGreaterThanOrEqual(4);
        expect(typeof q.correctIndex).toBe("number");
        expect(q.correctIndex!).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex!).toBeLessThan(q.options!.length);
        expect(new Set(q.options).size, `alternativas repetidas em ${q.title}`).toBe(q.options!.length);
        expect((q.explanation ?? "").length).toBeGreaterThan(10);
        expect((q.originNote ?? "").toLowerCase()).toContain("não é questão oficial");
      }
    }
  });

  it("flashcards seguem o formato Frente/Verso", () => {
    for (const t of trilhas) {
      for (const f of t.items.filter((i) => i.kind === "flashcard")) {
        expect(f.body ?? "").toMatch(/Frente:/i);
        expect(f.body ?? "").toMatch(/Verso:/i);
      }
    }
  });

  it("itens com link apontam para domínios oficiais", () => {
    for (const t of trilhas) {
      for (const i of t.items) {
        if (!i.url) continue;
        expect(i.url.startsWith("https://"), `url em ${t.slug}/${i.title}`).toBe(true);
        expect(ehUrlOficial(i.url), `url não oficial em ${t.slug}/${i.title}: ${i.url}`).toBe(true);
      }
    }
  });
});

describe("catálogo — extras e fontes", () => {
  it("extras seguem as mesmas regras de item", () => {
    for (const [slug, fn] of Object.entries(EXTRAS_POR_SLUG as Record<string, () => Item[]>)) {
      const itens = fn();
      expect(itens.length, `extras de ${slug}`).toBeGreaterThan(0);
      const ids = itens.map((i) => `catalog:${slug}:${i.kind}:${i.order}`);
      expect(new Set(ids).size, `ids extras de ${slug}`).toBe(ids.length);
      for (const i of itens) {
        expect(kindsValidos).toContain(i.kind);
        expect(i.title.length).toBeGreaterThan(3);
        if (i.url) expect(ehUrlOficial(i.url), `url extra em ${slug}/${i.title}`).toBe(true);
        if (i.kind === "questao") {
          expect(Array.isArray(i.options)).toBe(true);
          expect(i.options!.length).toBeGreaterThanOrEqual(4);
          expect(i.correctIndex!).toBeLessThan(i.options!.length);
          expect((i.originNote ?? "").toLowerCase()).toContain("não é questão oficial");
        }
      }
    }
  });

  it("extras não colidem com itens base da mesma trilha (mesma chave primária no banco)", () => {
    for (const t of trilhas) {
      const baseIds = new Set(t.items.map((i) => `catalog:${t.slug}:${i.kind}:${i.order}`));
      const extras = (EXTRAS_POR_SLUG as Record<string, () => Item[]>)[t.slug];
      if (!extras) continue;
      for (const i of extras()) {
        const id = `catalog:${t.slug}:${i.kind}:${i.order}`;
        expect(baseIds.has(id), `colisão de id entre base e extras: ${id}`).toBe(false);
      }
    }
  });

  it("fontes oficiais do módulo expandido são https e oficiais", () => {
    for (const [chave, fonte] of Object.entries(
      FONTES_OFICIAIS as Record<string, { name: string; url: string }>,
    )) {
      expect(fonte.name.length, `nome da fonte ${chave}`).toBeGreaterThan(3);
      expect(fonte.url.startsWith("https://"), `fonte ${chave}`).toBe(true);
      expect(ehUrlOficial(fonte.url), `fonte ${chave} não oficial`).toBe(true);
    }
  });

  it("fontes do seed principal são oficiais", () => {
    for (const [chave, fonte] of Object.entries(SOURCES as Record<string, { name: string; url: string }>)) {
      expect(fonte.url.startsWith("https://"), `fonte ${chave}`).toBe(true);
      expect(ehUrlOficial(fonte.url), `fonte ${chave} não oficial`).toBe(true);
    }
  });
});

describe("catálogo — revisão periódica", () => {
  it("CHECKED_AT é data ISO válida e não está no futuro", () => {
    expect(dataIso(CHECKED_AT)).toBe(true);
    const d = new Date(`${CHECKED_AT}T00:00:00Z`);
    expect(Number.isNaN(d.getTime())).toBe(false);
    expect(d.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it("conteúdo foi revisado nos últimos 180 dias", () => {
    const dias = (Date.now() - new Date(`${CHECKED_AT}T00:00:00Z`).getTime()) / 86400000;
    expect(dias, `CHECKED_AT=${CHECKED_AT} está velho; revise as fontes e atualize a data`).toBeLessThan(180);
  });

  it("nada de prova vazada ou gabarito de prova real", () => {
    const proibidos = [
      "gabarito oficial",
      "gabarito comentado da prova",
      "prova real",
      "prova vazada",
      "questões da banca",
      "prova original",
    ];
    for (const t of trilhas) {
      const texto = `${t.title} ${t.summary} ${t.statusNote} ${t.items
        .map((i) => `${i.title} ${i.body ?? ""} ${i.explanation ?? ""}`)
        .join(" ")}`.toLowerCase();
      for (const p of proibidos) {
        expect(texto, `termo "${p}" em ${t.slug}`).not.toContain(p);
      }
    }
  });
});
