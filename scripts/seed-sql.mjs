#!/usr/bin/env node
/**
 * Gera db/postgres/seed_catalogo.sql — um único arquivo SQL com os INSERTs
 * do conteúdo inicial (PMDF, PF, PRF), pronto para colar no SQL Editor do
 * Supabase quando o acesso direto à porta 5432 está bloqueado.
 *
 * Uso: node scripts/seed-sql.mjs
 * Fonte única: COLLECTIONS de scripts/seed-catalog.mjs.
 */
import fs from "fs";
import path from "path";
import { COLLECTIONS, CHECKED_AT } from "./seed-catalog.mjs";
import { EXTRAS_POR_SLUG } from "./conteudo-extra.mjs";

const esc = (v) => {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  return "'" + String(v).replace(/'/g, "''") + "'";
};

const now = new Date().toISOString();
const lines = [];

lines.push("-- Moriarty — seed do catálogo de concursos (gerado por scripts/seed-sql.mjs).");
lines.push("-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em Run.");
lines.push("-- Idempotente: pode rodar mais de uma vez sem duplicar.");
lines.push("");
lines.push("begin;");
lines.push("");

for (const col of COLLECTIONS) {
  const colId = `catalog:${col.slug}`;
  lines.push(`-- Trilha: ${col.title}`);
  lines.push(
    `insert into catalog_collections (id, slug, title, discipline_label, summary, status, status_note, source_name, source_url, edital_ref, checked_at, created_at, updated_at) values (` +
      [
        esc(colId),
        esc(col.slug),
        esc(col.title),
        esc("Concursos"),
        esc(col.summary),
        esc(col.status),
        esc(col.statusNote),
        esc(col.source.name),
        esc(col.source.url),
        esc(col.editalRef),
        esc(CHECKED_AT),
        esc(now),
        esc(now),
      ].join(", ") +
      `)\non conflict (slug) do update set title=excluded.title, summary=excluded.summary, status=excluded.status, status_note=excluded.status_note, source_name=excluded.source_name, source_url=excluded.source_url, edital_ref=excluded.edital_ref, checked_at=excluded.checked_at, updated_at=excluded.updated_at;`,
  );

  let areaOrder = 0;
  for (const area of col.areas) {
    const id = `catalog:${col.slug}:area:${areaOrder}`;
    lines.push(
      `insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values (` +
        [
          esc(id),
          esc(colId),
          esc("area"),
          esc("resumo_proprio"),
          esc(area),
          esc(""),
          esc(""),
          "NULL",
          esc(""),
          esc(""),
          esc("Matéria da trilha"),
          esc(""),
          esc(areaOrder),
          esc(now),
          esc(now),
        ].join(", ") +
        `)\non conflict (collection_id, title, kind) do nothing;`,
    );
    areaOrder++;
  }

  for (const item of col.items) {
    const id = `catalog:${col.slug}:${item.kind}:${item.order}`;
    lines.push(
      `insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values (` +
        [
          esc(id),
          esc(colId),
          esc(item.kind),
          esc(item.category ?? "resumo_proprio"),
          esc(item.title),
          esc(item.body ?? ""),
          esc(item.options ? JSON.stringify(item.options) : ""),
          typeof item.correctIndex === "number" ? String(item.correctIndex) : "NULL",
          esc(item.explanation ?? ""),
          esc(item.originNote ?? ""),
          esc(item.refLabel ?? ""),
          esc(item.url ?? ""),
          esc(item.order),
          esc(now),
          esc(now),
        ].join(", ") +
        `)\non conflict (collection_id, title, kind) do nothing;`,
    );
  }

  const extrasFn = EXTRAS_POR_SLUG[col.slug];
  if (extrasFn) {
    for (const item of extrasFn()) {
      const id = `catalog:${col.slug}:${item.kind}:${item.order}`;
      lines.push(
        `insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values (` +
          [
            esc(id),
            esc(colId),
            esc(item.kind),
            esc(item.category ?? "resumo_proprio"),
            esc(item.title),
            esc(item.body ?? ""),
            esc(item.options ? JSON.stringify(item.options) : ""),
            typeof item.correctIndex === "number" ? String(item.correctIndex) : "NULL",
            esc(item.explanation ?? ""),
            esc(item.originNote ?? ""),
            esc(item.refLabel ?? ""),
            esc(item.url ?? ""),
            esc(item.order),
            esc(now),
            esc(now),
          ].join(", ") +
          `)\non conflict (collection_id, title, kind) do nothing;`,
      );
    }
  }
  lines.push("");
}

lines.push("commit;");
lines.push("");

const out = path.join(process.cwd(), "db", "postgres", "seed_catalogo.sql");
fs.writeFileSync(out, lines.join("\n"), "utf8");
console.log(`Gerado: ${out}`);
console.log(`Coleções: ${COLLECTIONS.length} · linhas SQL: ${lines.length}`);
