import { Pool, type PoolClient, type QueryResultRow } from "pg";

/**
 * Camada de acesso a dados do Moriarty — PostgreSQL (Supabase, Neon, VPS...).
 *
 * Decisões (ver docs/DEPLOY.md):
 * - Driver `pg` (node-postgres) direto: sem dependência de SDK do Supabase, o
 *   mesmo código roda em qualquer Postgres.
 * - Autenticação interna (bcrypt + jose); usuários vivem em `users`/`profiles`.
 * - Mudança mínima em relação ao SQLite: booleans como SMALLINT 0/1 e datas
 *   como TEXT ISO, então os repositórios e a UI quase não mudam.
 * - Conexão via `DATABASE_URL`. Em serverless (Vercel) use a connection string
 *   do Session Pooler do Supabase.
 */

let pool: Pool | null = null;

function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL não configurada. Defina a connection string do Postgres (v. .env.example / docs/DEPLOY.md).",
    );
  }
  return url;
}

/** Pool singleton. Em produção (Supabase/Neon) hospedado, o SSL é obrigatório. */
export function getPool(): Pool {
  if (pool) return pool;
  const url = databaseUrl();
  const needsSsl = !/localhost|127\.0\.0\.1/.test(url);
  pool = new Pool({
    connectionString: url,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
    max: 10,
  });
  return pool;
}

/** Executa uma query e devolve as linhas tipadas. */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const res = await getPool().query<T>(text, params as never[]);
  return res.rows;
}

/** Executa uma query e devolve a primeira linha (ou null). */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/** Executa uma query de escrita e devolve o número de linhas afetadas. */
export async function execute(text: string, params: unknown[] = []): Promise<number> {
  const res = await getPool().query(text, params as never[]);
  return res.rowCount ?? 0;
}

/**
 * Executa `fn` dentro de uma transação (BEGIN/COMMIT/ROLLBACK). Substitui o
 * `db.transaction(() => {...})()` síncrono do better-sqlite3.
 */
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function uid(): string {
  return crypto.randomUUID();
}

/** Encerra o pool (usado nos testes). */
export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
