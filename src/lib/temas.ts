/**
 * Identidade temática por corporação/concurso.
 *
 * IMPORTANTE (ética e segurança jurídica): nada aqui reproduz brasão,
 * distintivo, logotipo ou marca oficial. São apenas acentos de cor,
 * rótulos textuais e frases motivacionais genéricas de estudo. A intenção
 * é evocar o universo militar/policial sem imitar símbolos institucionais.
 */

export type TemaConcurso = "pmdf" | "prf" | "pf" | "operacional";

export type IdentidadeConcurso = {
  tema: TemaConcurso;
  sigla: string;
  rotulo: string;
  lema: string;
  descricao: string;
  /** Frases soltas de motivação (não são lemas oficiais de corporação). */
  frases: string[];
};

const IDENTIDADES: Record<TemaConcurso, IdentidadeConcurso> = {
  pmdf: {
    tema: "pmdf",
    sigla: "PMDF",
    rotulo: "Polícia Militar do DF",
    lema: "Disciplina, hierarquia e preparo",
    descricao: "Preparação para o ingresso na PMDF (praças e oficiais).",
    frases: [
      "Disciplina é a ponte entre metas e conquistas.",
      "A farda se conquista no estudo de cada dia.",
      "Ordem, rigor e constância constroem o oficial.",
      "Quem treina com método chega pronto ao dia da prova.",
    ],
  },
  prf: {
    tema: "prf",
    sigla: "PRF",
    rotulo: "Polícia Rodoviária Federal",
    lema: "Presença, técnica e estratégia",
    descricao: "Preparação para o cargo de Policial Rodoviário Federal.",
    frases: [
      "O dever se cumpre com preparo, não com pressa.",
      "Constância vence talento quando o talento descansa.",
      "Cada questão respondida é um passo na rodovia do objetivo.",
      "Técnica e calma: a patrulha começa na preparação.",
    ],
  },
  pf: {
    tema: "pf",
    sigla: "PF",
    rotulo: "Polícia Federal",
    lema: "Investigação, rigor e método",
    descricao: "Preparação para o cargo de Agente de Polícia Federal.",
    frases: [
      "Investigar o próprio estudo é o primeiro inquérito.",
      "Nenhum detalhe é pequeno quando o rigor é regra.",
      "Método e persistência: o rastro leva ao resultado.",
      "Revisar é refazer o caminho sem deixar pontas soltas.",
    ],
  },
  operacional: {
    tema: "operacional",
    sigla: "GERAL",
    rotulo: "Formação geral",
    lema: "Método, foco e disciplina",
    descricao: "Conteúdos e materiais de uso geral na preparação.",
    frases: [
      "Disciplina hoje, resultado amanhã.",
      "O preparo silencioso antecede a aprovação.",
      "Foco no processo, confiança no resultado.",
    ],
  },
};

/** Infere a identidade a partir do slug da trilha (catalog_collections.slug). */
export function identificarConcurso(slug: string): IdentidadeConcurso {
  const s = slug.toLowerCase();
  if (s.includes("pmdf")) return IDENTIDADES.pmdf;
  if (s.includes("prf")) return IDENTIDADES.prf;
  if (s.includes("pf-") || s.includes("policial-federal") || s.endsWith("pf")) {
    return IDENTIDADES.pf;
  }
  return IDENTIDADES.operacional;
}

/** Classe de tema (globals.css) correspondente à identidade. */
export function classeTema(id: IdentidadeConcurso): string {
  return `tema-${id.tema}`;
}

/** Frase estável por dia + slug (evita trocar a cada render). */
export function fraseDoDia(id: IdentidadeConcurso, semente = ""): string {
  if (id.frases.length === 0) return "";
  const dia = new Date().toISOString().slice(0, 10);
  const chave = `${dia}:${semente}`;
  let soma = 0;
  for (let i = 0; i < chave.length; i++) soma = (soma + chave.charCodeAt(i)) % 9973;
  return id.frases[soma % id.frases.length];
}
