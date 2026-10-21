/**
 * Gera um ROTEIRO DE ESTUDO a partir de uma trilha do catálogo.
 *
 * Saída em Markdown (para copiar/colar) e em HTML imprimível (para salvar em
 * PDF pelo navegador, Ctrl+P). Tudo determinístico e sem dependências externas.
 *
 * Regras de direitos autorais (mantidas):
 * - Notas/resumos: autoria própria.
 * - Questões: autorais ("NÃO é questão oficial").
 * - Fonte oficial: apenas o link, nunca cópia de prova.
 */

export type ItemRoteiro = {
  kind: string;
  category: string;
  title: string;
  body: string;
  ref_label: string;
  url: string;
};

export type ColecaoRoteiro = {
  slug: string;
  title: string;
  summary: string;
  status_note: string;
  edital_ref: string;
  source_name: string;
  source_url: string;
  checked_at: string;
};

export type Roteiro = {
  slug: string;
  titulo: string;
  geradoEm: string;
  markdown: string;
  html: string;
};

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function extrairFraseDoDia(slug: string): string {
  return slug.includes("pmdf")
    ? "Disciplina e hierarquia: a preparação começa no detalhe."
    : slug.includes("prf")
      ? "Constância na estrada longa vence a corrida."
      : "Inteligência e método: cada caso estudado é um passo.";
}

/** Monta o roteiro (Markdown + HTML) a partir da coleção e seus itens. */
export function montarRoteiro(
  colecao: ColecaoRoteiro,
  itens: ItemRoteiro[],
  geradoEm: string,
): Roteiro {
  const areas = itens.filter((i) => i.kind === "area");
  const notas = itens.filter((i) => i.kind === "nota");
  const flashcards = itens.filter((i) => i.kind === "flashcard");
  const fontes = notas.filter((n) => n.ref_label === "Fonte oficial");
  const cronograma = notas.find((n) => n.title.toLowerCase().includes("cronograma sugerido"));
  const notasComuns = notas.filter(
    (n) => n.ref_label !== "Fonte oficial" && !n.title.toLowerCase().includes("cronograma sugerido"),
  );

  const md: string[] = [];
  md.push(`# Roteiro de estudo — ${colecao.title}`);
  md.push("");
  md.push(`> ${colecao.summary}`);
  md.push("");
  md.push(`- **Edital de referência:** ${colecao.edital_ref || "—"}`);
  md.push(`- **Fonte consultada:** ${colecao.source_name || "—"}`);
  md.push(`- **Verificado em:** ${colecao.checked_at}`);
  md.push(`- **Gerado em:** ${geradoEm}`);
  md.push("");
  md.push(`_${extrairFraseDoDia(colecao.slug)}_`);
  md.push("");

  if (areas.length > 0) {
    md.push(`## Matérias (${areas.length})`);
    md.push("");
    for (const a of areas) md.push(`- [ ] ${a.title}`);
    md.push("");
  }

  if (cronograma) {
    md.push("## Cronograma sugerido");
    md.push("");
    md.push(cronograma.body);
    md.push("");
  }

  if (notasComuns.length > 0) {
    md.push(`## Notas de estudo (${notasComuns.length})`);
    md.push("");
    for (const n of notasComuns) {
      md.push(`### ${n.title}`);
      if (n.ref_label) md.push(`_Referência: ${n.ref_label}_`);
      md.push("");
      md.push(n.body);
      if (n.url) md.push(`\nFonte oficial: ${n.url}`);
      md.push("");
    }
  }

  if (flashcards.length > 0) {
    md.push(`## Flashcards (${flashcards.length})`);
    md.push("");
    for (const f of flashcards) {
      const partes = f.body.split(/\n\s*\n/);
      md.push(`- **${partes[0] ?? f.title}**`);
      if (partes[1]) md.push(`  ${partes[1].replace(/\n/g, " ")}`);
    }
    md.push("");
  }

  if (fontes.length > 0) {
    md.push(`## Fontes oficiais (${fontes.length})`);
    md.push("");
    for (const f of fontes) {
      md.push(`- [${f.title}](${f.url})`);
    }
    md.push("");
  }

  md.push("---");
  md.push("");
  md.push(
    "Conteúdo de autoria própria (notas/flashcards) e legislação oficial citada com link. " +
      "Questões são autorais, para prática — NÃO são questões de prova oficial.",
  );

  const html = montarHtml(colecao, itens, geradoEm);

  return {
    slug: colecao.slug,
    titulo: colecao.title,
    geradoEm,
    markdown: md.join("\n"),
    html,
  };
}

