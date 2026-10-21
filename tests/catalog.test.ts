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
const extraSlugs = ["pcdf-agente", "pmdf-soldado", "policia-penal"];

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

  it("cria as trilhas adicionais (PCDF, PMDF Soldado, Polícia Penal)", async () => {
    const slugs = (await catalog.listCollections()).map((c) => c.slug);
    for (const slug of extraSlugs) expect(slugs).toContain(slug);
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

  it("cada trilha inclui fontes oficiais (link Planalto/Cebraspe) e cronograma sugerido", async () => {
    for (const slug of requiredSlugs) {
      const col = (await catalog.getCollectionBySlug(slug))!;
      const notas = await catalog.listItems(col.id, "nota");
      const fonte = notas.find((n) => n.ref_label === "Fonte oficial" && n.url.startsWith("https://"));
      expect(fonte, `fonte oficial ausente em ${slug}`).toBeTruthy();
      const cronograma = notas.find((n) =>
        n.title.toLowerCase().includes("cronograma sugerido"),
      );
      expect(cronograma, `cronograma ausente em ${slug}`).toBeTruthy();
      expect(cronograma!.body.length).toBeGreaterThan(50);
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

describe("respostas às questões de treino (progresso pessoal)", () => {
  async function freshUser(): Promise<string> {
    const profile = await import("@/lib/repo/profile");
    const email = `q-${Date.now()}-${Math.random().toString(36).slice(2)}@teste.local`;
    return profile.createUser(email, "hash");
  }

  it("registra acerto e agrega por trilha", async () => {
    const userId = await freshUser();
    const col = (await catalog.getCollectionBySlug("pmdf-cfo"))!;
    const qs = await catalog.listItems(col.id, "questao");

    await catalog.recordQuestionAnswer(userId, qs[0].id, qs[0].correct_index!, true);

    const map = await catalog.getUserQuestionResults(userId, [qs[0].id]);
    expect(map[qs[0].id]).toMatchObject({ isCorrect: true, attempts: 1 });

    const stats = await catalog.collectionQuestionStats(userId, col.id);
    expect(stats.answered).toBe(1);
    expect(stats.correct).toBe(1);
    expect(stats.total).toBeGreaterThanOrEqual(10);

    const all = await catalog.catalogQuestionStats(userId);
    const row = all.find((s) => s.slug === col.slug)!;
    expect(row.answered).toBe(1);
    expect(row.correct).toBe(1);
  });

  it("incrementa tentativas e mantém o último resultado", async () => {
    const userId = await freshUser();
    const col = (await catalog.getCollectionBySlug("pf-policial-2025"))!;
    const q = (await catalog.listItems(col.id, "questao"))[0];
    const options = JSON.parse(q.options_json) as string[];
    const wrong = (q.correct_index! + 1) % options.length;

    await catalog.recordQuestionAnswer(userId, q.id, wrong, false);
    let map = await catalog.getUserQuestionResults(userId, [q.id]);
    expect(map[q.id]).toMatchObject({ isCorrect: false, attempts: 1 });

    await catalog.recordQuestionAnswer(userId, q.id, q.correct_index!, true);
    map = await catalog.getUserQuestionResults(userId, [q.id]);
    expect(map[q.id]).toMatchObject({ isCorrect: true, attempts: 2 });
  });

  it("lista só erradas na revisão e isola respostas entre usuários", async () => {
    const userA = await freshUser();
    const userB = await freshUser();
    const col = (await catalog.getCollectionBySlug("prf-policial"))!;
    const qs = await catalog.listItems(col.id, "questao");
    const options = JSON.parse(qs[0].options_json) as string[];
    const wrong = (qs[0].correct_index! + 1) % options.length;

    await catalog.recordQuestionAnswer(userA, qs[0].id, wrong, false);
    await catalog.recordQuestionAnswer(userA, qs[1].id, qs[1].correct_index!, true);

    const missedA = await catalog.listMissedQuestions(userA);
    expect(missedA.map((m) => m.itemId)).toEqual([qs[0].id]);

    const missedB = await catalog.listMissedQuestions(userB);
    expect(missedB).toHaveLength(0);

    const mapB = await catalog.getUserQuestionResults(userB, [qs[0].id]);
    expect(mapB[qs[0].id]).toBeUndefined();
  });
});
