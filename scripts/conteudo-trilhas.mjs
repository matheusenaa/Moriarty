/**
 * Trilhas ADICIONAIS do catálogo (PCDF, PMDF Soldado/praças, Polícia Penal).
 *
 * Mesmas regras de integridade/direitos autorais do seed principal:
 * - Notas/resumos: AUTORIA PRÓPRIA (resumo original didático).
 * - Questões: AUTORAIS ("gerada para prática — NÃO é questão oficial").
 * - Legislação: citação literal com link oficial; nada de prova protegida.
 * - Status/edição: referência histórica/comum, sem afirmar vigência sem fonte.
 *
 * Consumido por scripts/seed-catalog.mjs (fonte única).
 */

import { SOURCES } from "./seed-catalog.mjs";

const CHECKED_AT_NOVAS = "2026-10-20";

/** Ficha constitucional compartilhada, igual à do seed principal. */
const constitutionalNote = {
  title: "Ficha — Constituição Federal de 1988: arts. 5º, 37 e 144",
  kind: "nota",
  category: "resumo_proprio",
  refLabel: "Constituição Federal de 1988",
  url: SOURCES.cf88.url,
  order: 90,
  body: [
    "Resumo de estudo dos dispositivos mais recorrentes em provas de carreiras policiais. O texto entre aspas é citação literal da redação oficial; o restante é explicação didática de autoria própria.",
    "",
    "Art. 5º — Direitos e garantias individuais. \"Todos são iguais perante a lei, sem distinção de qualquer natureza...\" Abrange a inviolabilidade da vida, liberdade, igualdade, segurança e propriedade. É cláusula pétrea (art. 60, § 4º). Ponto de prova: o caput é exemplificativo, não taxativo (art. 5º, § 2º).",
    "",
    "Art. 37 — Administração pública. Estabelece os princípios expressos: \"legalidade, impessoalidade, moralidade, publicidade e eficiência\". A eficiência foi incluída pela EC 19/1998. Costuma aparecer combinado com os princípios implícitos (razoabilidade, proporcionalidade, motivação) e com a Lei 8.429/1992 (improbidade).",
    "",
    "Art. 144 — Segurança pública. \"A segurança pública, dever do Estado, direito e responsabilidade de todos...\" Lista os órgãos responsáveis, entre eles a polícia federal, a polícia rodoviária federal e as polícias militares. Ponto de prova: segurança pública é dever do Estado, mas também direito e responsabilidade de todos.",
    "",
    "Checagem de aprendizagem: (1) Quais são os cinco princípios expressos do art. 37? (2) O art. 144 caput trata a segurança pública como direito de quem? (3) O art. 5º é cláusula pétrea?",
  ].join("\n"),
};

/** Helper compartilhado: questões autorais no formato de item. */
function questoes(prefix, list) {
  return list.map((item, i) => ({
    title: `Questão autoral ${prefix.toUpperCase()}-${String(i + 1).padStart(2, "0")}`,
    kind: "questao",
    category: "questao_autoral",
    order: 100 + i,
    originNote: "Autoral/gerada para prática — NÃO é questão oficial.",
    refLabel: "Treino autoral",
    body: item.q,
    options: item.options,
    correctIndex: item.correct,
    explanation: item.explanation,
  }));
}

