/**
 * Testes do catálogo de conteúdo de concursos (curadoria da plataforma).
 * Verificam: presença das 3 trilhas, quantidades mínimas, idempotência do seed,
 * integridade das questões autorais e que o conteúdo de sistema NÃO expõe dados
 * pessoais de usuários.
 */
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import Database from "better-sqlite3";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

process.env.AUTH_SECRET = "segredo-de-teste-somente-local-1234567890";
process.env.DATABASE_PATH = "./data/test-catalog.db";

const dbFile = path.join(process.cwd(), "data", "test-catalog.db");
const requiredSlugs = ["pmdf-cfo", "pf-policial-2025", "prf-policial"];

let catalog: typeof import("@/lib/repo/catalog");
let closeDb: () => void;

beforeAll(async () => {
  for (const suffix of ["", "-wal", "-shm"]) {
    const f = dbFile + suffix;
    if (fs.existsSync(f)) fs.rmSync(f);
  }
  catalog = await import("@/lib/repo/catalog");
  closeDb = (await import("@/lib/db")).closeDb;
});

afterAll(() => {
  closeDb();
});

describe("catálogo de concursos — conteúdo inicial", () => {
  it("cria as três trilhas principais (PMDF, PF, PRF)", () => {
    const slugs = catalog.listCollections().map((c) => c.slug);
    for (const slug of requiredSlugs) expect(slugs).toContain(slug);
  });

  it("cada trilha tem fonte, status e data de verificação preenchidos", () => {
    for (const slug of requiredSlugs) {
      const col = catalog.getCollectionBySlug(slug);
      expect(col).not.toBeNull();
      expect(col!.source_url).toMatch(/^https:\/\//);
      expect(col!.source_name.length).toBeGreaterThan(0);
      expect(col!.checked_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(col!.status_note.length).toBeGreaterThan(0);
      expect(["vigente", "historico", "comum", "aguardando"]).toContain(col!.status);
    }
  });

  it("cada trilha tem ao menos 5 matérias, 5 notas, 10 questões e 5 flashcards", () => {
    for (const slug of requiredSlugs) {
      const col = catalog.getCollectionBySlug(slug)!;
      const counts = catalog.collectionCounts(col.id);
      expect(counts.area ?? 0).toBeGreaterThanOrEqual(5);
      expect(counts.nota ?? 0).toBeGreaterThanOrEqual(5);
      expect(counts.questao ?? 0).toBeGreaterThanOrEqual(10);
      expect(counts.flashcard ?? 0).toBeGreaterThanOrEqual(5);
    }
  });

  it("todas as questões autorais têm alternativas válidas, gabarito e explicação", () => {
    for (const slug of requiredSlugs) {
      const col = catalog.getCollectionBySlug(slug)!;
      const questions = catalog.listItems(col.id, "questao");
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

  it("cada trilha inclui a ficha constitucional dos arts. 5º, 37 e 144", () => {
    for (const slug of requiredSlugs) {
      const col = catalog.getCollectionBySlug(slug)!;
      const notas = catalog.listItems(col.id, "nota");
      const ficha = notas.find((n) => n.title.includes("5º, 37 e 144"));
      expect(ficha, `ficha ausente em ${slug}`).toBeTruthy();
      expect(ficha!.body).toContain("Art. 5º");
      expect(ficha!.body).toContain("Art. 37");
      expect(ficha!.body).toContain("Art. 144");
    }
  });
});

describe("seed idempotente (executado dentro do getDb)", () => {
  it("rodar o seed de novo não duplica itens", async () => {
    const { seedCatalog } = (await import("../scripts/seed-catalog.mjs")) as {
      seedCatalog: (db: Database.Database) => { inserted: number; items: number };
    };
    closeDb();
    const db = new Database(dbFile);
    db.pragma("foreign_keys = ON");
    const before = (db.prepare("SELECT COUNT(*) c FROM catalog_items").get() as { c: number }).c;
    const result = seedCatalog(db);
    const after = (db.prepare("SELECT COUNT(*) c FROM catalog_items").get() as { c: number }).c;
    db.close();
    expect(result.inserted).toBe(0);
    expect(after).toBe(before);
  });
});

describe("busca e filtro de coleções", () => {
  it("busca por texto no título retorna a trilha certa", () => {
    const slugs = catalog.searchCollections("prf").map((c) => c.slug);
    expect(slugs).toEqual(["prf-policial"]);
  });

  it("busca por título de matéria encontra a trilha (ex.: 'trânsito')", () => {
    const slugs = catalog.searchCollections("trânsito").map((c) => c.slug);
    expect(slugs).toContain("prf-policial");
  });

  it("filtro por status retorna apenas coleções daquele status", () => {
    const vigentes = catalog.searchCollections(undefined, "vigente");
    expect(vigentes.length).toBeGreaterThan(0);
    for (const c of vigentes) expect(c.status).toBe("vigente");
    expect(vigentes.map((c) => c.slug)).toContain("pf-policial-2025");
  });

  it("status 'vigente' é ordenado antes de 'historico'", () => {
    const all = catalog.searchCollections();
    const firstHistorico = all.findIndex((c) => c.status === "historico");
    const lastVigente = all.map((c) => c.status).lastIndexOf("vigente");
    if (firstHistorico !== -1 && lastVigente !== -1) {
      expect(lastVigente).toBeLessThan(firstHistorico);
    }
  });

  it("busca sem correspondência retorna lista vazia", () => {
    expect(catalog.searchCollections("xyz-nao-existe-123")).toEqual([]);
  });
});

describe("importar trilha como matérias do plano", () => {
  it("cria as matérias da trilha sem duplicar em execuções repetidas", async () => {
    const planning = await import("@/lib/repo/planning");
    const profile = await import("@/lib/repo/profile");
    const userId = profile.createUser("import@teste.local", "hash");

    const col = catalog.getCollectionBySlug("prf-policial")!;
    const areas = catalog.listItems(col.id, "area");

    function importAreas(): number {
      const existing = new Set(planning.listSubjects(userId, true).map((s) => s.name.trim().toLowerCase()));
      let created = 0;
      for (const area of areas) {
        const key = area.title.trim().toLowerCase();
        if (existing.has(key)) continue;
        planning.createSubject(userId, {
          name: area.title,
          priority: 3,
          mastery: 1,
          color: "#c9a227",
          goalId: null,
        });
        existing.add(key);
        created++;
      }
      return created;
    }

    const firstRun = importAreas();
    expect(firstRun).toBe(areas.length);
    const secondRun = importAreas();
    expect(secondRun).toBe(0);
    expect(planning.listSubjects(userId).length).toBe(areas.length);
  });
});

describe("progresso do usuário sobre o catálogo (dado pessoal)", () => {
  it("marca, atualiza e remove o estado de um item sem tocar no conteúdo", async () => {
    const profile = await import("@/lib/repo/profile");
    const userId = profile.createUser("progress@teste.local", "hash");
    const col = catalog.getCollectionBySlug("pmdf-cfo")!;
    const nota = catalog.listItems(col.id, "nota")[0];

    expect(catalog.getItemProgress(userId, nota.id)).toBe(null);

    catalog.setItemProgress(userId, nota.id, "lido");
    expect(catalog.getItemProgress(userId, nota.id)).toBe("lido");

    catalog.setItemProgress(userId, nota.id, "dominado");
    expect(catalog.getItemProgress(userId, nota.id)).toBe("dominado");

    catalog.setItemProgress(userId, nota.id, null);
    expect(catalog.getItemProgress(userId, nota.id)).toBe(null);
  });

  it("o progresso de um usuário não aparece para outro", async () => {
    const profile = await import("@/lib/repo/profile");
    const a = profile.createUser("prog-a@teste.local", "hash");
    const b = profile.createUser("prog-b@teste.local", "hash");
    const col = catalog.getCollectionBySlug("pf-policial-2025")!;
    const nota = catalog.listItems(col.id, "nota")[0];

    catalog.setItemProgress(a, nota.id, "lido");
    expect(catalog.getUserProgressMap(b)[nota.id]).toBeUndefined();
    expect(catalog.getUserProgressMap(a)[nota.id]).toBe("lido");
  });

  it("collectionProgressCounts soma lidos e dominados por coleção", async () => {
    const profile = await import("@/lib/repo/profile");
    const userId = profile.createUser("prog-count@teste.local", "hash");
    const col = catalog.getCollectionBySlug("prf-policial")!;
    const notas = catalog.listItems(col.id, "nota");
    const cards = catalog.listItems(col.id, "flashcard");

    catalog.setItemProgress(userId, notas[0].id, "lido");
    catalog.setItemProgress(userId, notas[1].id, "lido");
    catalog.setItemProgress(userId, cards[0].id, "dominado");

    const counts = catalog.collectionProgressCounts(userId, col.id);
    expect(counts).toEqual({ lido: 2, dominado: 1 });
  });

  it("excluir um item do catálogo remove o progresso associado (FK ON DELETE CASCADE)", async () => {
    closeDb();
    const db = new Database(dbFile);
    db.pragma("foreign_keys = ON");
    const col = catalog.getCollectionBySlug("pmdf-cfo")!;
    const items = catalog.listItems(col.id, "nota");
    const target = items[items.length - 1];
    const profile = await import("@/lib/repo/profile");
    const userId = profile.createUser("prog-cascade@teste.local", "hash");
    catalog.setItemProgress(userId, target.id, "lido");
    db.prepare("DELETE FROM catalog_items WHERE id = ?").run(target.id);
    const remaining = db
      .prepare("SELECT COUNT(*) c FROM catalog_progress WHERE item_id = ?")
      .get(target.id) as { c: number };
    // Restaura o item removido para manter a idempotência verificada logo depois.
    const { seedCatalog } = (await import("../scripts/seed-catalog.mjs")) as {
      seedCatalog: (db: Database.Database) => { inserted: number };
    };
    seedCatalog(db);
    db.close();
    closeDb();
    expect(remaining.c).toBe(0);
  });
});

describe("seed para Supabase (portabilidade do conteúdo)", () => {
  it("gera SQL idempotente com o mesmo total de itens do seed SQLite", () => {
    const sql = execFileSync("node", ["scripts/seed-catalog-supabase.mjs"], {
      cwd: process.cwd(),
      encoding: "utf8",
    });
    expect(sql).toContain("begin;");
    expect(sql).toContain("commit;");
    const collectionInserts = (sql.match(/insert into catalog_collections/g) || []).length;
    const itemInserts = (sql.match(/insert into catalog_items/g) || []).length;
    expect(collectionInserts).toBe(3);
    expect(itemInserts).toBe(80);
    expect(sql).toContain("on conflict (slug) do update");
    expect(sql).toContain("on conflict (collection_id, title, kind) do nothing");
  });
});

describe("isolamento: conteúdo de sistema não expõe dados pessoais", () => {
  it("itens do catálogo não possuem coluna de usuário/ progresso", async () => {
    closeDb();
    const db = new Database(dbFile);
    const cols = (db.prepare("PRAGMA table_info(catalog_items)").all() as { name: string }[]).map(
      (c) => c.name,
    );
    db.close();
    expect(cols).not.toContain("user_id");
    expect(cols).not.toContain("progress");
  });

  it("ler o catálogo não cria material pessoal nem exigir usuário", () => {
    // A leitura do catálogo é pública-para-autenticados e independente de conta.
    const col = catalog.getCollectionBySlug("pf-policial-2025")!;
    const items = catalog.listItems(col.id);
    expect(items.length).toBeGreaterThan(0);
    // Nenhum item aponta para um material de usuário.
    for (const it of items) expect(it.id.startsWith("catalog:")).toBe(true);
  });
});
