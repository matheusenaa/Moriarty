/**
 * Configura um banco Postgres de teste para os testes do Moriarty.
 * Aplica as migrações de db/postgres/*.sql e executa o seed do catálogo.
 * Destinado a ser chamado no beforeAll de cada arquivo de teste.
 */
import fs from "fs";
import path from "path";
import { execute, closeDb, getPool } from "@/lib/db";
import { seedCatalogPg } from "../../scripts/seed-catalog.mjs";

const MIGRATION_DIR = path.join(process.cwd(), "db", "postgres");

export async function setupPostgresTest(): Promise<void> {
  // Garante DATABASE_URL apontando para o banco de teste.
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL =
      "postgresql://postgres:postgres@localhost:5432/moriarty_test";
  }

  const pool = getPool();

  // Recria o schema do zero: dropa tabelas na ordem inversa de dependência.
  await execute(
    `DROP TABLE IF EXISTS content_contributions CASCADE;
     DROP TABLE IF EXISTS catalog_quiz_attempts CASCADE;
     DROP TABLE IF EXISTS auth_rate_limits CASCADE;
     DROP TABLE IF EXISTS catalog_answers CASCADE;
     DROP TABLE IF EXISTS catalog_progress CASCADE;
     DROP TABLE IF EXISTS catalog_items CASCADE;
     DROP TABLE IF EXISTS catalog_collections CASCADE;
     DROP TABLE IF EXISTS notifications CASCADE;
     DROP TABLE IF EXISTS reminders CASCADE;
     DROP TABLE IF EXISTS sources CASCADE;
     DROP TABLE IF EXISTS achievements CASCADE;
     DROP TABLE IF EXISTS user_xp CASCADE;
     DROP TABLE IF EXISTS xp_events CASCADE;
     DROP TABLE IF EXISTS quiz_answers CASCADE;
     DROP TABLE IF EXISTS quiz_attempts CASCADE;
     DROP TABLE IF EXISTS quiz_questions CASCADE;
     DROP TABLE IF EXISTS quizzes CASCADE;
     DROP TABLE IF EXISTS questions CASCADE;
     DROP TABLE IF EXISTS blocks CASCADE;
     DROP TABLE IF EXISTS friendships CASCADE;
     DROP TABLE IF EXISTS friend_requests CASCADE;
     DROP TABLE IF EXISTS material_tags CASCADE;
     DROP TABLE IF EXISTS materials CASCADE;
     DROP TABLE IF EXISTS review_history CASCADE;
     DROP TABLE IF EXISTS review_items CASCADE;
     DROP TABLE IF EXISTS unavailable_dates CASCADE;
     DROP TABLE IF EXISTS availability_slots CASCADE;
     DROP TABLE IF EXISTS topics CASCADE;
     DROP TABLE IF EXISTS subjects CASCADE;
     DROP TABLE IF EXISTS study_goals CASCADE;
     DROP TABLE IF EXISTS schedules CASCADE;
     DROP TABLE IF EXISTS study_sessions CASCADE;
     DROP TABLE IF EXISTS password_resets CASCADE;
     DROP TABLE IF EXISTS profiles CASCADE;
     DROP TABLE IF EXISTS users CASCADE;
     DROP TABLE IF EXISTS schema_migrations CASCADE;`,
  );

  // Aplica migrações em ordem alfabética.
  const files = fs
    .readdirSync(MIGRATION_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(MIGRATION_DIR, file), "utf8");
    await pool.query(sql);
  }

  // Seed do conteúdo inicial (idempotente).
  await seedCatalogPg(pool);
}

export async function teardownPostgresTest(): Promise<void> {
  await closeDb();
}
