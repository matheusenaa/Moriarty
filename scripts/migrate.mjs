#!/usr/bin/env node
/**
 * Aplica as migrações SQLite do Moriarty de forma idempotente e, em seguida,
 * executa o seed do conteúdo inicial de concursos (idempotente por slug).
 * Uso: npm run db:migrate            (aplica migrações + seed)
 *      npm run db:migrate -- --no-seed  (apenas migrações)
 * Lê DATABASE_PATH do ambiente (padrão ./data/moriarty.db).
 */
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { seedCatalog } from "../scripts/seed-catalog.mjs";

const MIGRATIONS = [
  { name: "001_init", file: path.join("db", "schema.sql") },
  { name: "002_catalogo", file: path.join("db", "migrations", "002_catalogo.sql") },
  { name: "003_catalog_progress", file: path.join("db", "migrations", "003_catalog_progress.sql") },
];

const raw = process.env.DATABASE_PATH || "./data/moriarty.db";
const file = path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);

fs.mkdirSync(path.dirname(file), { recursive: true });
const db = new Database(file);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec("CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)");

for (const migration of MIGRATIONS) {
  const applied = db.prepare("SELECT name FROM schema_migrations WHERE name = ?").get(migration.name);
  if (applied) {
    console.log(`Migração já aplicada: ${migration.name}`);
    continue;
  }
  const sql = fs.readFileSync(path.join(process.cwd(), migration.file), "utf8");
  db.exec(sql);
  db.prepare("INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)").run(
    migration.name,
    new Date().toISOString(),
  );
  console.log(`Migração aplicada: ${migration.name}`);
}

if (!process.argv.includes("--no-seed")) {
  const result = seedCatalog(db);
  console.log(
    `Seed de conteúdo: ${result.collections} coleções, ${result.items} itens (inseridos: ${result.inserted}).`,
  );
}

console.log(`Banco pronto: ${file}`);
db.close();
