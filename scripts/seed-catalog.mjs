/**
 * Conteúdo inicial do Moriarty — preparação PMDF, Polícia Federal e PRF.
 *
 * IMPORTANTE (integridade/direitos autorais):
 * - Notas e flashcards são de AUTORIA PRÓPRIA (resumo original), não cópia de
 *   apostilas/cursos/licenças de terceiros.
 * - Questões são AUTORAIS ("gerada para prática, não oficial"): o enunciado e as
 *   alternativas foram escritos para este projeto. NÃO são questões de prova
 *   oficial. Nenhuma prova protegida é reproduzida.
 * - Trechos de legislação (CF/88) são citação literal e identificados por artigo.
 * - Fontes/links apontam para páginas oficiais; status e data de verificação
 *   estão registrados em cada coleção. Nada é apresentado como "vigente" sem
 *   fonte confirmada.
 *
 * Estes dados são a fonte única usada pelo seed (script + testes + app).
 */

export const CHECKED_AT = "2026-10-20";

// Fontes oficiais conferidas na execução (links oficiais):
export const SOURCES = {
  cf88: {
    name: "Constituição Federal de 1988 — texto oficial (Planalto)",
    url: "https://www4.planalto.gov.br/legislacao/portal-legis/legislacao-1/constituicao",
  },
  pf2025: {
    name: "Edital nº 1 - PF - Policial, de 20/05/2025 (Cebraspe / Polícia Federal)",
    url: "https://www.gov.br/pf/pt-br/acesso-a-informacao/servidores/concursos/edital/carreira-policial-2025/editais",
  },
  pfConcursos: {
    name: "Polícia Federal — página de concursos",
    url: "https://www.gov.br/pf/pt-br/acesso-a-informacao/servidores/concursos",
  },
  prf2021: {
    name: "Edital Concurso PRF nº 1, de 18/01/2021 (Cebraspe / PRF)",
    url: "https://www.gov.br/prf/pt-br/acesso-a-informacao/servidores/concursos-e-selecoes/concurso-2021",
  },
  pmdfCfo2025: {
    name: "PMDF — Edital nº 03/2025 – DGP/PMDF, de 31/01/2025 (CFO, Cebraspe)",
    url: "https://www.cebraspe.org.br/concursos/pm_df_25_cfo",
  },
};

/**
 * Ficha constitucional compartilhada (arts. 5º, 37 e 144) — texto conferido na
 * fonte oficial. Usada como nota em todas as coleções.
 */
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

