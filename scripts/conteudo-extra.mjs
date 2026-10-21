/**
 * Conteúdo de estudo EXPANDIDO por concurso (PMDF CFO, PF Agente, PRF).
 *
 * Regras de integridade/direitos autorais (mantidas do seed principal):
 * - Notas/resumos e flashcards: AUTORIA PRÓPRIA (resumo original didático).
 * - Questões: AUTORAIS ("gerada para prática — NÃO é questão oficial").
 * - Trechos de lei: citação literal, identificados por artigo, com link oficial.
 * - Links: páginas oficiais (Planalto, Cebraspe, gov.br) conferidas.
 * - Cronogramas: apenas SUGESTÕES de estudo (não são cronogramas oficiais).
 *
 * Este módulo é consumido por scripts/seed-catalog.mjs (fonte única).
 */

import { CHECKED_AT, SOURCES } from "./seed-catalog.mjs";

/** Leis e fontes oficiais usadas com frequência nas carreiras policiais. */
export const FONTES_OFICIAIS = {
  ctb: {
    name: "Lei nº 9.503/1997 — Código de Trânsito Brasileiro (texto oficial)",
    url: "https://www.planalto.gov.br/ccivil_03/leis/l9503compilado.htm",
  },
  cp: {
    name: "Decreto-Lei nº 2.848/1940 — Código Penal (texto oficial)",
    url: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm",
  },
  cpp: {
    name: "Decreto-Lei nº 3.689/1941 — Código de Processo Penal (texto oficial)",
    url: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del3689compilado.htm",
  },
  cpm: {
    name: "Decreto-Lei nº 1.001/1969 — Código Penal Militar (texto oficial)",
    url: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del1001.htm",
  },
  cppm: {
    name: "Decreto-Lei nº 1.002/1969 — Código de Processo Penal Militar (texto oficial)",
    url: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del1002.htm",
  },
  dh: {
    name: "Declaração Universal dos Direitos Humanos (UNIC Rio)",
    url: "https://www.ohchr.org/en/human-rights/universal-declaration/translations/portuguese",
  },
  lei8112: {
    name: "Lei nº 8.112/1990 — Regime Jurídico dos Servidores Públicos Civis da União",
    url: "https://www.planalto.gov.br/ccivil_03/leis/l8112cons.htm",
  },
  lei14751: {
    name: "Lei nº 14.751/2023 — Lei Orgânica Nacional das Polícias Militares e Bombeiros Militares",
    url: "https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/l14751.htm",
  },
  lei8089: {
    name: "Lei nº 8.089/1990 (antiga Lei dos Crimes Hediondos, revogada pela Lei 13.964/2019 no ponto)",
    url: "https://www.planalto.gov.br/ccivil_03/leis/l8072.htm",
  },
  lei8072: {
    name: "Lei nº 8.072/1990 — Crimes Hediondos",
    url: "https://www.planalto.gov.br/ccivil_03/leis/l8072.htm",
  },
  lei10826: {
    name: "Lei nº 10.826/2003 — Estatuto do Desarmamento",
    url: "https://www.planalto.gov.br/ccivil_03/leis/2003/l10.826.htm",
  },
  lei11343: {
    name: "Lei nº 11.343/2006 — Lei de Drogas",
    url: "https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11343.htm",
  },
  cf88: SOURCES.cf88,
};

/** Cabeçalho comum de avisos de integridade reutilizado nas notas. */
const AVISO_AUTORAL =
  "Material autoral de resumo; não é cópia de apostila ou prova oficial. Onde há lei citada, o texto está entre aspas com o artigo e o link oficial.";

/**
 * Links e fontes oficiais por concurso (itens kind=nota? Não: viram kind=nota
 * com category=fonte_externa é aceito? O schema não renderiza kind=fonte ainda,
 * então modelamos como nota de referência com refLabel "Fonte oficial").
 */
function itemFonte(titulo, url, descricao, order) {
  return {
    title: `Fontes oficiais — ${titulo}`,
    kind: "nota",
    order,
    category: "resumo_proprio",
    refLabel: "Fonte oficial",
    url,
    body: [
      descricao,
      "",
      `Link oficial: ${url}`,
      "",
      AVISO_AUTORAL,
    ].join("\n"),
  };
}

