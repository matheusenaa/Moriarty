/**
 * Contribuições de conteúdo da comunidade.
 *
 * Regras do Moriarty aplicadas aqui:
 * - nada entra no catálogo sem moderação;
 * - a questão é sempre **autoral** e nunca se apresenta como oficial;
 * - a fonte indicada pelo autor é preservada (link + rótulo).
 *
 * Funções puras (sem banco): validam, normalizam e transformam a sugestão em
 * item do catálogo.
 */

export const TIPOS_CONTRIBUICAO = [
  { valor: "nota", label: "Nota de estudo" },
  { valor: "questao", label: "Questão de treino" },
  { valor: "flashcard", label: "Flashcard" },
] as const;

export type TipoContribuicao = (typeof TIPOS_CONTRIBUICAO)[number]["valor"];

export type DadosContribuicao = {
  collectionSlug: string;
  kind: TipoContribuicao;
  title: string;
  body: string;
  options: string[];
  correctIndex: number | null;
  explanation: string;
  sourceUrl: string;
  sourceLabel: string;
};

export const LIMITE_CORPO = 8000;
export const LIMITE_ALTERNATIVAS = 6;

export function ehTipoContribuicao(valor: string): valor is TipoContribuicao {
  return TIPOS_CONTRIBUICAO.some((t) => t.valor === valor);
}

/** Alias compatibilidade. */
export const tipoContribuicao = ehTipoContribuicao;

export function normalizarContribuicao(entrada: DadosContribuicao): DadosContribuicao {
  return {
    collectionSlug: entrada.collectionSlug.trim(),
    kind: entrada.kind,
    title: entrada.title.trim(),
    body: entrada.body.trim(),
    options: entrada.options.map((o) => o.trim()).filter((o) => o.length > 0),
    correctIndex: entrada.correctIndex,
    explanation: entrada.explanation.trim(),
    sourceUrl: entrada.sourceUrl.trim(),
    sourceLabel: entrada.sourceLabel.trim(),
  };
}

/** Erros de validação (lista vazia = sugestão válida). */
export function validarContribuicao(d: DadosContribuicao): string[] {
  const erros: string[] = [];
  if (!d.collectionSlug) erros.push("Escolha a trilha da sugestão.");
  if (!ehTipoContribuicao(d.kind)) erros.push("Escolha o tipo de conteúdo.");
  if (d.title.length < 3) erros.push("O título precisa de pelo menos 3 caracteres.");
  if (d.title.length > 160) erros.push("O título precisa ter no máximo 160 caracteres.");
  if (d.body.length < 10) erros.push("Escreva o conteúdo (mínimo 10 caracteres).");
  if (d.body.length > LIMITE_CORPO) {
    erros.push(`O conteúdo precisa ter no máximo ${LIMITE_CORPO} caracteres.`);
  }
  if (d.kind === "questao") {
    if (d.options.length < 2) erros.push("A questão precisa de pelo menos 2 alternativas.");
    if (d.options.length > LIMITE_ALTERNATIVAS) {
      erros.push(`A questão pode ter no máximo ${LIMITE_ALTERNATIVAS} alternativas.`);
    }
    if (d.correctIndex === null || d.correctIndex < 0 || d.correctIndex >= d.options.length) {
      erros.push("Indique qual alternativa é o gabarito.");
    }
    if (d.explanation.length < 10) {
      erros.push("Explique por que a alternativa correta é a correta.");
    }
  }
  if (d.kind === "flashcard" && !/frente\s*:[\s\S]+verso\s*:/i.test(d.body)) {
    erros.push('Use o formato "Frente: ..." e "Verso: ..." no conteúdo do flashcard.');
  }
  if (d.sourceUrl && !/^https?:\/\/\S+\.\S+/i.test(d.sourceUrl)) {
    erros.push("O link da fonte precisa ser um endereço completo (http:// ou https://).");
  }
  return erros;
}

/** Corpo no formato usado pelos flashcards do catálogo. */
export function textoFlashcard(frente: string, verso: string): string {
  return `Frente: ${frente.trim()}\nVerso: ${verso.trim()}`;
}

export type ItemCatalogo = {
  id: string;
  kind: string;
  category: string;
  title: string;
  body: string;
  options_json: string;
  correct_index: number | null;
  explanation: string;
  origin_note: string;
  ref_label: string;
  url: string;
  sort_order: number;
};

/**
 * Transforma a sugestão aprovada em item do catálogo de sistema.
 * A autoria é atribuída no `origin_note` e a questão nunca aparece como oficial.
 */
export function itemDaContribuicao(
  c: DadosContribuicao,
  opts: { id: string; autor: string; sortOrder: number },
): ItemCatalogo {
  const autor = opts.autor.trim() || "um aluno";
  const base =
    c.kind === "questao"
      ? `Questão autoral de ${autor}. NÃO é questão oficial.`
      : c.kind === "flashcard"
        ? `Flashcard autoral de ${autor}.`
        : `Conteúdo autoral de ${autor}.`;
  const origem = c.sourceUrl
    ? `${base} Fonte indicada pelo autor: ${c.sourceLabel || c.sourceUrl}`
    : `${base} Sem fonte externa indicada.`;

  return {
    id: opts.id,
    kind: c.kind,
    category: c.kind === "questao" ? "questao_autoral" : c.kind === "flashcard" ? "flashcard" : "resumo_proprio",
    title: c.title,
    body: c.body,
    options_json: JSON.stringify(c.options),
    correct_index: c.kind === "questao" ? c.correctIndex : null,
    explanation: c.explanation,
    origin_note: origem,
    ref_label: c.sourceLabel,
    url: c.sourceUrl,
    sort_order: opts.sortOrder,
  };
}