/** Coleções e itens. Cada item é idempotente por (collection.slug + título + kind). */
export const COLLECTIONS = [
  // ============================ PMDF ============================
  {
    slug: "pmdf-cfo",
    title: "PMDF — Oficial / Curso de Formação de Oficiais (CFO)",
    summary:
      "Trilha de preparação para o ingresso como Oficial Policial Militar (2º Tenente) da Polícia Militar do Distrito Federal, via Curso de Formação de Oficiais.",
    status: "historico",
    statusNote:
      "Baseado no Edital nº 03/2025 – DGP/PMDF, de 31/01/2025 (referência histórica; certame suspenso e retomado ao longo de 2025/2026, com retificações posteriores). Confirme sempre o edital vigente na página do Cebraspe antes da prova.",
    source: SOURCES.pmdfCfo2025,
    editalRef: "Edital nº 03/2025 – DGP/PMDF (CFO)",
    areas: [
      "Língua Portuguesa",
      "Raciocínio Lógico e Matemático",
      "Noções de Direito (Constitucional, Administrativo e Penal)",
      "História e Geografia do Distrito Federal",
      "Atualidades e Legislação Aplicada à PMDF",
    ],
    items: [
      {
        title: "Como estudar o CFO da PMDF",
        kind: "nota",
        order: 1,
        category: "resumo_proprio",
        refLabel: "Orientação de estudo (conteúdo comum de preparação)",
        body:
          "A seleção do CFO combina provas objetivas e discursiva, além de fases eliminatórias (aptidão física, exames médicos, avaliação psicológica e sindicância de vida pregressa/investigação social).\n\nEstratégia inicial sugerida: (1) domine Português e Raciocínio Lógico, que sustentam a nota objetiva; (2) construa base sólida de Direito Constitucional (princípios do art. 37 e direitos do art. 5º); (3) trate a história e geografia do DF como matéria de memorização ativa com revisão espaçada; (4) treine a redação/discursiva semanalmente.\n\nEste material é introdutório e autoral; não substitui o edital oficial.",
      },
      {
        title: "Nota — Língua Portuguesa: coesão e coerência",
        kind: "nota",
        order: 2,
        category: "resumo_proprio",
        refLabel: "Conteúdo comum de preparação",
        body:
          "Coesão é a amarração formal entre partes do texto (conectivos, pronomes, repetições controladas). Coerência é a relação lógica de sentido com o contexto.\n\nPrincipais conectivos: adição (além disso, outrossim), oposição (porém, todavia, contudo), causa (porque, visto que), conclusão (portanto, logo), explicação (isto é, ou seja).\n\nErro comum de prova: confundir \"mas\" (oposição) com \"mais\" (quantidade) e \"há\" (tempo passado/existir) com \"a\" (distância/futuro do presente). Verifique sempre a função na frase.",
      },
      {
        title: "Nota — Raciocínio Lógico: proposições e conectivos",
        kind: "nota",
        order: 3,
        category: "resumo_proprio",
        refLabel: "Conteúdo comum de preparação",
        body:
          "Proposição é sentença à qual se pode atribuir verdadeiro (V) ou falso (F). Conectivos principais:\n\n- Conjunção (p ∧ q): V só quando ambos V.\n- Disjunção (p ∨ q): F só quando ambos F.\n- Condicional (p → q): F só quando p=V e q=F (\"o antecedente verdadeiro com consequente falso\").\n- Bicondicional (p ↔ q): V quando ambos têm o mesmo valor.\n\nEquivalência da condicional: p → q equivale a ¬q → ¬p (contrapositiva) e a ¬p ∨ q.\n\nErro comum: negar uma condicional como se fosse outra condicional. A negação de p → q é p ∧ ¬q.",
      },
      {
        title: "Nota — Direito Constitucional: princípios do art. 37",
        kind: "nota",
        order: 4,
        category: "resumo_proprio",
        refLabel: "Constituição Federal de 1988, art. 37",
        url: SOURCES.cf88.url,
        body:
          "O art. 37 fixa os princípios expressos da administração pública: legalidade, impessoalidade, moralidade, publicidade e eficiência (LIMPE).\n\n- Legalidade (para a Administração): só pode agir conforme a lei.\n- Impessoidade: sem favorecimento pessoal.\n- Moralidade: exige ética e boa-fé administrativa.\n- Publicidade: transparência, com exceções legais (segurança do Estado/sociedade).\n- Eficiência: incluir pela EC 19/1998.\n\nPonto de prova: o rol é exemplificativo? Não — estes cinco são os expressos no caput; há outros princípios implícitos no ordenamento.",
      },
      {
        title: "Nota — História e Geografia do DF: noções introdutórias",
        kind: "nota",
        order: 5,
        category: "resumo_proprio",
        refLabel: "Conteúdo comum de preparação",
        body:
          "O Distrito Federal foi criado pela Constituição de 1891 e implantado em 1960 com a inauguração de Brasília. Não é estado nem município: é uma unidade federativa com competências híbridas (Lei Orgânica no lugar de Constituição estadual).\n\nAspectos frequentemente cobrados: Plano Piloto e o tombamento como Patrimônio Cultural da Humanidade (UNESCO, 1987); Regiões Administrativas; limites com Goiás e Minas Gerais; clima tropical com estação seca no inverno.\n\nDica de revisão: use mapa e linha do tempo; memorize marcos (1891, 1956 início da construção, 1960 inauguração, 1987 tombamento).",
      },
      {
        title: "Flashcard — Níveis de análise da segurança pública (art. 144)",
        kind: "flashcard",
        order: 20,
        category: "flashcard",
        refLabel: "Constituição Federal de 1988, art. 144",
        body: "Frente: Segundo o art. 144 da CF/88, a segurança pública é dever de quem, além de direito e responsabilidade de quem?\n\nVerso: É dever do Estado e direito e responsabilidade de todos.",
        url: SOURCES.cf88.url,
      },
      {
        title: "Flashcard — Princípios expressos do art. 37",
        kind: "flashcard",
        order: 21,
        category: "flashcard",
        refLabel: "Constituição Federal de 1988, art. 37",
        body: "Frente: Cite os cinco princípios expressos da administração pública no art. 37 da CF/88.\n\nVerso: Legalidade, impessoalidade, moralidade, publicidade e eficiência (LIMPE).",
        url: SOURCES.cf88.url,
      },
      {
        title: "Flashcard — Negação da condicional",
        kind: "flashcard",
        order: 22,
        category: "flashcard",
        refLabel: "Raciocínio lógico (conteúdo comum)",
        body: "Frente: Qual é a negação lógica da proposição p → q?\n\nVerso: p ∧ ¬q (o antecedente verdadeiro e o consequente falso).",
      },
      {
        title: "Flashcard — Distrito Federal é estado ou município?",
        kind: "flashcard",
        order: 23,
        category: "flashcard",
        refLabel: "Conteúdo comum de preparação",
        body: "Frente: O Distrito Federal é um estado ou um município?\n\nVerso: Nem um nem outro: é uma unidade federativa com competências híbridas, regida por Lei Orgânica.",
      },
      {
        title: "Flashcard — Coesão x coerência",
        kind: "flashcard",
        order: 24,
        category: "flashcard",
        refLabel: "Língua Portuguesa (conteúdo comum)",
        body: "Frente: Qual a diferença entre coesão e coerência textual?\n\nVerso: Coesão é a ligação formal (conectivos/pronomes ordenando as partes); coerência é a relação lógica de sentido com o contexto.",
      },
      ...questions("pmdf", [
        {
          q: "Sobre os princípios expressos da administração pública no art. 37 da CF/88, assinale a alternativa correta.",
          options: [
            "São apenas legalidade e impessoalidade.",
            "São: legalidade, impessoalidade, moralidade, publicidade e eficiência.",
            "A eficiência não consta do texto constitucional.",
            "O rol é taxativo e impede outros princípios.",
            "A moralidade foi revogada pela EC 19/1998.",
          ],
          correct: 1,
          explanation:
            "O caput do art. 37 lista os cinco princípios expressos (LIMPE). A eficiência foi incluída pela EC 19/1998; o rol não impede princípios implícitos.",
        },
        {
          q: "A negação lógica da proposição \"Se estudo, então sou aprovado\" é:",
          options: [
            "Se não estudo, então não sou aprovado.",
            "Se sou aprovado, então estudo.",
            "Estudo e não sou aprovado.",
            "Não estudo e sou aprovado.",
            "Estudo ou sou aprovado.",
          ],
          correct: 2,
          explanation:
            "A negação da condicional p → q é p ∧ ¬q: \"Estudo E não sou aprovado\". A alternativa 'a' é a inversa (não equivalente) e a 'b' é a recíproca.",
        },
        {
          q: "Segundo o art. 144 da Constituição Federal de 1988, a segurança pública é:",
          options: [
            "responsabilidade exclusiva da União.",
            "dever do Estado, direito e responsabilidade de todos.",
            "atribuição apenas das polícias militares.",
            "matéria infraconstitucional, sem previsão na CF.",
            "competência exclusiva do Distrito Federal.",
          ],
          correct: 1,
          explanation:
            "O caput do art. 144 afirma que a segurança pública é dever do Estado, direito e responsabilidade de todos, exercida pelos órgãos ali listados.",
        },
        {
          q: "O Distrito Federal, no plano político-administrativo, é:",
          options: [
            "um município com prefeito e câmara.",
            "um estado federado com Constituição própria.",
            "uma unidade federativa regida por Lei Orgânica, sem subdivisão municipal.",
            "um território federal administrado pela União.",
            "parte integrante do estado de Goiás.",
          ],
          correct: 2,
          explanation:
            "O DF não é estado nem município: é unidade federativa regida por Lei Orgânica, com competências legislativas híbridas.",
        },
        {
          q: "Assinale a alternativa em que há ERRO no uso dos conectivos/ortografia.",
          options: [
            "Estudei muito, portanto fui aprovado.",
            "Quero mais tempo, mas o edital é curto.",
            "Há dois anos ele estuda para o concurso.",
            "Ele estuda mas cedo do que eu.",
            "Não fui à prova porque adoeci.",
          ],
          correct: 3,
          explanation:
            "Em 'mais cedo' deve-se usar o advérbio 'mais'. 'Mas' é conjunção adversativa; 'mas cedo' está incorreto.",
        },
        {
          q: "Em relação à condicional (p → q), é correto afirmar que ela é falsa:",
          options: [
            "somente quando p é falso e q é verdadeiro.",
            "somente quando p é verdadeiro e q é falso.",
            "somente quando ambos são verdadeiros.",
            "somente quando ambos são falsos.",
            "em nenhuma hipótese.",
          ],
          correct: 1,
          explanation:
            "A condicional só é falsa no caso V → F, ou seja, antecedente verdadeiro e consequente falso.",
        },
        {
          q: "Sobre a prova discursiva e as fases do CFO da PMDF, é correto dizer que:",
          options: [
            "há apenas prova objetiva.",
            "a investigação social não existe em concurso de carreira policial.",
            "há fases eliminatórias como aptidão física, exames médicos, avaliação psicológica e sindicância de vida pregressa.",
            "a discursiva é classificatória, mas não eliminatória.",
            "o curso de formação não integra o concurso.",
          ],
          correct: 2,
          explanation:
            "O concurso do CFO inclui fases eliminatórias (TAF, exames médicos, avaliação psicológica) e sindicância de vida pregressa/investigação social, além de objetiva e discursiva.",
        },
        {
          q: "A coerência textual diz respeito a:",
          options: [
            "ao uso exclusivo de conectivos.",
            "à relação lógica de sentido entre as partes e o contexto.",
            "apenas à correção ortográfica.",
            "ao número de parágrafos.",
            "à pontuação isolada.",
          ],
          correct: 1,
          explanation:
            "Coerência é a relação lógica de sentido; coesão é a ligação formal (conectivos, pronomes).",
        },
        {
          q: "O tombamento de Brasília como Patrimônio Cultural da Humanidade ocorreu em:",
          options: ["1960", "1987", "1891", "2000", "1975"],
          correct: 1,
          explanation:
            "A UNESCO reconheceu o Plano Piloto como Patrimônio Cultural da Humanidade em 1987.",
        },
        {
          q: "Sobre cláusulas pétreas (art. 60, § 4º), os direitos e garantias individuais do art. 5º:",
          options: [
            "podem ser abolidos por emenda constitucional.",
            "não integram as cláusulas pétreas.",
            "não podem ser abolidos por emenda tendente a aboli-los.",
            "foram revogados pela EC 45/2004.",
            "dependem de lei complementar para valer.",
          ],
          correct: 2,
          explanation:
            "Os direitos e garantias individuais são cláusula pétrea: não podem ser abolidos nem sofrer emenda tendente a aboli-los.",
        },
      ]),
      constitutionalNote,
    ],
  },

  // ============================ PF ============================
  {
    slug: "pf-policial-2025",
    title: "Polícia Federal — Carreira Policial (Edital 2025)",
    summary:
      "Trilha de preparação para os cargos policiais da Polícia Federal (Agente, Escrivão, Papiloscopista, entre outros) conforme o Edital nº 1 - PF - Policial, de 20/05/2025.",
    status: "vigente",
    statusNote:
      "Edital nº 1 - PF - Policial, de 20/05/2025 confirmado (banca Cebraspe), com retificações (editais subsequentes) e edições de resultado. Confirme as atualizações no endereço oficial do certame antes da prova.",
    source: SOURCES.pf2025,
    editalRef: "Edital nº 1 - PF - Policial, de 20/05/2025",
    areas: [
      "Língua Portuguesa",
      "Raciocínio Lógico e Matemático",
      "Noções de Informática",
      "Noções de Direito Constitucional e Administrativo",
      "Noções de Direito Penal e Processual Penal",
      "Legislação Especial e Direitos Humanos",
    ],
    items: [
      {
        title: "Como estudar a carreira policial da PF",
        kind: "nota",
        order: 1,
        category: "resumo_proprio",
        refLabel: "Orientação de estudo (base: edital 2025)",
        body:
          "O Edital nº 1 - PF - Policial (20/05/2025) abrange, entre outros, os cargos de Delegado, Perito Criminal Federal, Escrivão, Agente e Papiloscopista Policial Federal. Para Agente, Escrivão e Papiloscopista, a prova objetiva traz um bloco de Conhecimentos Básicos (Bloco I) com 60 itens, além de prova discursiva; a Investigação Social é etapa eliminatória.\n\nEstratégia: (1) garanta o Bloco I, reprovando notas abaixo do mínimo; (2) integre Direito Penal, Processual Penal e Legislação Especial, muito cobrados; (3) mantenha Informática e Raciocínio Lógico com treino de questões; (4) treine a discursiva com temas de direitos humanos e segurança pública.\n\nMaterial introdutório e autoral; não substitui o edital.",
      },
      {
        title: "Nota — Direito Penal: princípio da legalidade",
        kind: "nota",
        order: 2,
        category: "resumo_proprio",
        refLabel: "Código Penal, art. 1º; CF/88, art. 5º, XXXIX",
        url: SOURCES.cf88.url,
        body:
          "O princípio da legalidade (art. 1º do CP) exige que não há crime sem lei anterior que o defina, nem pena sem prévia cominação legal (nullum crimen, nulla poena sine lege). Dois desdobramentos:\n\n- Anterioridade: a lei deve ser prévia ao fato.\n- Reserva legal: lei em sentido estrito.\n\nA lei penal não retroage, salvo para beneficiar o réu (CF, art. 5º, XL).\n\nErro comum: confundir legalidade com atipicidade. A atipicidade é a consequência de o fato não se encaixar no tipo penal, ainda que exista lei.",
      },
      {
        title: "Nota — Direito Processual Penal: inquérito policial",
        kind: "nota",
        order: 3,
        category: "resumo_proprio",
        refLabel: "Código de Processo Penal, arts. 4º a 23",
        body:
          "O inquérito policial é procedimento administrativo, inquisitivo, escrito, destinado a apurar a materialidade e a autoria de infração penal, conduzido pela polícia judiciária.\n\nCaracterísticas: dispensável (o MP pode oferecer denúncia com outros elementos), sigiloso quanto a terceiros, indisponível (a autoridade não pode arquivar). Prazo: em regra 10 dias se preso e 30 dias se solto.\n\nPonto de prova: o inquérito não se presta ao contraditório pleno; a defesa atua de modo limitado.",
      },
      {
        title: "Nota — Direito Constitucional: remédios constitucionais",
        kind: "nota",
        order: 4,
        category: "resumo_proprio",
        refLabel: "Constituição Federal de 1988, art. 5º",
        url: SOURCES.cf88.url,
        body:
          "Remédios constitucionais mais cobrados:\n\n- Habeas corpus (art. 5º, LXVIII): liberdade de locomoção; gratuito.\n- Habeas data (LXXII): acesso/retificação de dados pessoais em registros públicos.\n- Mandado de segurança (LXIX): direito líquido e certo não amparado por HC/HD.\n- Mandado de injunção (LXXI): falta de norma regulamentadora.\n- Ação popular (LXXIII): ato lesivo ao patrimônio público/moralidade/meio ambiente.\n\nErro comum: atribuir o habeas data à liberdade de locomoção. Locomoção é HC.",
      },
      {
        title: "Nota — Noções de Informática: segurança da informação",
        kind: "nota",
        order: 5,
        category: "resumo_proprio",
        refLabel: "Conteúdo comum de preparação",
        body:
          "Princípios de segurança (CID): confidencialidade, integridade e disponibilidade. Termos frequentes em prova:\n\n- Autenticação x autorização: provar identidade x conceder acesso.\n- Criptografia simétrica (mesma chave) x assimétrica (par de chaves pública/privada).\n- Assinatura digital: garante autenticidade e integridade (não sigilo por si só).\n- Phishing, ransomware e engenharia social: ameaças comuns.\n\nDica: diferencie backup (cópia) de redundância (duplicação operacional).",
      },
      {
        title: "Flashcard — Remédio para liberdade de locomoção",
        kind: "flashcard",
        order: 20,
        category: "flashcard",
        refLabel: "Constituição Federal de 1988, art. 5º, LXVIII",
        body: "Frente: Qual remédio constitucional protege a liberdade de locomoção e é gratuito?\n\nVerso: Habeas corpus (art. 5º, LXVIII).",
        url: SOURCES.cf88.url,
      },
      {
        title: "Flashcard — Princípio da legalidade penal",
        kind: "flashcard",
        order: 21,
        category: "flashcard",
        refLabel: "Código Penal, art. 1º",
        body: "Frente: O que significa nullum crimen, nulla poena sine lege?\n\nVerso: Não há crime sem lei anterior que o defina, nem pena sem prévia cominação legal.",
      },
      {
        title: "Flashcard — CID na segurança da informação",
        kind: "flashcard",
        order: 22,
        category: "flashcard",
        refLabel: "Informática (conteúdo comum)",
        body: "Frente: Quais são os três princípios básicos (CID) da segurança da informação?\n\nVerso: Confidencialidade, Integridade e Disponibilidade.",
      },
      {
        title: "Flashcard — Inquérito policial é dispensável?",
        kind: "flashcard",
        order: 23,
        category: "flashcard",
        refLabel: "Código de Processo Penal",
        body: "Frente: O inquérito policial é peça indispensável para a denúncia?\n\nVerso: Não. É dispensável; o MP pode denunciar com base em outros elementos.",
      },
      {
        title: "Flashcard — Anterioridade penal",
        kind: "flashcard",
        order: 24,
        category: "flashcard",
        refLabel: "Constituição Federal de 1988, art. 5º, XL",
        body: "Frente: A lei penal pode retroagir? Em que hipótese?\n\nVerso: Em regra não; retroage apenas para beneficiar o réu.",
        url: SOURCES.cf88.url,
      },
      ...questions("pf", [
        {
          q: "Assinale a alternativa que apresenta um remédio constitucional gratuito destinado a proteger a liberdade de locomoção.",
          options: ["Mandado de segurança", "Habeas data", "Habeas corpus", "Ação popular", "Mandado de injunção"],
          correct: 2,
          explanation:
            "O habeas corpus (art. 5º, LXVIII) protege a liberdade de locomoção e é gratuito.",
        },
        {
          q: "Sobre o princípio da legalidade penal, é correto afirmar que:",
          options: [
            "basta decreto para criar crime.",
            "não há crime sem lei anterior que o defina, nem pena sem prévia cominação legal.",
            "a lei penal sempre retroage.",
            "a medida provisória é o instrumento adequado para tipificar crimes.",
            "a legalidade não se aplica às contravenções.",
          ],
          correct: 1,
          explanation:
            "Legalidade penal (art. 1º do CP): exige lei anterior (reserva legal + anterioridade); retroação só em benefício do réu.",
        },
        {
          q: "O inquérito policial, segundo o CPP, é:",
          options: [
            "peça indispensável para o oferecimento da denúncia.",
            "procedimento judicial contraditório pleno.",
            "procedimento administrativo inquisitivo e dispensável.",
            "ato exclusivo do Ministério Público.",
            "instrumento que impede a defesa de qualquer acesso.",
          ],
          correct: 2,
          explanation:
            "O IP é procedimento administrativo, inquisitivo e dispensável; não é plenamente contraditório.",
        },
        {
          q: "O princípio da disponibilidade da ação penal pública significa que:",
          options: [
            "o delegado pode arquivar o inquérito.",
            "o inquérito é indisponível para a autoridade policial.",
            "o MP pode arquivar a denúncia por conveniência.",
            "a ação penal pública é de titularidade do ofendido.",
            "não há ação penal pública no Brasil.",
          ],
          correct: 1,
          explanation:
            "O inquérito policial é indisponível para a autoridade policial; quem pode promover o arquivamento é o MP, nos termos legais.",
        },
        {
          q: "Em segurança da informação, o princípio da integridade garante que:",
          options: [
            "a informação esteja sempre disponível.",
            "a informação seja mantida correta e não alterada indevidamente.",
            "os dados sejam públicos.",
            "haja backup obrigatório.",
            "o usuário seja autenticado por senha.",
          ],
          correct: 1,
          explanation:
            "Integridade assegura que a informação seja mantida íntegra/inalterada indevidamente. Disponibilidade é o outro princípio (CID).",
        },
        {
          q: "A assinatura digital de um documento tem como função principal:",
          options: [
            "cifrar o documento para torná-lo secreto.",
            "garantir autenticidade e integridade do documento.",
            "substituir a senha do usuário.",
            "aumentar a velocidade da rede.",
            "comprimir o arquivo.",
          ],
          correct: 1,
          explanation:
            "A assinatura digital garante autenticidade e integridade; o sigilo é papel da criptografia, não da assinatura por si só.",
        },
        {
          q: "Sobre a Investigação Social no concurso da PF, é correto afirmar que:",
          options: [
            "é etapa classificatória, mas não eliminatória.",
            "não existe no concurso da PF.",
            "é etapa eliminatória.",
            "só se aplica ao cargo de Delegado.",
            "substitui a prova de aptidão física.",
          ],
          correct: 2,
          explanation:
            "Conforme o edital, a Investigação Social é etapa eliminatória do certame.",
        },
        {
          q: "O habeas data destina-se a:",
          options: [
            "assegurar conhecimento/retificação de dados relativos à pessoa do impetrante em registros públicos.",
            "proteger a liberdade de locomoção.",
            "suprir falta de norma regulamentadora.",
            "anular ato lesivo ao patrimônio público.",
            "garantir o contraditório no inquérito.",
          ],
          correct: 0,
          explanation:
            "O habeas data (art. 5º, LXXII) serve ao acesso/retificação de dados pessoais em registros de entidades governamentais ou de caráter público.",
        },
        {
          q: "Na distinção entre autenticação e autorização:",
          options: [
            "autenticação concede acesso; autorização prova identidade.",
            "autenticação prova identidade; autorização concede acesso.",
            "são sinônimos.",
            "ambas se referem apenas a senhas.",
            "autorização impede o login.",
          ],
          correct: 1,
          explanation:
            "Autenticação é provar a identidade; autorização é definir o que aquele usuário pode acessar.",
        },
        {
          q: "A redação do art. 144 da CF/88 trata a segurança pública como:",
          options: [
            "dever exclusivo das polícias civis.",
            "dever do Estado, direito e responsabilidade de todos.",
            "matéria não prevista na Constituição.",
            "atribuição exclusiva da União.",
            "responsabilidade apenas dos municípios.",
          ],
          correct: 1,
          explanation:
            "Art. 144, caput: segurança pública é dever do Estado, direito e responsabilidade de todos.",
        },
      ]),
      constitutionalNote,
    ],
  },

  // ============================ PRF ============================
  {
    slug: "prf-policial",
    title: "PRF — Policial Rodoviário Federal",
    summary:
      "Trilha de preparação para o cargo de Policial Rodoviário Federal (PRF), Padrão I da Terceira Classe, com tópicos básicos e específicos.",
    status: "historico",
    statusNote:
      "Baseado no Edital Concurso PRF nº 1, de 18/01/2021 (Cebraspe) — referência histórica do último edital oficial. A validade foi prorrogada por decisão judicial (Edital nº 119, de 18/06/2026, +6 meses). Não há, nesta verificação, novo edital de abertura confirmado; não trate este material como edital vigente.",
    source: SOURCES.prf2021,
    editalRef: "Edital Concurso PRF nº 1, de 18/01/2021",
    areas: [
      "Língua Portuguesa",
      "Raciocínio Lógico e Matemático",
      "Física e Noções de Mecânica",
      "Noções de Direito (Constitucional, Administrativo e Penal)",
      "Legislação de Trânsito e Direito de Trânsito",
      "Ética no Serviço Público",
    ],
    items: [
      {
        title: "Como estudar para a PRF",
        kind: "nota",
        order: 1,
        category: "resumo_proprio",
        refLabel: "Orientação de estudo (base: edital 2021)",
        body:
          "A PRF exige graduação em qualquer área e organiza o concurso em etapas: prova objetiva e discursiva (1ª etapa), seguidas do Curso de Formação Policial (CFP) na UniPRF (2ª etapa), de caráter eliminatório e classificatório. A investigação social percorre todo o certame.\n\nEstratégia: (1) fortaleça Português e Raciocínio Lógico; (2) domine Física aplicada a trânsito (velocidade, frenagem, dinâmica); (3) integre Legislação de Trânsito (CTB) com Direito Constitucional e Penal; (4) treine Ética e a prova discursiva.\n\nMaterial introdutório e autoral; confira sempre o edital oficial mais recente.",
      },
      {
        title: "Nota — Física: cinemática e movimento uniforme",
        kind: "nota",
        order: 2,
        category: "resumo_proprio",
        refLabel: "Conteúdo comum de preparação (Física)",
        body:
          "Movimento uniforme (MU): velocidade constante. Equações:\n\n- v = ΔS / Δt\n- S = S₀ + v·t\n\nUnidades: SI usa m/s; para converter km/h em m/s, divida por 3,6.\n\nExemplo resolvido: um veículo a 72 km/h percorre 100 m em quanto tempo? 72 km/h = 20 m/s; t = 100 / 20 = 5 s.\n\nErro comum: esquecer a conversão de unidades. Sempre confira se velocidade e distância estão no mesmo sistema.",
      },
      {
        title: "Nota — Legislação de Trânsito: infrações e penalidades",
        kind: "nota",
        order: 3,
        category: "resumo_proprio",
        refLabel: "Código de Trânsito Brasileiro (Lei 9.503/1997)",
        body:
          "As infrações do CTB classificam-se em leve, média, grave e gravíssima, com pontuação e valores distintos.\n\nConceitos-chave: penalidade (advertência, multa, suspensão, cassação) x medida administrativa (retenção, remoção do veículo, recolhimento de CNH).\n\nPonto de prova: direção sob influência de álcool é infração gravíssima, com multiplicador e possibilidade de crime de trânsito (art. 306 do CTB).\n\nDica: crie uma tabela de pontos por gravidade e revise semanalmente.",
      },
      {
        title: "Nota — Direito Administrativo: princípios e poderes",
        kind: "nota",
        order: 4,
        category: "resumo_proprio",
        refLabel: "Constituição Federal de 1988, art. 37",
        url: SOURCES.cf88.url,
        body:
          "A administração pública rege-se pelos princípios expressos do art. 37 (LIMPE) e por poderes administrativos:\n\n- Poder hierárquico, disciplinar, regulamentar, de polícia.\n- Poder de polícia: condiciona/limita direitos em favor do interesse público (ex.: fiscalização de trânsito).\n\nErro comum: confundir poder de polícia (administração) com polícia judiciária (apuração de crimes). O policiamento ostensivo de trânsito aproxima-se do poder de polícia.",
      },
      {
        title: "Nota — Ética no serviço público",
        kind: "nota",
        order: 5,
        category: "resumo_proprio",
        refLabel: "Decreto 1.171/1994 (Código de Ética) — conteúdo comum",
        body:
          "Princípios e valores: legalidade, impessoalidade, moralidade, publicidade, eficiência, além de dignidade, decoro, zelo, lealdade e cortesia.\n\nVedações frequentes em prova: usar o cargo para favorecimento próprio ou de terceiros, retirar documento do órgão sem autorização, apresentar-se embriagado em serviço.\n\nComissão de Ética: orienta e aconselha, sem natureza punitiva.\n\nDica: relacione ética à moralidade administrativa do art. 37 da CF.",
      },
      {
        title: "Flashcard — Conversão km/h para m/s",
        kind: "flashcard",
        order: 20,
        category: "flashcard",
        refLabel: "Física (conteúdo comum)",
        body: "Frente: Como converter 72 km/h para m/s?\n\nVerso: Divida por 3,6. 72 / 3,6 = 20 m/s.",
      },
      {
        title: "Flashcard — Classificação das infrações do CTB",
        kind: "flashcard",
        order: 21,
        category: "flashcard",
        refLabel: "Código de Trânsito Brasileiro",
        body: "Frente: Quais são as classificações das infrações de trânsito no CTB?\n\nVerso: Leve, média, grave e gravíssima.",
      },
      {
        title: "Flashcard — Poder de polícia",
        kind: "flashcard",
        order: 22,
        category: "flashcard",
        refLabel: "Direito Administrativo (conteúdo comum)",
        body: "Frente: O que caracteriza o poder de polícia da Administração?\n\nVerso: A faculdade de condicionar/limitar direitos e liberdades em favor do interesse público (ex.: fiscalização de trânsito).",
      },
      {
        title: "Flashcard — Velocidade média",
        kind: "flashcard",
        order: 23,
        category: "flashcard",
        refLabel: "Física (conteúdo comum)",
        body: "Frente: Qual a fórmula da velocidade média no movimento uniforme?\n\nVerso: v = ΔS / Δt (distância percorrida dividida pelo tempo).",
      },
      {
        title: "Flashcard — Fases do concurso PRF",
        kind: "flashcard",
        order: 24,
        category: "flashcard",
        refLabel: "Edital PRF 2021",
        body: "Frente: Quais são as etapas do concurso PRF conforme o edital de referência?\n\nVerso: 1ª etapa — prova objetiva e discursiva; 2ª etapa — Curso de Formação Policial (CFP) na UniPRF. A investigação social percorre todo o certame.",
      },
      ...questions("prf", [
        {
          q: "Um veículo trafega a 72 km/h. Qual é sua velocidade em metros por segundo?",
          options: ["72 m/s", "20 m/s", "7,2 m/s", "36 m/s", "10 m/s"],
          correct: 1,
          explanation: "Para converter km/h em m/s, divide-se por 3,6: 72 ÷ 3,6 = 20 m/s.",
        },
        {
          q: "No movimento uniforme, a velocidade média é dada por:",
          options: ["v = ΔS · Δt", "v = ΔS / Δt", "v = Δt / ΔS", "v = ΔS + Δt", "v = ΔS²"],
          correct: 1,
          explanation: "Velocidade média = variação da posição (ΔS) dividida pelo intervalo de tempo (Δt).",
        },
        {
          q: "Sobre as infrações do Código de Trânsito Brasileiro, é correto afirmar que:",
          options: [
            "existem apenas conforme a vontade do agente.",
            "classificam-se em leve, média, grave e gravíssima.",
            "são todas gravíssimas.",
            "não geram pontuação.",
            "só existem para veículos de carga.",
          ],
          correct: 1,
          explanation: "O CTB classifica as infrações em leve, média, grave e gravíssima, com pontuações distintas.",
        },
        {
          q: "O poder de polícia da Administração caracteriza-se por:",
          options: [
            "apurar crimes e indiciar suspeitos.",
            "condicionar o exercício de direitos e liberdades em favor do interesse público.",
            "julgar infrações administrativas.",
            "legislar sobre trânsito.",
            "representar judicialmente o Estado.",
          ],
          correct: 1,
          explanation:
            "Poder de polícia condiciona/limita direitos em favor do interesse público; a apuração de crimes é função da polícia judiciária.",
        },
        {
          q: "A direção de veículo sob influência de álcool, no CTB, configura infração:",
          options: ["leve", "média", "grave", "gravíssima", "não é infração"],
          correct: 3,
          explanation:
            "A condução sob influência de álcool é infração gravíssima, podendo também configurar crime de trânsito (art. 306 do CTB).",
        },
        {
          q: "O Curso de Formação Policial (CFP) do concurso PRF é:",
          options: [
            "primeira etapa, eliminatória.",
            "segunda etapa, eliminatória e classificatória.",
            "etapa meramente classificatória.",
            "opcional, sem impacto na posse.",
            "realizado antes da prova objetiva.",
          ],
          correct: 1,
          explanation:
            "Conforme o edital de referência, o CFP é a segunda etapa, de caráter eliminatório e classificatório, realizado na UniPRF.",
        },
        {
          q: "Sobre a ética no serviço público, é vedado ao servidor:",
          options: [
            "ser cortês no atendimento.",
            "usar o cargo para obter favorecimento próprio ou de terceiros.",
            "zelar pelo patrimônio público.",
            "cumprir a lei.",
            "ser assíduo.",
          ],
          correct: 1,
          explanation:
            "Usar o cargo para favorecimento próprio ou de terceiros viola o Código de Ética e a moralidade administrativa.",
        },
        {
          q: "A Comissão de Ética, no serviço público federal:",
          options: [
            "aplica penas criminais.",
            "orienta e aconselha, sem natureza punitiva.",
            "substitui a corregedoria.",
            "julga crimes de trânsito.",
            "demite servidores.",
          ],
          correct: 1,
          explanation:
            "A Comissão de Ética tem função educativa/orientadora; não aplica penalidades.",
        },
        {
          q: "Em relação aos princípios da administração pública (art. 37), a PRF, ao fiscalizar rodovias, deve observar:",
          options: [
            "apenas a legalidade.",
            "legalidade, impessoalidade, moralidade, publicidade e eficiência.",
            "somente a eficiência.",
            "a conveniência política do agente.",
            "a discricionariedade absoluta, sem limites.",
          ],
          correct: 1,
          explanation: "Toda atuação administrativa deve observar os cinco princípios expressos (LIMPE).",
        },
        {
          q: "Um veículo percorre 150 m em 6 s com velocidade constante. Sua velocidade é:",
          options: ["25 m/s", "15 m/s", "90 m/s", "0,04 m/s", "600 m/s"],
          correct: 0,
          explanation: "v = ΔS / Δt = 150 / 6 = 25 m/s.",
        },
      ]),
      constitutionalNote,
    ],
  },
];

