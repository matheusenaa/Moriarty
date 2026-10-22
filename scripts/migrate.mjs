#!/usr/bin/env node
/**
 * Aplica as migrações PostgreSQL do Moriarty de forma idempotente e, em seguida,
 * executa o seed do conteúdo inicial de concursos (idempotente por slug).
 *
 * Uso: npm run db:migrate                 (aplica migrações + seed)
 *      npm run db:migrate -- --no-seed    (apenas migrações)
 * Lê DATABASE_URL do ambiente (.env.local ou .env).
 */
import fs from "fs";
import path from "path";
import pg from "pg";
import { seedCatalogPg } from "./seed-catalog.mjs";

const MIGRATIONS = [
  { name: "001_init", file: path.join("db", "postgres", "0001_init.sql") },
  { name: "002_catalogo", file: path.join("db", "postgres", "0002_catalogo.sql") },
  { name: "003_catalog_progress", file: path.join("db", "postgres", "0003_catalog_progress.sql") },
  { name: "004_catalog_answers", file: path.join("db", "postgres", "0004_catalog_answers.sql") },
  { name: "005_auth_rate_limits", file: path.join("db", "postgres", "0005_auth_rate_limits.sql") },
  { name: "006_catalog_quiz_attempts", file: path.join("db", "postgres", "0006_catalog_quiz_attempts.sql") },
];

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const p = path.join(process.cwd(), file);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!m) continue;
      const key = m[1];
      let val = m[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}

loadEnv();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL não configurada. Defina a connection string do Postgres (v. .env.example).");
  process.exit(1);
}

const needsSsl = !/localhost|127\.0\.0\.1/.test(url);
const pool = new pg.Pool({ connectionString: url, ssl: needsSsl ? { rejectUnauthorized: false } : undefined });
const client = await pool.connect();

try {
  await client.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)",
  );

  for (const migration of MIGRATIONS) {
    const applied = await client.query("SELECT name FROM schema_migrations WHERE name = $1", [migration.name]);
    if (applied.rowCount > 0) {
      console.log(`Migração já aplicada: ${migration.name}`);
      continue;
    }
    const sql = fs.readFileSync(path.join(process.cwd(), migration.file), "utf8");
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name, applied_at) VALUES ($1, $2)", [
        migration.name,
        new Date().toISOString(),
      ]);
      await client.query("COMMIT");
      console.log(`Migração aplicada: ${migration.name}`);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }
  }

  if (!process.argv.includes("--no-seed")) {
    const result = await seedCatalogPg(client);
    console.log(
      `Seed de conteúdo: ${result.collections} coleções, ${result.items} itens (inseridos: ${result.inserted}).`,
    );
  }

  console.log("Banco pronto.");
} finally {
  client.release();
  await pool.end();
}