// =====================================================================
// PMDF CFO — expansão
// =====================================================================
export function extrasPmdf() {
  return [
    itemFonte(
      "PMDF CFO 2025",
      SOURCES.pmdfCfo2025.url,
      "Página oficial do concurso CFO/PMDF 2025 no Cebraspe (edital nº 03/2025 – DGP/PMDF e retificações).",
      80,
    ),
    {
      title: "Nota — Lei Orgânica Nacional das PMs (Lei nº 14.751/2023)",
      kind: "nota",
      order: 6,
      category: "resumo_proprio",
      refLabel: "Lei nº 14.751/2023",
      url: FONTES_OFICIAIS.lei14751.url,
      body: [
        "A Lei nº 14.751/2023 estabelece normas gerais para as polícias militares e os corpos de bombeiros militares dos estados, do Distrito Federal e dos Territórios.",
        "",
        "Pontos de prova recorrentes:",
        "- Define princípios institucionais (hierarquia, disciplina, subordinação ao governador).",
        "- Disciplina a estrutura básica das corporações e as carreiras.",
        "- Reafirma a competência da PM para policiamento ostensivo e preservação da ordem pública (CF/88, art. 144, § 5º).",
        "",
        "Erro comum: confundir esta lei (norma geral nacional) com os estatutos/regulamentos internos de cada corporação.",
      ].join("\n"),
    },
    {
      title: "Nota — Direito Penal Militar: crimes militares em tempo de paz",
      kind: "nota",
      order: 7,
      category: "resumo_proprio",
      refLabel: "Código Penal Militar (Decreto-Lei nº 1.001/1969)",
      url: FONTES_OFICIAIS.cpm.url,
      body: [
        "O CPM tipifica os crimes militares. Em tempo de paz, considera-se crime militar, entre outros, o praticado por militar da ativa contra militar na mesma situação, ou em local sujeito à administração militar.",
        "",
        "Conceitos-chave:",
        "- Militar da ativa (na PMDF, o policial militar em serviço ativo).",
        "- Crime propriamente militar x crime impropriamente militar (este também tem previsão comum, mas atinge bem jurídico militar).",
        "- A aplicação do CPM exige análise do sujeito, do local e da função.",
        "",
        "Ponto de prova: nem todo crime praticado por policial militar será militar; depende dos critérios legais (ratione personae, loci e materiae).",
      ].join("\n"),
    },
    {
      title: "Nota — Hierarquia e disciplina na PM",
      kind: "nota",
      order: 8,
      category: "resumo_proprio",
      refLabel: "Conteúdo comum de preparação",
      body: [
        "Hierarquia e disciplina são os pilares das instituições militares (CF/88, art. 42 e art. 144, § 5º).",
        "",
        "- Hierarquia: escalonamento da autoridade (quem manda em quem), expressa em círculos e postos/graduações.",
        "- Disciplina: obediência e respeito às normas e à ordem legal, base do funcionamento da corporação.",
        "",
        "Em prova: as questões cobram a definição conceitual e a distinção entre os dois princípios, além de sua base constitucional.",
      ].join("\n"),
    },
    {
      title: "Flashcard — CFO PMDF: qual lei nacional rege as PMs?",
      kind: "flashcard",
      order: 25,
      category: "flashcard",
      refLabel: "Lei nº 14.751/2023",
      url: FONTES_OFICIAIS.lei14751.url,
      body: "Frente: Qual lei estabelece as normas gerais das polícias militares e corpos de bombeiros militares?\n\nVerso: Lei nº 14.751/2023 (Lei Orgânica Nacional das PMs e CBM).",
    },
    {
      title: "Flashcard — Hierarquia x disciplina",
      kind: "flashcard",
      order: 26,
      category: "flashcard",
      refLabel: "Conteúdo comum de preparação",
      body: "Frente: Qual a diferença entre hierarquia e disciplina nas instituições militares?\n\nVerso: Hierarquia é o escalonamento da autoridade (quem comanda); disciplina é a obediência à ordem legal e às normas.",
    },
    {
      title: "Flashcard — Segurança pública é dever de quem? (art. 144)",
      kind: "flashcard",
      order: 27,
      category: "flashcard",
      refLabel: "Constituição Federal de 1988, art. 144",
      url: SOURCES.cf88.url,
      body: "Frente: O que diz o caput do art. 144 da CF/88 sobre a segurança pública?\n\nVerso: É dever do Estado, direito e responsabilidade de todos, exercida para preservação da ordem pública e incolumidade das pessoas e do patrimônio.",
    },
    {
      title: "Cronograma sugerido — PMDF CFO (12 semanas)",
      kind: "nota",
      order: 81,
      category: "resumo_proprio",
      refLabel: "Sugestão de estudo (não oficial)",
      body: [
        "Sugestão de distribuição semanal (ajuste à sua rotina). Não é cronograma oficial.",
        "",
        "- Semanas 1–3: Língua Portuguesa + Raciocínio Lógico (base todos os dias) e Noções de Direito Constitucional.",
        "- Semanas 4–6: Direito Administrativo e Direito Penal/Processual Penal; começar redação semanal.",
        "- Semanas 7–9: Direito Penal Militar + Lei 14.751/2023 + História/Geografia do DF.",
        "- Semanas 10–11: Atualidades e Legislação Aplicada à PMDF; revisão espaçada intensa.",
        "- Semana 12: simulados cronometrados + revisão dos pontos fracos.",
        "",
        "Regra de ouro: 60% questões, 40% teoria; revisar toda matéria em ciclos de 7 dias.",
      ].join("\n"),
    },
    ...questoesExtras("PMDF", [
      {
        q: "A hierarquia e a disciplina, na Polícia Militar, decorrem principalmente de qual fundamento constitucional?",
        options: [
          "Art. 5º, que trata dos direitos individuais.",
          "Art. 37, que trata dos princípios da administração.",
          "Art. 144, § 5º, combinado com o art. 42, que tratam das polícias militares.",
          "Art. 170, que trata da ordem econômica.",
          "Art. 205, que trata da educação.",
        ],
        correct: 2,
        explanation:
          "A CF/88 trata das polícias militares no art. 144, § 5º, e do regime dos militares dos estados/DF no art. 42, onde se assentam hierarquia e disciplina.",
      },
      {
        q: "Sobre a Lei nº 14.751/2023 (Lei Orgânica Nacional das PMs), é correto afirmar que:",
        options: [
          "Revogou a competência das polícias militares para policiamento ostensivo.",
          "Estabelece normas gerais aplicáveis às polícias militares dos estados, DF e Territórios.",
          "Substitui a Constituição Federal na definição da segurança pública.",
          "Aplica-se apenas à Polícia Federal.",
          "Extinguiu a hierarquia nas corporações militares.",
        ],
        correct: 1,
        explanation:
          "A lei fixa normas gerais para as PMs e CBM dos estados, DF e Territórios, sem afastar a competência constitucional de policiamento ostensivo.",
      },
      {
        q: "Quanto aos crimes militares em tempo de paz, a definição depende, entre outros critérios, de:",
        options: [
          "Exclusivamente do valor da pena.",
          "Da condição de militar e do local/função (critérios pessoal, local e funcional).",
          "Apenas do clamor público.",
          "Da nacionalidade do autor.",
          "Do horário em que o fato ocorreu.",
        ],
        correct: 1,
        explanation:
          "A competência da justiça militar em tempo de paz analisa o sujeito (militar), o local e a função militar envolvida.",
      },
    ]),
  ];
}