export const TRILHAS_ADICIONAIS = [
  // ==================== PCDF — Agente / Investigador ====================
  {
    slug: "pcdf-agente",
    title: "PCDF — Agente / Investigador de Polícia Civil do DF",
    summary:
      "Trilha de preparação para os cargos de Agente e Investigador da Polícia Civil do Distrito Federal (PCDF).",
    status: "comum",
    statusNote:
      "Baseada em editais anteriores da PCDF (referência de preparação). Não há certame novo confirmado nesta trilha; confirme o edital vigente na página oficial antes de se inscrever.",
    source: {
      name: "Polícia Civil do Distrito Federal — concursos (portal oficial)",
      url: "https://www.pcdf.df.gov.br/",
    },
    editalRef: "Editais anteriores da PCDF (referência de preparação)",
    areas: [
      "Língua Portuguesa",
      "Raciocínio Lógico e Matemático",
      "Noções de Informática",
      "Direito Constitucional",
      "Direito Administrativo",
      "Direito Penal e Processual Penal",
      "Legislação Específica (PCDF / DF)",
    ],
    items: [
      {
        title: "Como estudar para a PCDF (Agente/Investigador)",
        kind: "nota",
        order: 1,
        category: "resumo_proprio",
        refLabel: "Orientação de estudo (conteúdo comum de preparação)",
        body:
          "A PCDF cobra um bloco jurídico forte (Constitucional, Administrativo, Penal, Processual Penal e legislação específica) somado a Português e Raciocínio Lógico.\n\nEstratégia sugerida: (1) comece pelo Direito Penal e Processual Penal, que dão base para a legislação específica; (2) trate o Código de Processo Penal como coluna vertebral (inquérito, prova, prisões); (3) revise a Constituição (arts. 5º, 37 e 144) em ciclos; (4) Português e RLM sustentam a nota de corte, então mantenha-as na rotina diária.\n\nMaterial autoral e introdutório; não substitui o edital oficial.",
      },
      {
        title: "Nota — Direito Penal: crimes contra a Administração",
        kind: "nota",
        order: 2,
        category: "resumo_proprio",
        refLabel: "Código Penal, arts. 312 a 337-A",
        url: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm",
        body:
          "Os crimes praticados por funcionário público contra a Administração são recorrentes na PCDF:\n\n- Peculato (art. 312): apropriar-se ou desviar bem em razão do cargo.\n- Concussão (art. 316): exigir vantagem indevida.\n- Corrupção passiva (art. 317): solicitar, receber ou aceitar promessa de vantagem.\n- Prevaricação (art. 319): deixar de praticar ato ou praticá-lo contra a lei para satisfazer interesse pessoal.\n- Corrupção ativa (art. 333): oferecer ou prometer vantagem a funcionário público.\n\nDistinção-chave: concussão é EXIGIR; corrupção passiva é SOLICITAR/receber; corrupção ativa é OFERECER.",
      },
      {
        title: "Nota — Processo Penal: prisões e medidas cautelares",
        kind: "nota",
        order: 3,
        category: "resumo_proprio",
        refLabel: "Código de Processo Penal, arts. 282 a 350",
        url: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del3689compilado.htm",
        body:
          "Principais espécies de prisão e cautelares:\n\n- Prisão em flagrante (arts. 301 a 310): qualquer do povo pode prender; a autoridade deve lavrar o auto.\n- Prisão preventiva (arts. 311 a 316): exige fumus comissi delicti e periculum libertatis; não tem prazo fixo, mas deve ser revista.\n- Prisão temporária (Lei 7.960/1989): cabível em casos específicos, com prazo determinado.\n- Medidas cautelares diversas (art. 319): comparecimento periódico, proibição de contato, monitoração eletrônica etc.\n\nPonto de prova: a prisão preventiva é medida excepcional; a regra é a liberdade.",
      },
      {
        title: "Nota — Lei de Abuso de Autoridade (Lei 13.869/2019)",
        kind: "nota",
        order: 4,
        category: "resumo_proprio",
        refLabel: "Lei nº 13.869/2019",
        url: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13869.htm",
        body:
          "A Lei 13.869/2019 define crimes de abuso de autoridade, praticáveis por agente público no exercício da função ou a pretexto dela.\n\nConceitos cobrados: sujeito ativo (agente público), sujeito passivo (pessoa física ou jurídica, ou o próprio Estado), e a exigência de finalidade específica em vários tipos.\n\nDivergência relevante: a caracterização quanto à \"finalidade específica\" de prejudicar/beneficiar foi bastante debatida — em prova, atenha-se ao texto legal citado.",
      },
      {
        title: "Flashcard — Concussão x corrupção passiva",
        kind: "flashcard",
        order: 20,
        category: "flashcard",
        refLabel: "Código Penal, arts. 316 e 317",
        url: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm",
        body: "Frente: Qual é a diferença entre concussão (art. 316) e corrupção passiva (art. 317) do Código Penal?\n\nVerso: Concussão é EXIGIR vantagem indevida; corrupção passiva é SOLICITAR, receber ou aceitar promessa de vantagem. Corrupção ativa (art. 333) é OFERECER ou prometer.",
      },
      {
        title: "Flashcard — Quem pode prender em flagrante",
        kind: "flashcard",
        order: 21,
        category: "flashcard",
        refLabel: "Código de Processo Penal, art. 301",
        url: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del3689compilado.htm",
        body: "Frente: No flagrante delito, quem pode efetuar a prisão?\n\nVerso: Qualquer do povo pode prender; a autoridade policial tem o dever de lavrar o auto de flagrante (art. 301 do CPP).",
      },
      {
        title: "Flashcard — Requisitos da prisão preventiva",
        kind: "flashcard",
        order: 22,
        category: "flashcard",
        refLabel: "Código de Processo Penal, art. 312",
        url: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del3689compilado.htm",
        body: "Frente: Quais são os requisitos legais da prisão preventiva?\n\nVerso: fumus comissi delicti (indício de autoria) e periculum libertatis (risco de fuga ou perturbação da ordem) — art. 312 do CPP. É medida excepcional; a regra é a liberdade.",
      },
      constitutionalNote,
      ...questoes("PCDF", [
        {
          q: "A exigência de vantagem indevida por funcionário público, em razão da função, caracteriza o crime de:",
          options: ["peculato.", "concussão.", "corrupção ativa.", "prevaricação.", "estelionato."],
          correct: 1,
          explanation: "Exigir vantagem indevida é concussão (art. 316 do CP). Solicitar/receber é corrupção passiva.",
        },
        {
          q: "A prisão em flagrante pode ser efetuada:",
          options: [
            "apenas por policial.",
            "apenas pelo Ministério Público.",
            "por qualquer do povo em caso de delito e por autoridade policial.",
            "somente com mandado judicial.",
            "apenas em crimes hediondos.",
          ],
          correct: 2,
          explanation: "No flagrante delito, qualquer do povo pode prender (art. 301 do CPP); a autoridade policial tem o dever.",
        },
        {
          q: "São características da prisão preventiva, como regra:",
          options: [
            "prazo fixo de 30 dias.",
            "medida excepcional, com requisitos de fumus comissi delicti e periculum libertatis.",
            "aplicável apenas a crimes hediondos.",
            "dispensa fundamentação.",
            "substitui automaticamente a flagrância.",
          ],
          correct: 1,
          explanation: "A preventiva é excepcional e exige os requisitos cautelares do CPP (arts. 311 e 312).",
        },
      ]),
    ],
  },

  // ==================== PMDF — Soldado (praças) ====================
  {
    slug: "pmdf-soldado",
    title: "PMDF — Soldado da Polícia Militar do DF (praças)",
    summary:
      "Trilha de preparação para o ingresso como Soldado (praça) da Polícia Militar do Distrito Federal.",
    status: "comum",
    statusNote:
      "Referência de preparação para soldados da PMDF, com base em editais anteriores e no conteúdo comum das carreiras militares. Confirme o edital vigente antes da prova.",
    source: SOURCES.pmdfCfo2025,
    editalRef: "Editais anteriores da PMDF (referência de preparação)",
    areas: [
      "Língua Portuguesa",
      "Raciocínio Lógico e Matemático",
      "Noções de Direito (Constitucional, Administrativo e Penal)",
      "História e Geografia do Distrito Federal",
      "Atualidades e Legislação Aplicada à PMDF",
    ],
    items: [
      {
        title: "Como estudar para Soldado da PMDF",
        kind: "nota",
        order: 1,
        category: "resumo_proprio",
        refLabel: "Orientação de estudo (conteúdo comum de preparação)",
        body:
          "A preparação de praça é mais direta que a de oficial, mas exige consistência: a nota objetiva costuma decidir a classificação.\n\nSugestão: (1) Português e RLM como base diária; (2) Noções de Direito (princípios do art. 37 e direitos do art. 5º) com foco no art. 144; (3) História e Geografia do DF com revisão espaçada; (4) treinar a redação/discussão de temas atuais.\n\nAlém das provas, há fases eliminatórias (aptidão física, saúde e investigação social). Material autoral e introdutório.",
      },
      {
        title: "Nota — Hierarquia e disciplina",
        kind: "nota",
        order: 2,
        category: "resumo_proprio",
        refLabel: "Conteúdo comum de preparação",
        body:
          "Hierarquia e disciplina são os pilares das instituições militares (CF/88, arts. 42 e 144, § 5º).\n\n- Hierarquia: escalonamento da autoridade (quem manda em quem).\n- Disciplina: obediência à ordem legal e às normas.\n\nPonto de prova: as questões cobram a definição conceitual e a base constitucional dos dois princípios.",
      },
      {
        title: "Nota — Direito Constitucional: art. 144 e as polícias",
        kind: "nota",
        order: 3,
        category: "resumo_proprio",
        refLabel: "Constituição Federal de 1988, art. 144",
        url: SOURCES.cf88.url,
        body:
          "O art. 144 lista os órgãos de segurança pública. As polícias militares (inciso V) e os corpos de bombeiros militares (inciso VI) são forças auxiliares e reserva do Exército.\n\nCompete à PM o policiamento ostensivo e a preservação da ordem pública (§ 5º).\n\nPonto de prova: segurança pública é dever do Estado, direito e responsabilidade de todos (caput).",
      },
      {
        title: "Nota — Legislação aplicada à PMDF: Lei 14.751/2023",
        kind: "nota",
        order: 4,
        category: "resumo_proprio",
        refLabel: "Lei nº 14.751/2023",
        url: "https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/l14751.htm",
        body:
          "A Lei 14.751/2023 fixa normas gerais para as polícias militares e corpos de bombeiros militares dos estados, DF e Territórios.\n\nReafirma princípios como hierarquia e disciplina e a competência da PM para policiamento ostensivo.\n\nErro comum: confundir esta norma geral nacional com os estatutos internos de cada corporação.",
      },
      {
        title: "Flashcard — Hierarquia x disciplina",
        kind: "flashcard",
        order: 20,
        category: "flashcard",
        refLabel: "Constituição Federal de 1988, arts. 42 e 144, § 5º",
        url: SOURCES.cf88.url,
        body: "Frente: Como se distinguem hierarquia e disciplina nas instituições militares?\n\nVerso: Hierarquia é o escalonamento da autoridade (quem manda em quem); disciplina é a obediência à ordem legal e às normas. Base: CF/88, art. 42 e art. 144, § 5º.",
      },
      {
        title: "Flashcard — Competência das polícias militares",
        kind: "flashcard",
        order: 21,
        category: "flashcard",
        refLabel: "Constituição Federal de 1988, art. 144, § 5º",
        url: SOURCES.cf88.url,
        body: "Frente: Qual é a atribuição constitucional das polícias militares?\n\nVerso: O policiamento ostensivo e a preservação da ordem pública (art. 144, § 5º, da CF/88).",
      },
      {
        title: "Flashcard — Segurança pública (caput do art. 144)",
        kind: "flashcard",
        order: 22,
        category: "flashcard",
        refLabel: "Constituição Federal de 1988, art. 144",
        url: SOURCES.cf88.url,
        body: "Frente: Como o art. 144 da CF/88 define a segurança pública?\n\nVerso: Dever do Estado, direito e responsabilidade de todos (caput do art. 144).",
      },
      constitutionalNote,
      ...questoes("PMDF-SD", [
        {
          q: "Na Polícia Militar, a hierarquia e a disciplina têm base constitucional, entre outros, no:",
          options: [
            "art. 5º (direitos individuais).",
            "art. 144, § 5º, combinado com o art. 42 (militares dos estados/DF).",
            "art. 170 (ordem econômica).",
            "art. 205 (educação).",
            "art. 231 (índios).",
          ],
          correct: 1,
          explanation: "A CF/88 trata das PMs no art. 144, § 5º, e do regime dos militares no art. 42, onde se assentam hierarquia e disciplina.",
        },
        {
          q: "Às polícias militares compete, constitucionalmente:",
          options: [
            "a polícia judiciária da União.",
            "o policiamento ostensivo e a preservação da ordem pública.",
            "a fiscalização de rodovias federais.",
            "a apuração de infrações contra a União.",
            "o julgamento de crimes militares.",
          ],
          correct: 1,
          explanation: "O policiamento ostensivo e a preservação da ordem pública são atribuições das PMs (art. 144, § 5º).",
        },
        {
          q: "Sobre a segurança pública (art. 144 da CF/88), é correto afirmar que ela é:",
          options: [
            "dever exclusivo da União.",
            "dever do Estado, direito e responsabilidade de todos.",
            "responsabilidade apenas das polícias.",
            "matéria de competência exclusiva dos municípios.",
            "facultativa aos entes federativos.",
          ],
          correct: 1,
          explanation: "O caput do art. 144 diz que a segurança pública é dever do Estado, direito e responsabilidade de todos.",
        },
      ]),
    ],
  },

  // ==================== Polícia Penal ====================
  {
    slug: "policia-penal",
    title: "Polícia Penal — Agente Penitenciário (referência de preparação)",
    summary:
      "Trilha de preparação para carreiras de Polícia Penal / Agente Penitenciário (federal, DF e estados).",
    status: "comum",
    statusNote:
      "Conteúdo comum de preparação para carreiras penais. Não há certame novo confirmado nesta trilha; confirme o edital vigente no portal oficial.",
    source: {
      name: "Polícia Penal — legislação de referência (Lei 7.210/1984 e lei de criação das polícias penais)",
      url: "https://www.planalto.gov.br/ccivil_03/leis/l7210.htm",
    },
    editalRef: "Editais anteriores de agentes penitenciários (referência de preparação)",
    areas: [
      "Língua Portuguesa",
      "Raciocínio Lógico",
      "Noções de Direito Constitucional e Administrativo",
      "Direito Penal e Processual Penal",
      "Legislação Especial e Execução Penal",
      "Direitos Humanos",
    ],
    items: [
      {
        title: "Como estudar para a Polícia Penal",
        kind: "nota",
        order: 1,
        category: "resumo_proprio",
        refLabel: "Orientação de estudo (conteúdo comum de preparação)",
        body:
          "A Polícia Penal combina direito (Penal, Processual Penal, Execução Penal e Direitos Humanos) com legislação especial.\n\nSugestão: (1) domine a Lei de Execução Penal (LEP) — progressão, regimes e remição; (2) estude Direitos Humanos (regras mínimas da ONU e CF/88); (3) não descuide de Português e RLM, que compõem a nota objetiva; (4) resolva questões de legislação especial em ciclos.\n\nMaterial autoral e introdutório; sempre confira o edital oficial.",
      },
      {
        title: "Nota — Execução Penal: regimes e progressão",
        kind: "nota",
        order: 2,
        category: "resumo_proprio",
        refLabel: "Lei nº 7.210/1984 (LEP)",
        url: "https://www.planalto.gov.br/ccivil_03/leis/l7210.htm",
        body:
          "Regimes de cumprimento e progressão:\n\n- Fechado, semiaberto e aberto (LEP, arts. 33 a 36 do CP combinados).\n- Progressão por requisitos objetivo (lapso temporal) e subjetivo (bom comportamento carcerário).\n- Remição: reduz a pena pelo trabalho ou estudo (LEP, art. 126).\n- Regime disciplinar diferenciado (RDD): hipóteses restritas (LEP, arts. 52 a 60).\n\nPonto de prova: progressão exige o requisito subjetivo do bom comportamento (a LEP foi alterada ao longo do tempo; confira o texto atual).",
      },
      {
        title: "Nota — Direitos Humanos: tratamento do preso",
        kind: "nota",
        order: 3,
        category: "resumo_proprio",
        refLabel: "Regras mínimas da ONU (Regras de Mandela) e CF/88",
        url: "https://www.ohchr.org/en/instruments-mechanisms/instruments/standard-minimum-rules-treatment-prisoners",
        body:
          "Direitos Humanos é disciplina frequente na Polícia Penal.\n\nReferências: as Regras Mínimas das Nações Unidas para o Tratamento de Prisioneiros (Regras de Mandela) e a Constituição (art. 5º, XLVIII, XLIX e LXXV).\n\nGarantias: respeito à integridade física e moral do preso; separação por sexo, idade e natureza do delito; direito a assistência material, à saúde, jurídica e educacional.\n\nPonto de prova: a CF assegura aos presos o respeito à integridade física e moral (art. 5º, XLIX).",
      },
      {
        title: "Nota — Direito Penal: crimes contra a pessoa e patrimônio",
        kind: "nota",
        order: 4,
        category: "resumo_proprio",
        refLabel: "Código Penal (parte especial)",
        url: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm",
        body:
          "Base penal cobrada na Polícia Penal:\n\n- Crimes contra a pessoa: homicídio (art. 121), lesão corporal (art. 129).\n- Crimes contra o patrimônio: furto (art. 155), roubo (art. 157), extorsão (art. 158).\n- Distinção furto x roubo: no roubo há violência ou grave ameaça à pessoa (art. 157, § 2º, traz causas de aumento).\n\nPonto de prova: a violência/grave ameaça é o que diferencia roubo de furto.",
      },
      {
        title: "Flashcard — Remição de pena",
        kind: "flashcard",
        order: 20,
        category: "flashcard",
        refLabel: "Lei nº 7.210/1984 (LEP), art. 126",
        url: "https://www.planalto.gov.br/ccivil_03/leis/l7210.htm",
        body: "Frente: Por meio de qual instituto a Lei de Execução Penal permite reduzir a pena?\n\nVerso: Remição pelo trabalho ou pelo estudo (LEP, art. 126).",
      },
      {
        title: "Flashcard — Regime disciplinar diferenciado (RDD)",
        kind: "flashcard",
        order: 21,
        category: "flashcard",
        refLabel: "Lei nº 7.210/1984 (LEP), arts. 52 a 60",
        url: "https://www.planalto.gov.br/ccivil_03/leis/l7210.htm",
        body: "Frente: O regime disciplinar diferenciado (RDD) é regra ou exceção na execução penal?\n\nVerso: Exceção, com hipóteses legais restritas e excepcionais previstas nos arts. 52 a 60 da LEP.",
      },
      {
        title: "Flashcard — Integridade do preso",
        kind: "flashcard",
        order: 22,
        category: "flashcard",
        refLabel: "Constituição Federal de 1988, art. 5º, XLIX",
        url: SOURCES.cf88.url,
        body: "Frente: Que garantia constitucional a CF/88 assegura aos presos?\n\nVerso: O respeito à sua integridade física e moral (art. 5º, XLIX, da CF/88).",
      },
      constitutionalNote,
      ...questoes("PP", [
        {
          q: "O regime disciplinar diferenciado (RDD) na Execução Penal:",
          options: [
            "aplica-se a qualquer preso, sem requisitos.",
            "tem hipóteses legais restritas e excepcionais.",
            "substitui a progressão de regime.",
            "foi extinto pela LEP.",
            "é cabível apenas para presos provisórios.",
          ],
          correct: 1,
          explanation: "O RDD é excepcional e tem hipóteses restritas previstas na LEP (arts. 52 a 60).",
        },
        {
          q: "A remição de pena na LEP está ligada:",
          options: [
            "ao pagamento de fiança.",
            "ao trabalho ou estudo do condenado.",
            "à confissão espontânea apenas.",
            "ao tempo de prisão provisória apenas.",
            "à idade do condenado apenas.",
          ],
          correct: 1,
          explanation: "A remição reduz a pena pelo trabalho ou pelo estudo (LEP, art. 126).",
        },
        {
          q: "Sobre o tratamento do preso, a CF/88 garante:",
          options: [
            "trabalho obrigatório independentemente da pena.",
            "respeito à integridade física e moral (art. 5º, XLIX).",
            "isolamento permanente como regra.",
            "ausência de qualquer assistência.",
            "pena de caráter perpétuo.",
          ],
          correct: 1,
          explanation: "O art. 5º, XLIX, assegura aos presos o respeito à integridade física e moral.",
        },
      ]),
    ],
  },
];

export { CHECKED_AT_NOVAS };