function montarHtml(colecao: ColecaoRoteiro, itens: ItemRoteiro[], geradoEm: string): string {
  const areas = itens.filter((i) => i.kind === "area");
  const notas = itens.filter((i) => i.kind === "nota");
  const flashcards = itens.filter((i) => i.kind === "flashcard");
  const fontes = notas.filter((n) => n.ref_label === "Fonte oficial");
  const cronograma = notas.find((n) => n.title.toLowerCase().includes("cronograma sugerido"));
  const notasComuns = notas.filter(
    (n) => n.ref_label !== "Fonte oficial" && !n.title.toLowerCase().includes("cronograma sugerido"),
  );

  const linhas: string[] = [];
  linhas.push(`<h1>Roteiro de estudo — ${esc(colecao.title)}</h1>`);
  linhas.push(`<p class="meta">${esc(colecao.summary)}</p>`);
  linhas.push(
    `<ul class="meta"><li><strong>Edital:</strong> ${esc(colecao.edital_ref || "—")}</li>` +
      `<li><strong>Fonte:</strong> ${esc(colecao.source_name || "—")}</li>` +
      `<li><strong>Verificado em:</strong> ${esc(colecao.checked_at)}</li>` +
      `<li><strong>Gerado em:</strong> ${esc(geradoEm)}</li></ul>`,
  );

  if (areas.length) {
    linhas.push(`<h2>Matérias (${areas.length})</h2><ul>`);
    for (const a of areas) linhas.push(`<li>${esc(a.title)}</li>`);
    linhas.push("</ul>");
  }

  if (cronograma) {
    linhas.push(`<h2>Cronograma sugerido</h2><pre>${esc(cronograma.body)}</pre>`);
  }

  if (notasComuns.length) {
    linhas.push(`<h2>Notas de estudo (${notasComuns.length})</h2>`);
    for (const n of notasComuns) {
      linhas.push(`<h3>${esc(n.title)}</h3>`);
      if (n.ref_label) linhas.push(`<p class="ref">Referência: ${esc(n.ref_label)}</p>`);
      linhas.push(`<pre>${esc(n.body)}</pre>`);
      if (n.url)
        linhas.push(
          `<p><a href="${esc(n.url)}" target="_blank" rel="noopener noreferrer">Fonte oficial</a></p>`,
        );
    }
  }

  if (flashcards.length) {
    linhas.push(`<h2>Flashcards (${flashcards.length})</h2><ul>`);
    for (const f of flashcards) {
      const partes = f.body.split(/\n\s*\n/);
      linhas.push(
        `<li><strong>${esc(partes[0] ?? f.title)}</strong>` +
          (partes[1] ? `<br/>${esc(partes[1].replace(/\n/g, " "))}` : "") +
          `</li>`,
      );
    }
    linhas.push("</ul>");
  }

  if (fontes.length) {
    linhas.push(`<h2>Fontes oficiais (${fontes.length})</h2><ul>`);
    for (const f of fontes)
      linhas.push(
        `<li><a href="${esc(f.url)}" target="_blank" rel="noopener noreferrer">${esc(f.title)}</a></li>`,
      );
    linhas.push("</ul>");
  }

  linhas.push(
    `<hr/><p class="meta">Conteúdo de autoria própria (notas/flashcards) e legislação oficial citada com link. ` +
      `Questões são autorais, para prática — NÃO são questões de prova oficial.</p>`,
  );

  return linhas.join("\n");
}

/** Documento HTML completo e imprimível (estilo sóbrio, otimizado para PDF). */
export function documentoImprimivel(roteiro: Roteiro): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(roteiro.titulo)} — Roteiro de estudo</title>
<style>
  :root { color-scheme: light; }
  body { font-family: Georgia, "Times New Roman", serif; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 32px; line-height: 1.55; }
  h1 { font-size: 28px; border-bottom: 2px solid #1e3a5f; padding-bottom: 8px; }
  h2 { font-size: 20px; color: #1e3a5f; margin-top: 28px; border-left: 4px solid #c9a227; padding-left: 8px; }
  h3 { font-size: 16px; margin-bottom: 4px; }
  pre { white-space: pre-wrap; font-family: Georgia, serif; background: #f6f6f3; padding: 10px; border-radius: 4px; }
  a { color: #1e3a5f; }
  .meta { color: #444; font-size: 14px; }
  .ref { color: #7a6a2a; font-size: 13px; margin: 2px 0; }
  hr { border: none; border-top: 1px solid #ccc; margin: 24px 0; }
  @media print { body { padding: 0; } a { text-decoration: none; } }
</style>
</head>
<body>
${roteiro.html}
</body>
</html>`;
}