/** Helper: transforma questões autorais no formato de item do catálogo. */
function questions(prefix, list) {
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

/**
 * Executa o seed do catálogo no PostgreSQL de forma idempotente.
 * Usa a MESMA fonte de dados (COLLECTIONS) do app.
 * @param {{ query: (text: string, params?: unknown[]) => Promise<{ rowCount: number | null, rows: unknown[] }> }} client
 * @returns {Promise<{collections:number, items:number, inserted:number}>}
 */
export async function seedCatalogPg(client) {
  const now = new Date().toISOString();
  let inserted = 0;
  let itemCount = 0;

  for (const col of COLLECTIONS) {
    const colId = `catalog:${col.slug}`;
    const up = await client.query(
      `INSERT INTO catalog_collections
        (id, slug, title, discipline_label, summary, status, status_note, source_name, source_url, edital_ref, checked_at, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT(slug) DO UPDATE SET
         title=excluded.title, summary=excluded.summary, status=excluded.status,
         status_note=excluded.status_note, source_name=excluded.source_name,
         source_url=excluded.source_url, edital_ref=excluded.edital_ref,
         checked_at=excluded.checked_at, updated_at=excluded.updated_at`,
      [
        colId,
        col.slug,
        col.title,
        "Concursos",
        col.summary,
        col.status,
        col.statusNote,
        col.source.name,
        col.source.url,
        col.editalRef,
        CHECKED_AT,
        now,
        now,
      ],
    );
    if ((up.rowCount ?? 0) > 0) inserted++;

    const stored = await client.query("SELECT id FROM catalog_collections WHERE slug = $1", [col.slug]);
    const storedId = stored.rows[0].id;

    const insertItem = async (item) => {
      const res = await client.query(
        `INSERT INTO catalog_items
          (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         ON CONFLICT(collection_id, title, kind) DO NOTHING`,
        [
          item.id,
          storedId,
          item.kind,
          item.category,
          item.title,
          item.body,
          item.options_json,
          item.correct_index,
          item.explanation,
          item.origin_note,
          item.ref_label,
          item.url,
          item.sort_order,
          now,
          now,
        ],
      );
      itemCount++;
      if ((res.rowCount ?? 0) > 0) inserted++;
    };

    // Áreas (matérias) da trilha
    let areaOrder = 0;
    for (const area of col.areas) {
      await insertItem({
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
      await insertItem({
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
  }

  return { collections: COLLECTIONS.length, items: itemCount, inserted };
}
