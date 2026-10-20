/**
 * Moriarty — gera o SQL de seed do catálogo para Supabase/Postgres.
 *
 * Reutiliza a MESMA fonte de dados do seed SQLite (scripts/seed-catalog.mjs), então
 * o conteúdo é idêntico nos dois mundos. Este script NÃO se conecta a nada: apenas
 * imprime (ou grava) um arquivo .sql para você colar no SQL Editor do Supabase ou
 * rodar via `psql`. Sem dependências novas, sem simular integração.
 *
 * Uso:
 *   node scripts/seed-catalog-supabase.mjs            # imprime no stdout
 *   node scripts/seed-catalog-supabase.mjs out.sql    # grava em arquivo
 */
import fs from "fs";
import { COLLECTIONS } from "./seed-catalog.mjs";

const CHECKED_AT = "2026-10-20";

function q(value) {
  if (value === null || value === undefined) return "null";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function jsonOrNull(value) {
  if (value === null || value === undefined || value === "") return "null";
  return q(value);
}

/** Mesma normalização de itens usada pelo seed SQLite. */
function materializeItems(col) {
  const items = [];
  let areaOrder = 0;
  for (const area of col.areas) {
    items.push({
      id: `catalog:${col.slug}:area:${areaOrder}`,
      kind: "area",
      category: "resumo_proprio",
      title: area,
      body: "",
      options_json: "",
      correct_index: null,
      explanation: "",
      origin_note: "",
      ref_label: "Matéria da trilha",
      url: "",
      sort_order: areaOrder,
    });
    areaOrder++;
  }
  for (const item of col.items) {
    items.push({
      id: `catalog:${col.slug}:${item.kind}:${item.order}`,
      kind: item.kind,
      category: item.category ?? "resumo_proprio",
      title: item.title,
      body: item.body ?? "",
      options_json: item.options ? JSON.stringify(item.options) : "",
      correct_index: typeof item.correctIndex === "number" ? item.correctIndex : null,
      explanation: item.explanation ?? "",
      origin_note: item.originNote ?? "",
      ref_label: item.refLabel ?? "",
      url: item.url ?? "",
      sort_order: item.order,
    });
  }
  return items;
}

const lines = [];
lines.push("-- Moriarty — seed do catálogo para Supabase/Postgres (gerado automaticamente).");
lines.push("-- Idempotente: on conflict do nothing / do update. Rode no SQL Editor do Supabase.");
lines.push("begin;");
lines.push("");

for (const col of COLLECTIONS) {
  const colId = `catalog:${col.slug}`;
  lines.push(`-- Coleção: ${col.title}`);
  lines.push(
    `insert into catalog_collections (id, slug, title, discipline_label, summary, status, status_note, source_name, source_url, edital_ref, checked_at) values (` +
      [
        q(colId),
        q(col.slug),
        q(col.title),
        q("Concursos"),
        q(col.summary),
        q(col.status),
        q(col.statusNote),
        q(col.source.name),
        q(col.source.url),
        q(col.editalRef),
        q(CHECKED_AT),
      ].join(", ") +
      `)\non conflict (slug) do update set title = excluded.title, summary = excluded.summary, status = excluded.status, status_note = excluded.status_note, source_name = excluded.source_name, source_url = excluded.source_url, edital_ref = excluded.edital_ref, checked_at = excluded.checked_at, updated_at = now();`,
  );

  for (const item of materializeItems(col)) {
    lines.push(
      `insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order) values (` +
        [
          q(item.id),
          q(colId),
          q(item.kind),
          q(item.category),
          q(item.title),
          q(item.body),
          jsonOrNull(item.options_json),
          item.correct_index === null ? "null" : String(item.correct_index),
          q(item.explanation),
          q(item.origin_note),
          q(item.ref_label),
          q(item.url),
          String(item.sort_order),
        ].join(", ") +
        `)\non conflict (collection_id, title, kind) do nothing;`,
    );
  }
  lines.push("");
}

lines.push("commit;");
lines.push("");

const sql = lines.join("\n");
const out = process.argv[2];
if (out) {
  fs.writeFileSync(out, sql, "utf8");
  const itemCount = COLLECTIONS.reduce((n, c) => n + materializeItems(c).length, 0);
  console.log(`SQL gerado em ${out}: ${COLLECTIONS.length} coleções, ${itemCount} itens.`);
} else {
  process.stdout.write(sql);
}
