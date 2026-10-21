/**
 * Fontes oficiais FIXAS para o agente de busca do Moriarty.
 *
 * Filosofia: sem IA paga e sem scraping agressivo. A busca é determinística —
 * casa a consulta do usuário com um catálogo curado de leis/artigos oficiais e
 * devolve o link oficial + o trecho de referência. Tudo roda no servidor.
 *
 * Cada entrada aponta para a fonte primária (Planalto/gov.br). Nunca copiamos
 * prova protegida: aqui só apontamos para a lei e citamos o artigo.
 */

export type FonteOficial = {
  id: string;
  /** Rótulo curto (norma + artigo). */
  rotulo: string;
  /** Título completo da norma. */
  norma: string;
  /** Referência do artigo/inciso (quando aplicável). */
  artigo?: string;
  /** Emenda/resumo do que trata (texto próprio, curto). */
  sobre: string;
  /** Link oficial (primário). */
  url: string;
  /** Concurso(s)/área(s) em que costuma cair. */
  concursos: string[];
  /** Palavras-chave para o matching (minúsculas, sem acento). */
  palavrasChave: string[];
};

/** Normaliza texto para matching: minúsculas e sem acentos. */
export function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export const FONTES_OFICIAIS: FonteOficial[] = [
  {
    id: "cf-art5",
    rotulo: "CF/88, art. 5º",
    norma: "Constituição da República Federativa do Brasil de 1988",
    artigo: "Art. 5º",
    sobre:
      "Direitos e garantias fundamentais (igualdade, legalidade, liberdade, devido processo, entre outros).",
    url: "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm",
    concursos: ["PMDF", "PF", "PRF"],
    palavrasChave: [
      "direitos fundamentais",
      "garantias fundamentais",
      "igualdade",
      "legalidade",
      "liberdade",
      "art 5",
      "artigo 5",
    ],
  },
  {
    id: "cf-art37",
    rotulo: "CF/88, art. 37",
    norma: "Constituição da República Federativa do Brasil de 1988",
    artigo: "Art. 37",
    sobre:
      "Princípios da Administração Pública: legalidade, impessoalidade, moralidade, publicidade e eficiência (LIMPE).",
    url: "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm",
    concursos: ["PMDF", "PF", "PRF"],
    palavrasChave: [
      "administracao publica",
      "limpe",
      "legalidade",
      "impessoalidade",
      "moralidade",
      "publicidade",
      "eficiencia",
      "art 37",
      "artigo 37",
    ],
  },
  {
    id: "cf-art144",
    rotulo: "CF/88, art. 144",
    norma: "Constituição da República Federativa do Brasil de 1988",
    artigo: "Art. 144",
    sobre:
      "Segurança pública: dever do Estado, direito e responsabilidade de todos; órgãos policiais e suas competências.",
    url: "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm",
    concursos: ["PMDF", "PF", "PRF"],
    palavrasChave: [
      "seguranca publica",
      "polícia federal",
      "policia federal",
      "policia rodoviaria federal",
      "policia militar",
      "art 144",
      "artigo 144",
    ],
  },
  {
    id: "ctb-art306",
    rotulo: "CTB, art. 306",
    norma: "Lei nº 9.503/1997 — Código de Trânsito Brasileiro",
    artigo: "Art. 306",
    sobre:
      "Crime de conduzir sob influência de álcool ou substância psicoativa com capacidade psicomotora alterada.",
    url: "https://www.planalto.gov.br/ccivil_03/leis/l9503compilado.htm",
    concursos: ["PRF"],
    palavrasChave: [
      "embriaguez",
      "alcool",
      "art 306",
      "artigo 306",
      "capacidade psicomotora",
      "crime de transito",
    ],
  },
  {
    id: "ctb-art165",
    rotulo: "CTB, art. 165",
    norma: "Lei nº 9.503/1997 — Código de Trânsito Brasileiro",
    artigo: "Art. 165",
    sobre:
      "Infração administrativa gravíssima: dirigir sob influência de álcool ou substância psicoativa.",
    url: "https://www.planalto.gov.br/ccivil_03/leis/l9503compilado.htm",
    concursos: ["PRF"],
    palavrasChave: [
      "embriaguez administrativa",
      "art 165",
      "artigo 165",
      "infracao gravissima",
      "alcool",
    ],
  },
  {
    id: "ctb-snt",
    rotulo: "CTB, arts. 5º a 25",
    norma: "Lei nº 9.503/1997 — Código de Trânsito Brasileiro",
    artigo: "Arts. 5º a 25",
    sobre:
      "Sistema Nacional de Trânsito (SNT): CONTRAN, SENATRAN, CETRAN, CONTRADIFE, JARI e PRF.",
    url: "https://www.planalto.gov.br/ccivil_03/leis/l9503compilado.htm",
    concursos: ["PRF"],
    palavrasChave: [
      "sistema nacional de transito",
      "snt",
      "contran",
      "senatran",
      "denatran",
      "cetran",
      "contradife",
      "jari",
    ],
  },
  {
    id: "ctb-prf",
    rotulo: "CTB, art. 20",
    norma: "Lei nº 9.503/1997 — Código de Trânsito Brasileiro",
    artigo: "Art. 20",
    sobre:
      "Competência da Polícia Rodoviária Federal: patrulhamento ostensivo e fiscalização das rodovias federais.",
    url: "https://www.planalto.gov.br/ccivil_03/leis/l9503compilado.htm",
    concursos: ["PRF"],
    palavrasChave: [
      "prf",
      "policia rodoviaria federal",
      "rodovias federais",
      "art 20",
      "artigo 20",
      "competencia",
    ],
  },
  {
    id: "cp-lei-penal",
    rotulo: "CP, arts. 1º a 12",
    norma: "Decreto-Lei nº 2.848/1940 — Código Penal",
    artigo: "Arts. 1º a 12",
    sobre:
      "Aplicação da lei penal: legalidade, retroatividade benéfica, tempo do crime (atividade) e lugar do crime (ubiquidade).",
    url: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm",
    concursos: ["PF", "PRF", "PMDF"],
    palavrasChave: [
      "aplicacao da lei penal",
      "tempo do crime",
      "lugar do crime",
      "ubiquidade",
      "atividade",
      "irretroatividade",
      "abolitio criminis",
    ],
  },
  {
    id: "cpp-inquerito",
    rotulo: "CPP, arts. 4º a 23",
    norma: "Decreto-Lei nº 3.689/1941 — Código de Processo Penal",
    artigo: "Arts. 4º a 23",
    sobre:
      "Inquérito policial: instauração, prazos (10 dias preso + 10 prorrogáveis) e indiciamento.",
    url: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del3689compilado.htm",
    concursos: ["PF", "PRF", "PMDF"],
    palavrasChave: [
      "inquerito policial",
      "inquerito",
      "prazo inquerito",
      "indiciamento",
      "art 5 cpp",
      "art 10 cpp",
    ],
  },
  {
    id: "lei11343-art28",
    rotulo: "Lei 11.343/2006, art. 28",
    norma: "Lei nº 11.343/2006 — Lei de Drogas",
    artigo: "Art. 28",
    sobre:
      "Porte para consumo pessoal: penas não privativas de liberdade (advertência, serviços à comunidade, medida educativa).",
    url: "https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11343.htm",
    concursos: ["PF", "PRF", "PMDF"],
    palavrasChave: [
      "usuario de drogas",
      "consumo pessoal",
      "porte de droga",
      "art 28",
      "artigo 28",
      "lei de drogas",
    ],
  },
  {
    id: "lei11343-art33",
    rotulo: "Lei 11.343/2006, art. 33",
    norma: "Lei nº 11.343/2006 — Lei de Drogas",
    artigo: "Art. 33",
    sobre:
      "Tráfico de drogas: importar, exportar, adquirir, guardar, transportar, vender, oferecer etc. — reclusão.",
    url: "https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11343.htm",
    concursos: ["PF", "PRF", "PMDF"],
    palavrasChave: [
      "trafico de drogas",
      "trafico",
      "art 33",
      "artigo 33",
      "lei de drogas",
      "trafico privilegiado",
    ],
  },
  {
    id: "cpm-crimes",
    rotulo: "CPM (DL 1.001/1969)",
    norma: "Decreto-Lei nº 1.001/1969 — Código Penal Militar",
    sobre:
      "Crimes militares: definição, crimes em tempo de paz e critérios de competência (pessoal, local e funcional).",
    url: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del1001.htm",
    concursos: ["PMDF"],
    palavrasChave: [
      "direito penal militar",
      "crime militar",
      "codigo penal militar",
      "cpm",
      "tempo de paz",
      "militar da ativa",
    ],
  },
  {
    id: "lei14751",
    rotulo: "Lei 14.751/2023",
    norma: "Lei nº 14.751/2023 — Lei Orgânica Nacional das PMs e Bombeiros Militares",
    sobre:
      "Normas gerais das polícias militares e corpos de bombeiros militares dos estados, DF e Territórios.",
    url: "https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/l14751.htm",
    concursos: ["PMDF"],
    palavrasChave: [
      "lei organica nacional",
      "lei organica das policias militares",
      "14751",
      "hierarquia",
      "disciplina",
      "policia militar",
    ],
  },
  {
    id: "lei8112",
    rotulo: "Lei 8.112/1990",
    norma: "Lei nº 8.112/1990 — Regime Jurídico dos Servidores Públicos Civis da União",
    sobre:
      "Regime dos servidores federais: provimento, vacância, direitos, deveres, proibições e regime disciplinar.",
    url: "https://www.planalto.gov.br/ccivil_03/leis/l8112cons.htm",
    concursos: ["PF", "PRF"],
    palavrasChave: [
      "regime juridico unico",
      "servidor publico",
      "8112",
      "provimento",
      "vacancia",
      "processo disciplinar",
    ],
  },
  {
    id: "lea-crimes",
    rotulo: "Lei 10.826/2003",
    norma: "Lei nº 10.826/2003 — Estatuto do Desarmamento",
    artigo: "Arts. 12 a 21",
    sobre:
      "Posse, porte e comércio ilegal de arma de fogo; crimes do Estatuto do Desarmamento.",
    url: "https://www.planalto.gov.br/ccivil_03/leis/2003/l10.826.htm",
    concursos: ["PF", "PRF", "PMDF"],
    palavrasChave: [
      "estatuto do desarmamento",
      "arma de fogo",
      "posse de arma",
      "porte de arma",
      "desarmamento",
      "10826",
    ],
  },
  {
    id: "lei8072",
    rotulo: "Lei 8.072/1990",
    norma: "Lei nº 8.072/1990 — Crimes Hediondos",
    sobre:
      "Define crimes hediondos e equiparados; regime de cumprimento e vedações (progressão, graça, indulto).",
    url: "https://www.planalto.gov.br/ccivil_03/leis/l8072.htm",
    concursos: ["PF", "PRF", "PMDF"],
    palavrasChave: [
      "crimes hediondos",
      "hediondo",
      "8072",
      "progressao de regime",
      "insuscetivel de graca",
    ],
  },
  {
    id: "cp-admin",
    rotulo: "CP, arts. 312 a 337-A",
    norma: "Decreto-Lei nº 2.848/1940 — Código Penal",
    artigo: "Arts. 312 a 337-A",
    sobre:
      "Crimes praticados por funcionário público contra a Administração: peculato, concussão, corrupção passiva, prevaricação e corrupção ativa.",
    url: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm",
    concursos: ["PF", "PRF", "PMDF"],
    palavrasChave: [
      "peculato",
      "concussao",
      "corrupcao passiva",
      "corrupcao ativa",
      "prevaricacao",
      "crimes contra a administracao",
      "funcionario publico",
      "art 312",
      "art 317",
      "art 333",
    ],
  },
  {
    id: "abuso-autoridade",
    rotulo: "Lei 13.869/2019",
    norma: "Lei nº 13.869/2019 — Lei de Abuso de Autoridade",
    sobre:
      "Define os crimes de abuso de autoridade, sujeitos ativos (agente público) e as penas, além das condutas típicas mais cobradas.",
    url: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13869.htm",
    concursos: ["PF", "PRF", "PMDF"],
    palavrasChave: [
      "abuso de autoridade",
      "13869",
      "agente publico",
      "constrangimento ilegal",
      "desvio de finalidade",
      "abuso de poder",
    ],
  },
  {
    id: "tortura",
    rotulo: "Lei 9.455/1997",
    norma: "Lei nº 9.455/1997 — Lei de Tortura",
    sobre:
      "Tipifica o crime de tortura (prova, confissão, discriminação, castigo) e define responsabilidade e efeitos da condenação.",
    url: "https://www.planalto.gov.br/ccivil_03/leis/l9455.htm",
    concursos: ["PF", "PRF", "PMDF"],
    palavrasChave: [
      "tortura",
      "9455",
      "crime de tortura",
      "confissao",
      "castigo",
      "discriminacao",
    ],
  },
  {
    id: "lavagem",
    rotulo: "Lei 9.613/1998",
    norma: "Lei nº 9.613/1998 — Lavagem de Dinheiro",
    sobre:
      "Crime de lavagem de capitais (ocultação, dissimulação de bens) e o sistema de prevenção (COAF, comunicação de operações).",
    url: "https://www.planalto.gov.br/ccivil_03/leis/l9613.htm",
    concursos: ["PF", "PRF"],
    palavrasChave: [
      "lavagem de dinheiro",
      "lavagem de capitais",
      "9613",
      "coaf",
      "ocultacao de bens",
      "branqueamento",
    ],
  },
  {
    id: "org-criminosa",
    rotulo: "Lei 12.850/2013",
    norma: "Lei nº 12.850/2013 — Organizações Criminosas",
    sobre:
      "Define organização criminosa, crimes (promoção, constituição), colaboração premiada e meios de obtenção de prova.",
    url: "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/lei/l12850.htm",
    concursos: ["PF", "PRF", "PMDF"],
    palavrasChave: [
      "organizacao criminosa",
      "12850",
      "colaboracao premiada",
      "delação",
      "delacao premiada",
      "infiltracao",
    ],
  },
  {
    id: "improbidade",
    rotulo: "Lei 8.429/1992",
    norma: "Lei nº 8.429/1992 — Improbidade Administrativa",
    sobre:
      "Atos de improbidade (enriquecimento ilícito, dano ao erário, princípios), sanções e sujeitos ativos e passivos.",
    url: "https://www.planalto.gov.br/ccivil_03/leis/l8429.htm",
    concursos: ["PF", "PRF", "PMDF"],
    palavrasChave: [
      "improbidade administrativa",
      "8429",
      "enriquecimento ilicito",
      "dano ao erario",
      "atos de improbidade",
      "dolo especifico",
    ],
  },
  {
    id: "licitacoes",
    rotulo: "Lei 14.133/2021",
    norma: "Lei nº 14.133/2021 — Nova Lei de Licitações e Contratos",
    sobre:
      "Modalidades de licitação (pregão, concorrência, concurso, leilão, diálogo competitivo), princípios e crimes.",
    url: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm",
    concursos: ["PF", "PRF"],
    palavrasChave: [
      "lei de licitacoes",
      "14133",
      "pregao",
      "concorrencia",
      "contrato administrativo",
      "dialogo competitivo",
      "licitacao",
    ],
  },
  {
    id: "pacote-anticrime",
    rotulo: "Lei 13.964/2019",
    norma: "Lei nº 13.964/2019 — Pacote Anticrime",
    sobre:
      "Alterações no CPP/CP: acordo de não persecução penal, juiz das garantias, prisão preventiva e hedonidade.",
    url: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13964.htm",
    concursos: ["PF", "PRF", "PMDF"],
    palavrasChave: [
      "pacote anticrime",
      "13964",
      "acordo de nao persecucao penal",
      "anpp",
      "juiz das garantias",
      "prisao preventiva",
    ],
  },
  {
    id: "ctb-infracoes",
    rotulo: "CTB, arts. 161 a 255",
    norma: "Lei nº 9.503/1997 — Código de Trânsito Brasileiro",
    artigo: "Arts. 161 a 255",
    sobre:
      "Infrações de trânsito, penalidades (advertência, multa, suspensão, cassação) e medidas administrativas (retenção, remoção).",
    url: "https://www.planalto.gov.br/ccivil_03/leis/l9503compilado.htm",
    concursos: ["PRF"],
    palavrasChave: [
      "infracoes de transito",
      "penalidades",
      "multa",
      "suspensao do direito de dirigir",
      "cassacao",
      "medidas administrativas",
      "art 161",
      "art 255",
    ],
  },
  {
    id: "ctb-crimes",
    rotulo: "CTB, arts. 291 a 312",
    norma: "Lei nº 9.503/1997 — Código de Trânsito Brasileiro",
    artigo: "Arts. 291 a 312",
    sobre:
      "Crimes de trânsito: homicídio culposo na direção, lesão corporal culposa, omissão de socorro e embriaguez (art. 306).",
    url: "https://www.planalto.gov.br/ccivil_03/leis/l9503compilado.htm",
    concursos: ["PRF"],
    palavrasChave: [
      "crimes de transito",
      "homicidio culposo na direcao",
      "lesao corporal culposa",
      "omissao de socorro",
      "art 302",
      "art 303",
      "art 304",
    ],
  },
  {
    id: "lep",
    rotulo: "Lei 7.210/1984",
    norma: "Lei nº 7.210/1984 — Lei de Execução Penal (LEP)",
    sobre:
      "Execução penal: regimes, progressão, remição, direitos e deveres do preso e disciplina.",
    url: "https://www.planalto.gov.br/ccivil_03/leis/l7210.htm",
    concursos: ["PF", "PMDF"],
    palavrasChave: [
      "execucao penal",
      "lep",
      "7210",
      "progressao de regime",
      "remicao",
      "regime fechado",
      "regime semiaberto",
    ],
  },
  {
    id: "juizados",
    rotulo: "Lei 9.099/1995",
    norma: "Lei nº 9.099/1995 — Juizados Especiais Cíveis e Criminais",
    sobre:
      "Juizados especiais criminais: infrações de menor potencial ofensivo, composição civil e suspensão condicional do processo.",
    url: "https://www.planalto.gov.br/ccivil_03/leis/l9099.htm",
    concursos: ["PF", "PRF", "PMDF"],
    palavrasChave: [
      "juizados especiais",
      "9099",
      "menor potencial ofensivo",
      "suspensao condicional do processo",
      "transacao penal",
      "composicao civil",
    ],
  },
];

