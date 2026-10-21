/**
 * Testes da busca em fontes oficiais (agente determinístico, sem IA paga).
 * Verificam: normalização, matching por artigo/assunto, ordenação por score,
 * consulta vazia e integridade do catálogo (links oficiais https).
 */
import { describe, expect, it } from "vitest";
import { buscarFontes, normalizar, FONTES_OFICIAIS } from "@/lib/fontes";

describe("catálogo de fontes oficiais", () => {
  it("tem todas as entradas apontando para fontes oficiais em https", () => {
    expect(FONTES_OFICIAIS.length).toBeGreaterThanOrEqual(10);
    for (const f of FONTES_OFICIAIS) {
      expect(f.url.startsWith("https://")).toBe(true);
      expect(f.norma.length).toBeGreaterThan(0);
      expect(f.palavrasChave.length).toBeGreaterThan(0);
      expect(f.concursos.length).toBeGreaterThan(0);
    }
  });

  it("não tem ids duplicados", () => {
    const ids = FONTES_OFICIAIS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("normalizar", () => {
  it("remove acentos e coloca em minúsculas", () => {
    expect(normalizar("Inquérito Policial")).toBe("inquerito policial");
    expect(normalizar("Art. 306 — Embriaguez")).toContain("embriaguez");
  });
});

describe("buscarFontes", () => {
  it("encontra o artigo pelo número (art. 306 CTB)", () => {
    const r = buscarFontes("art. 306 CTB embriaguez");
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].id).toBe("ctb-art306");
  });

  it("encontra pelo assunto (usuário x traficante)", () => {
    const r = buscarFontes("usuário x traficante");
    expect(r.some((x) => x.id === "lei11343-art28")).toBe(true);
  });

  it("encontra por tema (hierarquia e disciplina)", () => {
    const r = buscarFontes("hierarquia e disciplina");
    expect(r[0].id).toBe("lei14751");
  });

  it("retorna vazio para consulta vazia", () => {
    expect(buscarFontes("")).toEqual([]);
    expect(buscarFontes("   ")).toEqual([]);
  });

  it("retorna vazio quando nada casa", () => {
    expect(buscarFontes("zzzz nao existe nada disso")).toEqual([]);
  });

  it("respeita o limite de resultados", () => {
    const r = buscarFontes("direito penal", 2);
    expect(r.length).toBeLessThanOrEqual(2);
  });

  it("ordena por score decrescente", () => {
    const r = buscarFontes("inquerito policial prazo");
    for (let i = 1; i < r.length; i++) {
      expect(r[i - 1].score).toBeGreaterThanOrEqual(r[i].score);
    }
  });
});
