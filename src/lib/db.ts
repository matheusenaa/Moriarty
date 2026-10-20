import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { seedCatalog } from "../../scripts/seed-catalog.mjs";

/**
 * Migrações aplicadas na ordem. Cada nome só é executado uma vez (registro em
 * schema_migrations). Mantido igual em scripts/migrate.mjs.
 * - 001_init: esquema base (db/schema.sql)
 * - 002_catalogo: catálogo de conteúdo mantido pela plataforma
 * - 003_catalog_progress: progresso do usuário sobre itens do catálogo
 */
export const MIGRATIONS: { name: string; file: string }[] = [
  { name: "001_init", file: "db/schema.sql" },
  { name: "002_catalogo", file: "db/migrations/002_catalogo.sql" },
  { name: "003_catalog_progress", file: "db/migrations/003_catalog_progress.sql" },
];

let cached: Database.Database | null = null;

export function dbPath(): string {
  const raw = process.env.DATABASE_PATH || "./data/moriarty.db";
  return path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
}

export function getDb(): Database.Database {
  if (cached) return cached;
  const file = dbPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  // Conteúdo inicial de concursos (idempotente por slug). Uma vez que as tabelas
  // do catálogo existem, garante que a plataforma nunca nasça vazia.
  seedCatalog(db);
  cached = db;
  return db;
}

function migrate(db: Database.Database) {
  db.exec(
    "CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)",
  );
  for (const migration of MIGRATIONS) {
    const applied = db
      .prepare("SELECT name FROM schema_migrations WHERE name = ?")
      .get(migration.name);
    if (applied) continue;
    const sql = fs.readFileSync(path.join(process.cwd(), migration.file), "utf8");
    db.exec(sql);
    db.prepare("INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)").run(
      migration.name,
      nowIso(),
    );
  }
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function uid(): string {
  return crypto.randomUUID();
}

export function closeDb(): void {
  if (cached) {
    cached.close();
    cached = null;
  }
}
