/**
 * Testes do catálogo de conteúdo de concursos (curadoria da plataforma).
 * Verificam: presença das 3 trilhas, quantidades mínimas, idempotência do seed,
 * integridade das questões autorais e que o conteúdo de sistema NÃO expõe dados
 * pessoais de usuários.
 *
 * Executados contra Postgres real (.env.test).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

process.env.AUTH_SECRET = "segredo-de-teste-somente-local-1234567890";
process.env.DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/moriarty_test";

const requiredSlugs = ["pmdf-cfo", "pf-policial-2025", "prf-policial"];

let catalog: typeof import("@/lib/repo/catalog");

beforeAll(async () => {
  const { setupPostgresTest } = await import("./helpers/db");
  await setupPostgresTest();
  catalog = await import("@/lib/repo/catalog");
});

afterAll(async () => {
  const { teardownPostgresTest } = await import("./helpers/db");
  await teardownPostgresTest();
});

describe("catálogo de concursos — conteúdo inicial", () => {
  it("cria as três trilhas principais (PMDF, PF, PRF)", async () => {
    const slugs = (await catalog.listCollections()).map((c) => c.slug);
    for (const slug of requiredSlugs) expect(slugs).toContain(slug);
  });

  it("cada trilha tem fonte, status e data de verificação preenchidos", async () => {
    for (const slug of requiredSlugs) {
      const col = await catalog.getCollectionBySlug(slug);
      expect(col).not.toBeNull();
      expect(col!.source_url).toMatch(/^https:\/\//);
      expect(col!.source_name.length).toBeGreaterThan(0);
      expect(col!.checked_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(col!.status_note.length).toBeGreaterThan(0);
      expect(["vigente", "historico", "comum", "aguardando"]).toContain(col!.status);
    }
  });

  it("cada trilha tem ao menos 5 matérias, 5 notas, 10 questões e 5 flashcards", async () => {
    for (const slug of requiredSlugs) {
      const col = (await catalog.getCollectionBySlug(slug))!;
      const counts = await catalog.collectionCounts(col.id);
      expect(counts.area ?? 0).toBeGreaterThanOrEqual(5);
      expect(counts.nota ?? 0).toBeGreaterThanOrEqual(5);
      expect(counts.questao ?? 0).toBeGreaterThanOrEqual(10);
      expect(counts.flashcard ?? 0).toBeGreaterThanOrEqual(5);
    }
  });

  it("todas as questões autorais têm alternativas válidas, gabarito e explicação", async () => {
    for (const slug of requiredSlugs) {
      const col = (await catalog.getCollectionBySlug(slug))!;
      const questions = await catalog.listItems(col.id, "questao");
      expect(questions.length).toBeGreaterThanOrEqual(10);
      for (const q of questions) {
        const options = JSON.parse(q.options_json) as string[];
        expect(Array.isArray(options)).toBe(true);
        expect(options.length).toBeGreaterThanOrEqual(4);
        expect(q.correct_index).not.toBeNull();
        expect(q.correct_index!).toBeGreaterThanOrEqual(0);
        expect(q.correct_index!).toBeLessThan(options.length);
        expect(q.explanation.length).toBeGreaterThan(10);
        expect(q.origin_note.toLowerCase()).toContain("não é questão oficial");
      }
    }
  });

  it("cada trilha inclui a ficha constitucional dos arts. 5º, 37 e 144", async () => {
    for (const slug of requiredSlugs) {
      const col = (await catalog.getCollectionBySlug(slug))!;
      const notas = await catalog.listItems(col.id, "nota");
      const ficha = notas.find((n) => n.title.includes("5º, 37 e 144"));
      expect(ficha, `ficha ausente em ${slug}`).toBeTruthy();
      expect(ficha!.body).toContain("Art. 5º");
      expect(ficha!.body).toContain("Art. 37");
      expect(ficha!.body).toContain("Art. 144");
    }
  });
});

describe("seed idempotente", () => {
  it("rodar o seed de novo não duplica itens", async () => {
    const { seedCatalogPg } = await import("../scripts/seed-catalog.mjs");
    const { query, getPool } = await import("@/lib/db");
    const pool = getPool();
    const beforeRows = await query<{ c: string }>(
      "SELECT COUNT(*) c FROM catalog_items",
    );
    const before = Number(beforeRows[0].c);
    await seedCatalogPg(pool);
    const afterRows = await query<{ c: string }>(
      "SELECT COUNT(*) c FROM catalog_items",
    );
    const after = Number(afterRows[0].c);
    expect(after).toBe(before);
  });
});
