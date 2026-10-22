/**
 * Guarda da fronteira cliente/servidor do Next.js.
 *
 * Em um módulo com "use client", TODO export vira referência de cliente: o
 * servidor não pode chamar a função (só renderizar o componente ou passá-la
 * como prop). Se um server component importa um valor de runtime (não-tipo,
 * minúsculo) de um módulo cliente, a página quebra em runtime com
 * "Attempted to call X() from the server but X is on the client".
 *
 * Este teste (roda sem banco) impede a regressão: funções puras usadas no
 * servidor devem morar em `src/lib/*` (ou outro módulo sem "use client").
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const RAIZ = resolve(__dirname, "..");
const SRC = join(RAIZ, "src");

function listarArquivos(dir: string, acc: string[] = []): string[] {
  for (const entrada of readdirSync(dir)) {
    const caminho = join(dir, entrada);
    const st = statSync(caminho);
    if (st.isDirectory()) listarArquivos(caminho, acc);
    else if (/\.(ts|tsx)$/.test(caminho)) acc.push(caminho);
  }
  return acc;
}

function conteudo(caminho: string): string {
  return readFileSync(caminho, "utf8");
}

/** Primeira linha de código (ignora comentários/vazias). */
function primeiraLinhaDeCodigo(src: string): string {
  for (const linha of src.split(/\r?\n/)) {
    const t = linha.trim();
    if (!t) continue;
    if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) continue;
    return t;
  }
  return "";
}

function ehCliente(caminho: string): boolean {
  return /^["']use client["'];?$/.test(primeiraLinhaDeCodigo(conteudo(caminho)));
}

/** Exports de RUNTIME (ignora tipos/interfaces) de um módulo. */
function exportsDeRuntime(caminho: string): Set<string> {
  const src = conteudo(caminho);
  const nomes = new Set<string>();

  const padroes = [
    /export\s+(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)/g,
    /export\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g,
    /export\s+class\s+([A-Za-z_$][\w$]*)/g,
  ];
  for (const re of padroes) {
    for (const m of src.matchAll(re)) nomes.add(m[1]);
  }

  for (const m of src.matchAll(/export\s+(?!type\s)({[^}]*})\s*(?:from\s*["'][^"']+["'])?/g)) {
    for (const parte of m[1].replace(/[{}]/g, "").split(",")) {
      const p = parte.trim();
      if (!p || p.startsWith("type ")) continue;
      nomes.add(p.split(/\s+as\s+/)[0].trim());
    }
  }

  if (/export\s+default/.test(src)) nomes.add("default");
  return nomes;
}

/** Resolve um especificador de import para um arquivo do projeto. */
function resolver(especificador: string, arquivoImportador: string): string | null {
  let base: string;
  if (especificador.startsWith("@/")) base = join(SRC, especificador.slice(2));
  else if (especificador.startsWith(".")) base = resolve(dirname(arquivoImportador), especificador);
  else return null;

  const candidatos = [
    base,
    `${base}.tsx`,
    `${base}.ts`,
    join(base, "index.tsx"),
    join(base, "index.ts"),
  ];
  for (const c of candidatos) {
    try {
      if (statSync(c).isFile()) return c;
    } catch {
      /* segue */
    }
  }
  return null;
}

type Importacao = {
  tipo: boolean;
  nomes: string[];
};

function importsDe(caminho: string): { especificador: string; importacao: Importacao }[] {
  const src = conteudo(caminho);
  const saida: { especificador: string; importacao: Importacao }[] = [];

  for (const m of src.matchAll(/import\s+(type\s+)?([\s\S]*?)\s+from\s*["']([^"']+)["']/g)) {
    const tipoImport = Boolean(m[1]);
    const clausula = m[2].trim();
    const especificador = m[3];
    const nomes: string[] = [];

    const abreChave = clausula.indexOf("{");
    if (abreChave >= 0) {
      const interno = clausula.slice(abreChave + 1, clausula.lastIndexOf("}"));
      for (const parte of interno.split(",")) {
        const p = parte.trim();
        if (!p) continue;
        const eTipo = p.startsWith("type ") || tipoImport;
        nomes.push(p.replace(/^type\s+/, "").split(/\s+as\s+/)[0].trim());
        if (eTipo && !nomes[nomes.length - 1].startsWith("type:")) {
          nomes[nomes.length - 1] = `type:${nomes[nomes.length - 1]}`;
        }
      }
      const antes = clausula.slice(0, abreChave).replace(/,\s*$/, "").trim();
      if (antes) nomes.push(antes);
    } else if (clausula) {
      nomes.push(clausula.replace(/,\s*$/, "").trim());
    }

    saida.push({ especificador, importacao: { tipo: tipoImport, nomes } });
  }
  return saida;
}

const arquivos = listarArquivos(SRC);

describe("fronteira cliente/servidor", () => {
  it("encontra módulos cliente e de servidor para análise", () => {
    const clientes = arquivos.filter(ehCliente);
    const servidores = arquivos.filter((a) => !ehCliente(a));
    expect(clientes.length).toBeGreaterThan(10);
    expect(servidores.length).toBeGreaterThan(10);
  });

  it("servidor não importa funções de runtime de módulos 'use client'", () => {
    const violacoes: string[] = [];

    for (const arquivo of arquivos) {
      if (ehCliente(arquivo)) continue;

      for (const { especificador, importacao } of importsDe(arquivo)) {
        const destino = resolver(especificador, arquivo);
        if (!destino || !ehCliente(destino)) continue;

        const exportsRuntime = exportsDeRuntime(destino);
        for (const bruto of importacao.nomes) {
          const eTipo = bruto.startsWith("type:");
          const nome = bruto.replace(/^type:/, "");
          if (eTipo) continue;
          if (nome === "default") continue;
          if (/^[A-Z]/.test(nome)) continue; // componente/classe: pode ser renderizado
          if (!exportsRuntime.has(nome)) continue; // não é export de runtime do módulo
          violacoes.push(
            `${arquivo.slice(RAIZ.length + 1)} importa "${nome}" de ${destino.slice(RAIZ.length + 1)} — ` +
              `módulo "use client" não pode ser chamado no servidor; mova a função para src/lib/*`,
          );
        }
      }
    }

    expect(violacoes, violacoes.join("\n")).toEqual([]);
  });

  it("todo módulo cliente mantém a diretiva antes de qualquer código", () => {
    for (const arquivo of arquivos) {
      const src = conteudo(arquivo);
      // diretiva real = linha isolada com a diretiva (ignora menções em comentários)
      const temDiretiva = src
        .split(/\r?\n/)
        .some((l) => /^\s*["']use client["'];?\s*$/.test(l));
      if (!temDiretiva) continue;
      expect(primeiraLinhaDeCodigo(src), arquivo).toMatch(/^["']use client["'];?$/);
    }
  });
});