// =====================================================================
// PF Agente — expansão
// =====================================================================
export function extrasPf() {
  return [
    itemFonte(
      "PF Agente 2025",
      SOURCES.pf2025.url,
      "Página oficial dos editais da carreira policial da Polícia Federal (2025) e edital nº 1 – PF – Policial, de 20/05/2025.",
      80,
    ),
    {
      title: "Nota — Polícia Federal: competências constitucionais (art. 144, § 1º)",
      kind: "nota",
      order: 6,
      category: "resumo_proprio",
      refLabel: "Constituição Federal de 1988, art. 144, § 1º",
      url: SOURCES.cf88.url,
      body: [
        "O art. 144, § 1º, lista as funções da Polícia Federal (caráter de polícia judiciária da União):",
        "",
        "- Apurar infrações penais contra a ordem política e social ou em detrimento de bens, serviços e interesses da União;",
        "- Prevenir e reprimir o tráfico de drogas, o contrabando e o descaminho, sem excluir a ação fazendária;",
        "- Exercer as funções de polícia marítima, aeroportuária e de fronteiras;",
        "- Exercer com exclusividade a polícia judiciária da União.",
        "",
        "Ponto de prova: as competências são do rol constitucional; prevalece o critério da matéria/do interesse.",
      ].join("\n"),
    },
    {
      title: "Nota — Inquérito policial: características e prazos (PF)",
      kind: "nota",
      order: 7,
      category: "resumo_proprio",
      refLabel: "Código de Processo Penal, arts. 4º a 23",
      url: FONTES_OFICIAIS.cpp.url,
      body: [
        "O inquérito policial é procedimento administrativo, inquisitivo, escrito e sigiloso, destinado a colher elementos de informação para a ação penal.",
        "",
        "- Instauração: de ofício, por portaria, a requerimento ou por requisição do Ministério Público/juiz.",
        "- Prazos (preso): 10 dias, prorrogáveis por igual período (regra do CPP, art. 10).",
        "- Prazos (solto): prazo específico conforme a norma aplicável.",
        "- Indiciamento: ato que aponta suspeito; não vincula o MP.",
        "",
        "Ponto de prova: o inquérito não comporta contraditório pleno e não tem valor condenatório isolado.",
      ].join("\n"),
    },
    {
      title: "Nota — Lei de Drogas: distinção usuário x traficante (art. 28 x art. 33)",
      kind: "nota",
      order: 8,
      category: "resumo_proprio",
      refLabel: "Lei nº 11.343/2006, arts. 28 e 33",
      url: FONTES_OFICIAIS.lei11343.url,
      body: [
        "A Lei nº 11.343/2006 distingue o porte para consumo pessoal (art. 28) do tráfico (art. 33).",
        "",
        "- Art. 28: condutas de adquirir/guardar/ter em depósito para consumo; penas não privativas de liberdade (advertência, serviços à comunidade, medida educativa).",
        "- Art. 33: importar, exportar, adquirir, guardar, transportar, vender, oferecer etc. — reclusão.",
        "- A dosimetria considera quantidade, natureza e condição do agente (art. 28, § 2º, e art. 33, § 4º, para tráfico privilegiado).",
        "",
        "Erro comum: achar que todo porte é tráfico; a lei exige análise do conjunto (destinação).",
      ].join("\n"),
    },
    {
      title: "Flashcard — Competência da PF: art. 144, § 1º",
      kind: "flashcard",
      order: 25,
      category: "flashcard",
      refLabel: "Constituição Federal de 1988",
      url: SOURCES.cf88.url,
      body: "Frente: Qual é o papel constitucional da Polícia Federal (art. 144, § 1º)?\n\nVerso: É a polícia judiciária da União, com funções de apurar crimes de interesse da União, combater tráfico/contrabando/descaminho e atuar em polícia marítima, aeroportuária e de fronteiras.",
    },
    {
      title: "Flashcard — Prazo do inquérito com preso (regra geral)",
      kind: "flashcard",
      order: 26,
      category: "flashcard",
      refLabel: "Código de Processo Penal, art. 10",
      url: FONTES_OFICIAIS.cpp.url,
      body: "Frente: Qual o prazo, como regra geral, para conclusão do inquérito policial quando o investigado está preso?\n\nVerso: 10 dias, prorrogáveis por igual período (regra geral do CPP).",
    },
    {
      title: "Flashcard — Usuário x traficante (Lei 11.343/2006)",
      kind: "flashcard",
      order: 27,
      category: "flashcard",
      refLabel: "Lei nº 11.343/2006",
      url: FONTES_OFICIAIS.lei11343.url,
      body: "Frente: O que diferencia o porte para consumo (art. 28) do tráfico (art. 33) na Lei de Drogas?\n\nVerso: A destinação da droga e as circunstâncias (quantidade, local, conduta). O consumo tem penas não privativas; o tráfico, reclusão.",
    },
    {
      title: "Cronograma sugerido — PF Agente (16 semanas)",
      kind: "nota",
      order: 81,
      category: "resumo_proprio",
      refLabel: "Sugestão de estudo (não oficial)",
      body: [
        "Sugestão de distribuição semanal (ajuste à sua rotina). Não é cronograma oficial.",
        "",
        "- Semanas 1–4: Português + Raciocínio Lógico + Noções de Informática (base diária).",
        "- Semanas 5–7: Direito Constitucional e Direito Administrativo.",
        "- Semanas 8–11: Direito Penal e Processual Penal (peso alto na PF).",
        "- Semanas 12–13: Legislação Especial e Direitos Humanos.",
        "- Semanas 14–16: Contabilidade/Estatística/Administração conforme cargo + revisão e simulados cronometrados (Certo/Errado).",
        "",
        "Treine o formato Cebraspe Certo/Errado: um erro anula um acerto, então precisão > chute.",
      ].join("\n"),
    },
    ...questoesExtras("PF", [
      {
        q: "Entre as competências constitucionais da Polícia Federal (art. 144, § 1º), encontram-se:",
        options: [
          "O policiamento ostensivo das rodovias federais.",
          "A apuração de infrações penais contra bens, serviços e interesses da União.",
          "O julgamento de crimes de competência da Justiça Federal.",
          "A defesa do patrimônio ecológico estadual.",
          "O comando das polícias militares.",
        ],
        correct: 1,
        explanation:
          "Cabe à PF apurar infrações penais em detrimento de bens, serviços e interesses da União, além das demais funções do § 1º.",
      },
      {
        q: "O inquérito policial, como regra, é:",
        options: [
          "Procedimento judicial com contraditório pleno.",
          "Procedimento administrativo, inquisitivo, escrito e sigiloso.",
          "Peça de acusação elaborada pelo Ministério Público.",
          "Sentença condenatória antecipada.",
          "Meio de prova exclusivo para condenação.",
        ],
        correct: 1,
        explanation:
          "O inquérito é procedimento administrativo, inquisitivo, escrito e sigiloso, destinado a colher elementos de informação, sem contraditório pleno.",
      },
      {
        q: "Sobre a Lei de Drogas (Lei nº 11.343/2006), assinale a correta.",
        options: [
          "Todo porte de droga é automaticamente tráfico.",
          "O art. 28 trata do porte para consumo pessoal, com penas não privativas de liberdade.",
          "O tráfico (art. 33) é infração de menor potencial ofensivo.",
          "A lei não distingue usuário e traficante.",
          "A quantidade de droga é irrelevante em qualquer análise.",
        ],
        correct: 1,
        explanation:
          "O art. 28 trata o porte para consumo com penas não privativas; o art. 33 cuida do tráfico, com reclusão. A quantidade é relevante na dosimetria.",
      },
    ]),
  ];
}

