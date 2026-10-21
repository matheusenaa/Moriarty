/**
 * Testes de integridade das trilhas adicionais (conteúdo do seed).
 * Não dependem de banco: validam o formato dos dados de conteúdo.
 */
import { describe, expect, it } from "vitest";
import { TRILHAS_ADICIONAIS } from "../scripts/conteudo-trilhas.mjs";

type Item = {
  title: string;
  kind: string;
  category?: string;
  body?: string;
  options?: string[];
  correctIndex?: number;
  explanation?: string;
  originNote?: string;
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

const trilhas = TRILHAS_ADICIONAIS as Trilha[];
const statusValidos = ["vigente", "historico", "comum", "aguardando"];

describe("trilhas adicionais — integridade", () => {
  it("tem ao menos 3 trilhas com slug, título e resumo", () => {
    expect(trilhas.length).toBeGreaterThanOrEqual(3);
    for (const t of trilhas) {
      expect(t.slug).toMatch(/^[a-z0-9-]+$/);
      expect(t.title.length).toBeGreaterThan(5);
      expect(t.summary.length).toBeGreaterThan(20);
    }
  });

  it("não tem slugs duplicados", () => {
    const slugs = trilhas.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("cada trilha tem status válido, fonte https e ao menos 5 matérias", () => {
    for (const t of trilhas) {
      expect(statusValidos).toContain(t.status);
      expect(t.source.url.startsWith("https://")).toBe(true);
      expect(t.source.name.length).toBeGreaterThan(0);
      expect(t.areas.length).toBeGreaterThanOrEqual(5);
    }
  });

  it("cada trilha tem ao menos 3 notas, 1 ficha constitucional e 3 questões", () => {
    for (const t of trilhas) {
      const notas = t.items.filter((i) => i.kind === "nota");
      const questoes = t.items.filter((i) => i.kind === "questao");
      const ficha = notas.find((n) => n.title.includes("5º, 37 e 144"));
      expect(notas.length, `notas em ${t.slug}`).toBeGreaterThanOrEqual(3);
      expect(ficha, `ficha ausente em ${t.slug}`).toBeTruthy();
      expect(questoes.length, `questões em ${t.slug}`).toBeGreaterThanOrEqual(3);
    }
  });

  it("todas as questões autorais têm alternativas, gabarito e aviso de não oficial", () => {
    for (const t of trilhas) {
      const questoes = t.items.filter((i) => i.kind === "questao");
      for (const q of questoes) {
        expect(Array.isArray(q.options)).toBe(true);
        expect(q.options!.length).toBeGreaterThanOrEqual(4);
        expect(typeof q.correctIndex).toBe("number");
        expect(q.correctIndex!).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex!).toBeLessThan(q.options!.length);
        expect((q.explanation ?? "").length).toBeGreaterThan(10);
        expect((q.originNote ?? "").toLowerCase()).toContain("não é questão oficial");
      }
    }
  });
});