export type ResultadoBusca = FonteOficial & {
  /** Pontuação de relevância (maior = mais relevante). */
  score: number;
};

/**
 * Busca determinística no catálogo curado.
 * Pontua por match de palavra-chave (frase inteira vale mais) e por norma.
 * Sem rede, sem IA: instantâneo e previsível.
 */
export function buscarFontes(consulta: string, limite = 8): ResultadoBusca[] {
  const q = normalizar(consulta.trim());
  if (!q) return [];
  const termos = q.split(/\s+/).filter((t) => t.length >= 3);

  const resultados: ResultadoBusca[] = [];
  const alvoTermos = (s: string) => normalizar(s).split(/[^a-z0-9]+/).filter(Boolean);
  for (const fonte of FONTES_OFICIAIS) {
    let score = 0;
    const alvoPalavras = alvoTermos(
      `${fonte.norma} ${fonte.rotulo} ${fonte.sobre} ${fonte.concursos.join(" ")}`,
    );
    const alvoSet = new Set(alvoPalavras);
    for (const kw of fonte.palavrasChave) {
      const k = normalizar(kw);
      if (q.includes(k)) score += 5; // frase-chave inteira na consulta
      else if (k.split(/\s+/).some((kwWord) => kwWord.length >= 4 && termos.includes(kwWord)))
        score += 2;
    }
    for (const t of termos) {
      if (t.length >= 4 && alvoSet.has(t)) score += 1; // palavra inteira
    }
    if (score >= 2) resultados.push({ ...fonte, score });
  }

  return resultados.sort((a, b) => b.score - a.score).slice(0, limite);
}