// =====================================================================
// PRF — expansão
// =====================================================================
export function extrasPrf() {
  return [
    itemFonte(
      "PRF 2021",
      SOURCES.prf2021.url,
      "Página oficial do concurso PRF 2021 (Edital Concurso PRF nº 1, de 18/01/2021, Cebraspe).",
      80,
    ),
    {
      title: "Nota — Código de Trânsito Brasileiro: estrutura e princípios",
      kind: "nota",
      order: 6,
      category: "resumo_proprio",
      refLabel: "Lei nº 9.503/1997 (CTB)",
      url: FONTES_OFICIAIS.ctb.url,
      body: [
        "O CTB (Lei nº 9.503/1997) é a norma central de Legislação de Trânsito na PRF (maior peso na prova).",
        "",
        "Estrutura e temas mais cobrados:",
        "- Sistema Nacional de Trânsito (SNT) e suas competências (CONTRAN, SENATRAN, CETRAN, CONTRADIFE, JARI).",
        "- Normas gerais de circulação e conduta.",
        "- Habilitação e veículos.",
        "- Infrações, penalidades e medidas administrativas (arts. 161 a 255).",
        "- Crimes de trânsito (arts. 291 a 312).",
        "",
        "Ponto de prova: distinguir infração administrativa de crime de trânsito; a embriaguez (art. 165 x art. 306) é clássica.",
      ].join("\n"),
    },
    {
      title: "Nota — Crimes de trânsito: art. 306 (embriaguez) x art. 165 (infração)",
      kind: "nota",
      order: 7,
      category: "resumo_proprio",
      refLabel: "CTB, arts. 165 e 306",
      url: FONTES_OFICIAIS.ctb.url,
      body: [
        "A embriaguez ao volante tem tratamento administrativo (art. 165) e penal (art. 306).",
        "",
        "- Art. 165: infração administrativa gravíssima (multa e suspensão do direito de dirigir).",
        "- Art. 306: crime — conduzir sob influência de álcool ou substância psicoativa com capacidade psicomotora alterada (detenção, multa e suspensão).",
        "- A caracterização do art. 306 admite prova por etilômetro, exame de sangue ou, na falta, sinais notórios (vídeo, testemunhas, constatação).",
        "",
        "Erro comum: confundir a infração administrativa (art. 165) com o crime (art. 306); ambos podem coexistir.",
      ].join("\n"),
    },
    {
      title: "Nota — Organização do Sistema Nacional de Trânsito (SNT)",
      kind: "nota",
      order: 8,
      category: "resumo_proprio",
      refLabel: "CTB, arts. 5º a 25",
      url: FONTES_OFICIAIS.ctb.url,
      body: [
        "O SNT integra órgãos e entidades da União, estados, DF e municípios para gestão e fiscalização do trânsito.",
        "",
        "Principais órgãos:",
        "- CONTRAN: órgão normativo, consultivo e coordenador máximo.",
        "- SENATRAN (antigo DENATRAN): órgão executivo máximo.",
        "- CETRAN / CONTRADIFE: órgãos normativos, consultivos e fiscalizadores nos estados/DF.",
        "- JARI: julga recursos de infrações.",
        "- PRF: patrulhamento e fiscalização nas rodovias federais (competência do art. 20).",
        "",
        "Ponto de prova: a competência fiscalizatória da PRF é nas rodovias federais, com atuação prevista em lei.",
      ].join("\n"),
    },
    {
      title: "Nota — Direito Penal (base PRF): aplicação da lei penal",
      kind: "nota",
      order: 9,
      category: "resumo_proprio",
      refLabel: "Código Penal, arts. 1º a 12",
      url: FONTES_OFICIAIS.cp.url,
      body: [
        "O Direito Penal integra o bloco II da PRF (peso relevante). Base inicial:",
        "",
        "- Princípio da legalidade (art. 1º): não há crime sem lei anterior que o defina.",
        "- Lei penal no tempo: regra da irretroatividade; retroatividade apenas benéfica (art. 2º).",
        "- Tempo do crime (art. 4º): teoria da atividade (momento da conduta).",
        "- Lugar do crime (art. 6º): teoria da ubiquidade (ação ou resultado).",
        "- Territorialidade (art. 5º) e extraterritorialidade (art. 7º).",
        "",
        "Ponto de prova: decorar as teorias do tempo (atividade) e do lugar (ubiquidade) do crime.",
      ].join("\n"),
    },
    {
      title: "Flashcard — Competência fiscalizatória da PRF",
      kind: "flashcard",
      order: 25,
      category: "flashcard",
      refLabel: "CTB, art. 20",
      url: FONTES_OFICIAIS.ctb.url,
      body: "Frente: Qual é a competência da PRF no âmbito do SNT?\n\nVerso: Patrulhamento ostensivo e fiscalização do trânsito nas rodovias federais (art. 20 do CTB).",
    },
    {
      title: "Flashcard — Tempo e lugar do crime",
      kind: "flashcard",
      order: 26,
      category: "flashcard",
      refLabel: "Código Penal, arts. 4º e 6º",
      url: FONTES_OFICIAIS.cp.url,
      body: "Frente: Quais teorias definem o tempo e o lugar do crime no CP?\n\nVerso: Tempo do crime = teoria da atividade (art. 4º); lugar do crime = teoria da ubiquidade (art. 6º).",
    },
    {
      title: "Flashcard — Embriaguez: art. 165 x art. 306 do CTB",
      kind: "flashcard",
      order: 27,
      category: "flashcard",
      refLabel: "CTB, arts. 165 e 306",
      url: FONTES_OFICIAIS.ctb.url,
      body: "Frente: Qual a diferença entre o art. 165 e o art. 306 do CTB quanto à embriaguez ao volante?\n\nVerso: Art. 165 = infração administrativa (gravíssima); art. 306 = crime de conduzir sob influência de álcool/substância psicoativa com capacidade psicomotora alterada.",
    },
    {
      title: "Cronograma sugerido — PRF (14 semanas)",
      kind: "nota",
      order: 81,
      category: "resumo_proprio",
      refLabel: "Sugestão de estudo (não oficial)",
      body: [
        "Sugestão de distribuição semanal (ajuste à sua rotina). Não é cronograma oficial.",
        "",
        "- Semanas 1–3: Língua Portuguesa + Raciocínio Lógico + Informática.",
        "- Semanas 4–6: Legislação de Trânsito (CTB + Resoluções CONTRAN) — maior peso (25%).",
        "- Semanas 7–9: Direito Penal + Processual Penal + Direito Administrativo/Constitucional.",
        "- Semanas 10–11: Legislação Especial + Direitos Humanos + Ética e Cidadania.",
        "- Semanas 12–13: Física + Geopolítica + Língua Estrangeira.",
        "- Semana 14: revisão geral e simulados no formato Certo/Errado.",
        "",
        "Peso da prova (referência edital 2021): Legislação de Trânsito 30 questões (25%), Língua Portuguesa 18 (15%).",
      ].join("\n"),
    },
    ...questoesExtras("PRF", [
      {
        q: "A competência da Polícia Rodoviária Federal, no âmbito do Sistema Nacional de Trânsito, é:",
        options: [
          "Fiscalizar o trânsito em todas as vias urbanas.",
          "Patrulhar e fiscalizar as rodovias federais.",
          "Julgar recursos de infrações de trânsito.",
          "Editar normas gerais de trânsito.",
          "Gerenciar a habilitação de condutores.",
        ],
        correct: 1,
        explanation:
          "A PRF exerce patrulhamento ostensivo e fiscalização nas rodovias federais (art. 20 do CTB). Julgar recursos é da JARI; normatizar é do CONTRAN.",
      },
      {
        q: "Sobre o crime de embriaguez ao volante (art. 306 do CTB), é correto afirmar que:",
        options: [
          "É apenas infração administrativa.",
          "Exige sempre valor exato de dosagem alcoólica no etilômetro.",
          "Configura crime conduzir sob influência de álcool com capacidade psicomotora alterada.",
          "Só se aplica a motoristas profissionais.",
          "Foi revogado pela Lei nº 14.071/2020.",
        ],
        correct: 2,
        explanation:
          "O art. 306 é crime e a alteração da capacidade psicomotora pode ser demonstrada por etilômetro, exame ou sinais notórios.",
      },
      {
        q: "Quanto ao tempo e ao lugar do crime, o Código Penal adota, respectivamente:",
        options: [
          "Teoria do resultado e teoria da atividade.",
          "Teoria da atividade e teoria da ubiquidade.",
          "Teoria da ubiquidade e teoria do resultado.",
          "Teoria mista e teoria da atividade.",
          "Teoria da atividade e teoria do resultado.",
        ],
        correct: 1,
        explanation:
          "O CP adota a teoria da atividade para o tempo do crime (art. 4º) e a ubiquidade para o lugar (art. 6º).",
      },
    ]),
  ];
}

/** Helper compartilhado: transforma questões autorais no formato de item. */
export function questoesExtras(prefix, list) {
  return list.map((item, i) => ({
    title: `Questão autoral ${prefix}-EXTRA-${String(i + 1).padStart(2, "0")}`,
    kind: "questao",
    category: "questao_autoral",
    order: 200 + i,
    originNote: "Autoral/gerada para prática — NÃO é questão oficial.",
    refLabel: "Treino autoral",
    body: item.q,
    options: item.options,
    correctIndex: item.correct,
    explanation: item.explanation,
  }));
}

/** Mapa slug → função de extras, para o seed principal consumir. */
export const EXTRAS_POR_SLUG = {
  "pmdf-cfo": extrasPmdf,
  "pf-policial-2025": extrasPf,
  "prf-policial": extrasPrf,
};

export { CHECKED_AT };
