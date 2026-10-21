-- Moriarty — seed do catálogo de concursos (gerado por scripts/seed-sql.mjs).
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em Run.
-- Idempotente: pode rodar mais de uma vez sem duplicar.

begin;

-- Trilha: PMDF — Oficial / Curso de Formação de Oficiais (CFO)
insert into catalog_collections (id, slug, title, discipline_label, summary, status, status_note, source_name, source_url, edital_ref, checked_at, created_at, updated_at) values ('catalog:pmdf-cfo', 'pmdf-cfo', 'PMDF — Oficial / Curso de Formação de Oficiais (CFO)', 'Concursos', 'Trilha de preparação para o ingresso como Oficial Policial Militar (2º Tenente) da Polícia Militar do Distrito Federal, via Curso de Formação de Oficiais.', 'historico', 'Baseado no Edital nº 03/2025 – DGP/PMDF, de 31/01/2025 (referência histórica; certame suspenso e retomado ao longo de 2025/2026, com retificações posteriores). Confirme sempre o edital vigente na página do Cebraspe antes da prova.', 'PMDF — Edital nº 03/2025 – DGP/PMDF, de 31/01/2025 (CFO, Cebraspe)', 'https://www.cebraspe.org.br/concursos/pm_df_25_cfo', 'Edital nº 03/2025 – DGP/PMDF (CFO)', '2026-10-20', '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (slug) do update set title=excluded.title, summary=excluded.summary, status=excluded.status, status_note=excluded.status_note, source_name=excluded.source_name, source_url=excluded.source_url, edital_ref=excluded.edital_ref, checked_at=excluded.checked_at, updated_at=excluded.updated_at;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pmdf-cfo:area:0', 'catalog:pmdf-cfo', 'area', 'resumo_proprio', 'Língua Portuguesa', '', '', NULL, '', '', 'Matéria da trilha', '', 0, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pmdf-cfo:area:1', 'catalog:pmdf-cfo', 'area', 'resumo_proprio', 'Raciocínio Lógico e Matemático', '', '', NULL, '', '', 'Matéria da trilha', '', 1, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pmdf-cfo:area:2', 'catalog:pmdf-cfo', 'area', 'resumo_proprio', 'Noções de Direito (Constitucional, Administrativo e Penal)', '', '', NULL, '', '', 'Matéria da trilha', '', 2, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pmdf-cfo:area:3', 'catalog:pmdf-cfo', 'area', 'resumo_proprio', 'História e Geografia do Distrito Federal', '', '', NULL, '', '', 'Matéria da trilha', '', 3, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pmdf-cfo:area:4', 'catalog:pmdf-cfo', 'area', 'resumo_proprio', 'Atualidades e Legislação Aplicada à PMDF', '', '', NULL, '', '', 'Matéria da trilha', '', 4, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pmdf-cfo:nota:1', 'catalog:pmdf-cfo', 'nota', 'resumo_proprio', 'Como estudar o CFO da PMDF', 'A seleção do CFO combina provas objetivas e discursiva, além de fases eliminatórias (aptidão física, exames médicos, avaliação psicológica e sindicância de vida pregressa/investigação social).

Estratégia inicial sugerida: (1) domine Português e Raciocínio Lógico, que sustentam a nota objetiva; (2) construa base sólida de Direito Constitucional (princípios do art. 37 e direitos do art. 5º); (3) trate a história e geografia do DF como matéria de memorização ativa com revisão espaçada; (4) treine a redação/discursiva semanalmente.

Este material é introdutório e autoral; não substitui o edital oficial.', '', NULL, '', '', 'Orientação de estudo (conteúdo comum de preparação)', '', 1, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pmdf-cfo:nota:2', 'catalog:pmdf-cfo', 'nota', 'resumo_proprio', 'Nota — Língua Portuguesa: coesão e coerência', 'Coesão é a amarração formal entre partes do texto (conectivos, pronomes, repetições controladas). Coerência é a relação lógica de sentido com o contexto.

Principais conectivos: adição (além disso, outrossim), oposição (porém, todavia, contudo), causa (porque, visto que), conclusão (portanto, logo), explicação (isto é, ou seja).

Erro comum de prova: confundir "mas" (oposição) com "mais" (quantidade) e "há" (tempo passado/existir) com "a" (distância/futuro do presente). Verifique sempre a função na frase.', '', NULL, '', '', 'Conteúdo comum de preparação', '', 2, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pmdf-cfo:nota:3', 'catalog:pmdf-cfo', 'nota', 'resumo_proprio', 'Nota — Raciocínio Lógico: proposições e conectivos', 'Proposição é sentença à qual se pode atribuir verdadeiro (V) ou falso (F). Conectivos principais:

- Conjunção (p ∧ q): V só quando ambos V.
- Disjunção (p ∨ q): F só quando ambos F.
- Condicional (p → q): F só quando p=V e q=F ("o antecedente verdadeiro com consequente falso").
- Bicondicional (p ↔ q): V quando ambos têm o mesmo valor.

Equivalência da condicional: p → q equivale a ¬q → ¬p (contrapositiva) e a ¬p ∨ q.

Erro comum: negar uma condicional como se fosse outra condicional. A negação de p → q é p ∧ ¬q.', '', NULL, '', '', 'Conteúdo comum de preparação', '', 3, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pmdf-cfo:nota:4', 'catalog:pmdf-cfo', 'nota', 'resumo_proprio', 'Nota — Direito Constitucional: princípios do art. 37', 'O art. 37 fixa os princípios expressos da administração pública: legalidade, impessoalidade, moralidade, publicidade e eficiência (LIMPE).

- Legalidade (para a Administração): só pode agir conforme a lei.
- Impessoidade: sem favorecimento pessoal.
- Moralidade: exige ética e boa-fé administrativa.
- Publicidade: transparência, com exceções legais (segurança do Estado/sociedade).
- Eficiência: incluir pela EC 19/1998.

Ponto de prova: o rol é exemplificativo? Não — estes cinco são os expressos no caput; há outros princípios implícitos no ordenamento.', '', NULL, '', '', 'Constituição Federal de 1988, art. 37', 'https://www4.planalto.gov.br/legislacao/portal-legis/legislacao-1/constituicao', 4, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pmdf-cfo:nota:5', 'catalog:pmdf-cfo', 'nota', 'resumo_proprio', 'Nota — História e Geografia do DF: noções introdutórias', 'O Distrito Federal foi criado pela Constituição de 1891 e implantado em 1960 com a inauguração de Brasília. Não é estado nem município: é uma unidade federativa com competências híbridas (Lei Orgânica no lugar de Constituição estadual).

Aspectos frequentemente cobrados: Plano Piloto e o tombamento como Patrimônio Cultural da Humanidade (UNESCO, 1987); Regiões Administrativas; limites com Goiás e Minas Gerais; clima tropical com estação seca no inverno.

Dica de revisão: use mapa e linha do tempo; memorize marcos (1891, 1956 início da construção, 1960 inauguração, 1987 tombamento).', '', NULL, '', '', 'Conteúdo comum de preparação', '', 5, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pmdf-cfo:flashcard:20', 'catalog:pmdf-cfo', 'flashcard', 'flashcard', 'Flashcard — Níveis de análise da segurança pública (art. 144)', 'Frente: Segundo o art. 144 da CF/88, a segurança pública é dever de quem, além de direito e responsabilidade de quem?

Verso: É dever do Estado e direito e responsabilidade de todos.', '', NULL, '', '', 'Constituição Federal de 1988, art. 144', 'https://www4.planalto.gov.br/legislacao/portal-legis/legislacao-1/constituicao', 20, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pmdf-cfo:flashcard:21', 'catalog:pmdf-cfo', 'flashcard', 'flashcard', 'Flashcard — Princípios expressos do art. 37', 'Frente: Cite os cinco princípios expressos da administração pública no art. 37 da CF/88.

Verso: Legalidade, impessoalidade, moralidade, publicidade e eficiência (LIMPE).', '', NULL, '', '', 'Constituição Federal de 1988, art. 37', 'https://www4.planalto.gov.br/legislacao/portal-legis/legislacao-1/constituicao', 21, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pmdf-cfo:flashcard:22', 'catalog:pmdf-cfo', 'flashcard', 'flashcard', 'Flashcard — Negação da condicional', 'Frente: Qual é a negação lógica da proposição p → q?

Verso: p ∧ ¬q (o antecedente verdadeiro e o consequente falso).', '', NULL, '', '', 'Raciocínio lógico (conteúdo comum)', '', 22, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pmdf-cfo:flashcard:23', 'catalog:pmdf-cfo', 'flashcard', 'flashcard', 'Flashcard — Distrito Federal é estado ou município?', 'Frente: O Distrito Federal é um estado ou um município?

Verso: Nem um nem outro: é uma unidade federativa com competências híbridas, regida por Lei Orgânica.', '', NULL, '', '', 'Conteúdo comum de preparação', '', 23, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pmdf-cfo:flashcard:24', 'catalog:pmdf-cfo', 'flashcard', 'flashcard', 'Flashcard — Coesão x coerência', 'Frente: Qual a diferença entre coesão e coerência textual?

Verso: Coesão é a ligação formal (conectivos/pronomes ordenando as partes); coerência é a relação lógica de sentido com o contexto.', '', NULL, '', '', 'Língua Portuguesa (conteúdo comum)', '', 24, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pmdf-cfo:questao:100', 'catalog:pmdf-cfo', 'questao', 'questao_autoral', 'Questão autoral PMDF-01', 'Sobre os princípios expressos da administração pública no art. 37 da CF/88, assinale a alternativa correta.', '["São apenas legalidade e impessoalidade.","São: legalidade, impessoalidade, moralidade, publicidade e eficiência.","A eficiência não consta do texto constitucional.","O rol é taxativo e impede outros princípios.","A moralidade foi revogada pela EC 19/1998."]', 1, 'O caput do art. 37 lista os cinco princípios expressos (LIMPE). A eficiência foi incluída pela EC 19/1998; o rol não impede princípios implícitos.', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 100, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pmdf-cfo:questao:101', 'catalog:pmdf-cfo', 'questao', 'questao_autoral', 'Questão autoral PMDF-02', 'A negação lógica da proposição "Se estudo, então sou aprovado" é:', '["Se não estudo, então não sou aprovado.","Se sou aprovado, então estudo.","Estudo e não sou aprovado.","Não estudo e sou aprovado.","Estudo ou sou aprovado."]', 2, 'A negação da condicional p → q é p ∧ ¬q: "Estudo E não sou aprovado". A alternativa ''a'' é a inversa (não equivalente) e a ''b'' é a recíproca.', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 101, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pmdf-cfo:questao:102', 'catalog:pmdf-cfo', 'questao', 'questao_autoral', 'Questão autoral PMDF-03', 'Segundo o art. 144 da Constituição Federal de 1988, a segurança pública é:', '["responsabilidade exclusiva da União.","dever do Estado, direito e responsabilidade de todos.","atribuição apenas das polícias militares.","matéria infraconstitucional, sem previsão na CF.","competência exclusiva do Distrito Federal."]', 1, 'O caput do art. 144 afirma que a segurança pública é dever do Estado, direito e responsabilidade de todos, exercida pelos órgãos ali listados.', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 102, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pmdf-cfo:questao:103', 'catalog:pmdf-cfo', 'questao', 'questao_autoral', 'Questão autoral PMDF-04', 'O Distrito Federal, no plano político-administrativo, é:', '["um município com prefeito e câmara.","um estado federado com Constituição própria.","uma unidade federativa regida por Lei Orgânica, sem subdivisão municipal.","um território federal administrado pela União.","parte integrante do estado de Goiás."]', 2, 'O DF não é estado nem município: é unidade federativa regida por Lei Orgânica, com competências legislativas híbridas.', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 103, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pmdf-cfo:questao:104', 'catalog:pmdf-cfo', 'questao', 'questao_autoral', 'Questão autoral PMDF-05', 'Assinale a alternativa em que há ERRO no uso dos conectivos/ortografia.', '["Estudei muito, portanto fui aprovado.","Quero mais tempo, mas o edital é curto.","Há dois anos ele estuda para o concurso.","Ele estuda mas cedo do que eu.","Não fui à prova porque adoeci."]', 3, 'Em ''mais cedo'' deve-se usar o advérbio ''mais''. ''Mas'' é conjunção adversativa; ''mas cedo'' está incorreto.', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 104, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pmdf-cfo:questao:105', 'catalog:pmdf-cfo', 'questao', 'questao_autoral', 'Questão autoral PMDF-06', 'Em relação à condicional (p → q), é correto afirmar que ela é falsa:', '["somente quando p é falso e q é verdadeiro.","somente quando p é verdadeiro e q é falso.","somente quando ambos são verdadeiros.","somente quando ambos são falsos.","em nenhuma hipótese."]', 1, 'A condicional só é falsa no caso V → F, ou seja, antecedente verdadeiro e consequente falso.', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 105, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pmdf-cfo:questao:106', 'catalog:pmdf-cfo', 'questao', 'questao_autoral', 'Questão autoral PMDF-07', 'Sobre a prova discursiva e as fases do CFO da PMDF, é correto dizer que:', '["há apenas prova objetiva.","a investigação social não existe em concurso de carreira policial.","há fases eliminatórias como aptidão física, exames médicos, avaliação psicológica e sindicância de vida pregressa.","a discursiva é classificatória, mas não eliminatória.","o curso de formação não integra o concurso."]', 2, 'O concurso do CFO inclui fases eliminatórias (TAF, exames médicos, avaliação psicológica) e sindicância de vida pregressa/investigação social, além de objetiva e discursiva.', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 106, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pmdf-cfo:questao:107', 'catalog:pmdf-cfo', 'questao', 'questao_autoral', 'Questão autoral PMDF-08', 'A coerência textual diz respeito a:', '["ao uso exclusivo de conectivos.","à relação lógica de sentido entre as partes e o contexto.","apenas à correção ortográfica.","ao número de parágrafos.","à pontuação isolada."]', 1, 'Coerência é a relação lógica de sentido; coesão é a ligação formal (conectivos, pronomes).', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 107, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pmdf-cfo:questao:108', 'catalog:pmdf-cfo', 'questao', 'questao_autoral', 'Questão autoral PMDF-09', 'O tombamento de Brasília como Patrimônio Cultural da Humanidade ocorreu em:', '["1960","1987","1891","2000","1975"]', 1, 'A UNESCO reconheceu o Plano Piloto como Patrimônio Cultural da Humanidade em 1987.', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 108, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pmdf-cfo:questao:109', 'catalog:pmdf-cfo', 'questao', 'questao_autoral', 'Questão autoral PMDF-10', 'Sobre cláusulas pétreas (art. 60, § 4º), os direitos e garantias individuais do art. 5º:', '["podem ser abolidos por emenda constitucional.","não integram as cláusulas pétreas.","não podem ser abolidos por emenda tendente a aboli-los.","foram revogados pela EC 45/2004.","dependem de lei complementar para valer."]', 2, 'Os direitos e garantias individuais são cláusula pétrea: não podem ser abolidos nem sofrer emenda tendente a aboli-los.', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 109, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pmdf-cfo:nota:90', 'catalog:pmdf-cfo', 'nota', 'resumo_proprio', 'Ficha — Constituição Federal de 1988: arts. 5º, 37 e 144', 'Resumo de estudo dos dispositivos mais recorrentes em provas de carreiras policiais. O texto entre aspas é citação literal da redação oficial; o restante é explicação didática de autoria própria.

Art. 5º — Direitos e garantias individuais. "Todos são iguais perante a lei, sem distinção de qualquer natureza..." Abrange a inviolabilidade da vida, liberdade, igualdade, segurança e propriedade. É cláusula pétrea (art. 60, § 4º). Ponto de prova: o caput é exemplificativo, não taxativo (art. 5º, § 2º).

Art. 37 — Administração pública. Estabelece os princípios expressos: "legalidade, impessoalidade, moralidade, publicidade e eficiência". A eficiência foi incluída pela EC 19/1998. Costuma aparecer combinado com os princípios implícitos (razoabilidade, proporcionalidade, motivação) e com a Lei 8.429/1992 (improbidade).

Art. 144 — Segurança pública. "A segurança pública, dever do Estado, direito e responsabilidade de todos..." Lista os órgãos responsáveis, entre eles a polícia federal, a polícia rodoviária federal e as polícias militares. Ponto de prova: segurança pública é dever do Estado, mas também direito e responsabilidade de todos.

Checagem de aprendizagem: (1) Quais são os cinco princípios expressos do art. 37? (2) O art. 144 caput trata a segurança pública como direito de quem? (3) O art. 5º é cláusula pétrea?', '', NULL, '', '', 'Constituição Federal de 1988', 'https://www4.planalto.gov.br/legislacao/portal-legis/legislacao-1/constituicao', 90, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pmdf-cfo:nota:80', 'catalog:pmdf-cfo', 'nota', 'resumo_proprio', 'Fontes oficiais — PMDF CFO 2025', 'Página oficial do concurso CFO/PMDF 2025 no Cebraspe (edital nº 03/2025 – DGP/PMDF e retificações).

Link oficial: https://www.cebraspe.org.br/concursos/pm_df_25_cfo

Material autoral de resumo; não é cópia de apostila ou prova oficial. Onde há lei citada, o texto está entre aspas com o artigo e o link oficial.', '', NULL, '', '', 'Fonte oficial', 'https://www.cebraspe.org.br/concursos/pm_df_25_cfo', 80, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pmdf-cfo:nota:6', 'catalog:pmdf-cfo', 'nota', 'resumo_proprio', 'Nota — Lei Orgânica Nacional das PMs (Lei nº 14.751/2023)', 'A Lei nº 14.751/2023 estabelece normas gerais para as polícias militares e os corpos de bombeiros militares dos estados, do Distrito Federal e dos Territórios.

Pontos de prova recorrentes:
- Define princípios institucionais (hierarquia, disciplina, subordinação ao governador).
- Disciplina a estrutura básica das corporações e as carreiras.
- Reafirma a competência da PM para policiamento ostensivo e preservação da ordem pública (CF/88, art. 144, § 5º).

Erro comum: confundir esta lei (norma geral nacional) com os estatutos/regulamentos internos de cada corporação.', '', NULL, '', '', 'Lei nº 14.751/2023', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/l14751.htm', 6, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pmdf-cfo:nota:7', 'catalog:pmdf-cfo', 'nota', 'resumo_proprio', 'Nota — Direito Penal Militar: crimes militares em tempo de paz', 'O CPM tipifica os crimes militares. Em tempo de paz, considera-se crime militar, entre outros, o praticado por militar da ativa contra militar na mesma situação, ou em local sujeito à administração militar.

Conceitos-chave:
- Militar da ativa (na PMDF, o policial militar em serviço ativo).
- Crime propriamente militar x crime impropriamente militar (este também tem previsão comum, mas atinge bem jurídico militar).
- A aplicação do CPM exige análise do sujeito, do local e da função.

Ponto de prova: nem todo crime praticado por policial militar será militar; depende dos critérios legais (ratione personae, loci e materiae).', '', NULL, '', '', 'Código Penal Militar (Decreto-Lei nº 1.001/1969)', 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del1001.htm', 7, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pmdf-cfo:nota:8', 'catalog:pmdf-cfo', 'nota', 'resumo_proprio', 'Nota — Hierarquia e disciplina na PM', 'Hierarquia e disciplina são os pilares das instituições militares (CF/88, art. 42 e art. 144, § 5º).

- Hierarquia: escalonamento da autoridade (quem manda em quem), expressa em círculos e postos/graduações.
- Disciplina: obediência e respeito às normas e à ordem legal, base do funcionamento da corporação.

Em prova: as questões cobram a definição conceitual e a distinção entre os dois princípios, além de sua base constitucional.', '', NULL, '', '', 'Conteúdo comum de preparação', '', 8, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pmdf-cfo:flashcard:25', 'catalog:pmdf-cfo', 'flashcard', 'flashcard', 'Flashcard — CFO PMDF: qual lei nacional rege as PMs?', 'Frente: Qual lei estabelece as normas gerais das polícias militares e corpos de bombeiros militares?

Verso: Lei nº 14.751/2023 (Lei Orgânica Nacional das PMs e CBM).', '', NULL, '', '', 'Lei nº 14.751/2023', 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/l14751.htm', 25, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pmdf-cfo:flashcard:26', 'catalog:pmdf-cfo', 'flashcard', 'flashcard', 'Flashcard — Hierarquia x disciplina', 'Frente: Qual a diferença entre hierarquia e disciplina nas instituições militares?

Verso: Hierarquia é o escalonamento da autoridade (quem comanda); disciplina é a obediência à ordem legal e às normas.', '', NULL, '', '', 'Conteúdo comum de preparação', '', 26, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pmdf-cfo:flashcard:27', 'catalog:pmdf-cfo', 'flashcard', 'flashcard', 'Flashcard — Segurança pública é dever de quem? (art. 144)', 'Frente: O que diz o caput do art. 144 da CF/88 sobre a segurança pública?

Verso: É dever do Estado, direito e responsabilidade de todos, exercida para preservação da ordem pública e incolumidade das pessoas e do patrimônio.', '', NULL, '', '', 'Constituição Federal de 1988, art. 144', 'https://www4.planalto.gov.br/legislacao/portal-legis/legislacao-1/constituicao', 27, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pmdf-cfo:nota:81', 'catalog:pmdf-cfo', 'nota', 'resumo_proprio', 'Cronograma sugerido — PMDF CFO (12 semanas)', 'Sugestão de distribuição semanal (ajuste à sua rotina). Não é cronograma oficial.

- Semanas 1–3: Língua Portuguesa + Raciocínio Lógico (base todos os dias) e Noções de Direito Constitucional.
- Semanas 4–6: Direito Administrativo e Direito Penal/Processual Penal; começar redação semanal.
- Semanas 7–9: Direito Penal Militar + Lei 14.751/2023 + História/Geografia do DF.
- Semanas 10–11: Atualidades e Legislação Aplicada à PMDF; revisão espaçada intensa.
- Semana 12: simulados cronometrados + revisão dos pontos fracos.

Regra de ouro: 60% questões, 40% teoria; revisar toda matéria em ciclos de 7 dias.', '', NULL, '', '', 'Sugestão de estudo (não oficial)', '', 81, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pmdf-cfo:questao:200', 'catalog:pmdf-cfo', 'questao', 'questao_autoral', 'Questão autoral PMDF-EXTRA-01', 'A hierarquia e a disciplina, na Polícia Militar, decorrem principalmente de qual fundamento constitucional?', '["Art. 5º, que trata dos direitos individuais.","Art. 37, que trata dos princípios da administração.","Art. 144, § 5º, combinado com o art. 42, que tratam das polícias militares.","Art. 170, que trata da ordem econômica.","Art. 205, que trata da educação."]', 2, 'A CF/88 trata das polícias militares no art. 144, § 5º, e do regime dos militares dos estados/DF no art. 42, onde se assentam hierarquia e disciplina.', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 200, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pmdf-cfo:questao:201', 'catalog:pmdf-cfo', 'questao', 'questao_autoral', 'Questão autoral PMDF-EXTRA-02', 'Sobre a Lei nº 14.751/2023 (Lei Orgânica Nacional das PMs), é correto afirmar que:', '["Revogou a competência das polícias militares para policiamento ostensivo.","Estabelece normas gerais aplicáveis às polícias militares dos estados, DF e Territórios.","Substitui a Constituição Federal na definição da segurança pública.","Aplica-se apenas à Polícia Federal.","Extinguiu a hierarquia nas corporações militares."]', 1, 'A lei fixa normas gerais para as PMs e CBM dos estados, DF e Territórios, sem afastar a competência constitucional de policiamento ostensivo.', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 201, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pmdf-cfo:questao:202', 'catalog:pmdf-cfo', 'questao', 'questao_autoral', 'Questão autoral PMDF-EXTRA-03', 'Quanto aos crimes militares em tempo de paz, a definição depende, entre outros critérios, de:', '["Exclusivamente do valor da pena.","Da condição de militar e do local/função (critérios pessoal, local e funcional).","Apenas do clamor público.","Da nacionalidade do autor.","Do horário em que o fato ocorreu."]', 1, 'A competência da justiça militar em tempo de paz analisa o sujeito (militar), o local e a função militar envolvida.', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 202, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;

-- Trilha: Polícia Federal — Carreira Policial (Edital 2025)
insert into catalog_collections (id, slug, title, discipline_label, summary, status, status_note, source_name, source_url, edital_ref, checked_at, created_at, updated_at) values ('catalog:pf-policial-2025', 'pf-policial-2025', 'Polícia Federal — Carreira Policial (Edital 2025)', 'Concursos', 'Trilha de preparação para os cargos policiais da Polícia Federal (Agente, Escrivão, Papiloscopista, entre outros) conforme o Edital nº 1 - PF - Policial, de 20/05/2025.', 'vigente', 'Edital nº 1 - PF - Policial, de 20/05/2025 confirmado (banca Cebraspe), com retificações (editais subsequentes) e edições de resultado. Confirme as atualizações no endereço oficial do certame antes da prova.', 'Edital nº 1 - PF - Policial, de 20/05/2025 (Cebraspe / Polícia Federal)', 'https://www.gov.br/pf/pt-br/acesso-a-informacao/servidores/concursos/edital/carreira-policial-2025/editais', 'Edital nº 1 - PF - Policial, de 20/05/2025', '2026-10-20', '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (slug) do update set title=excluded.title, summary=excluded.summary, status=excluded.status, status_note=excluded.status_note, source_name=excluded.source_name, source_url=excluded.source_url, edital_ref=excluded.edital_ref, checked_at=excluded.checked_at, updated_at=excluded.updated_at;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pf-policial-2025:area:0', 'catalog:pf-policial-2025', 'area', 'resumo_proprio', 'Língua Portuguesa', '', '', NULL, '', '', 'Matéria da trilha', '', 0, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pf-policial-2025:area:1', 'catalog:pf-policial-2025', 'area', 'resumo_proprio', 'Raciocínio Lógico e Matemático', '', '', NULL, '', '', 'Matéria da trilha', '', 1, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pf-policial-2025:area:2', 'catalog:pf-policial-2025', 'area', 'resumo_proprio', 'Noções de Informática', '', '', NULL, '', '', 'Matéria da trilha', '', 2, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pf-policial-2025:area:3', 'catalog:pf-policial-2025', 'area', 'resumo_proprio', 'Noções de Direito Constitucional e Administrativo', '', '', NULL, '', '', 'Matéria da trilha', '', 3, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pf-policial-2025:area:4', 'catalog:pf-policial-2025', 'area', 'resumo_proprio', 'Noções de Direito Penal e Processual Penal', '', '', NULL, '', '', 'Matéria da trilha', '', 4, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pf-policial-2025:area:5', 'catalog:pf-policial-2025', 'area', 'resumo_proprio', 'Legislação Especial e Direitos Humanos', '', '', NULL, '', '', 'Matéria da trilha', '', 5, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pf-policial-2025:nota:1', 'catalog:pf-policial-2025', 'nota', 'resumo_proprio', 'Como estudar a carreira policial da PF', 'O Edital nº 1 - PF - Policial (20/05/2025) abrange, entre outros, os cargos de Delegado, Perito Criminal Federal, Escrivão, Agente e Papiloscopista Policial Federal. Para Agente, Escrivão e Papiloscopista, a prova objetiva traz um bloco de Conhecimentos Básicos (Bloco I) com 60 itens, além de prova discursiva; a Investigação Social é etapa eliminatória.

Estratégia: (1) garanta o Bloco I, reprovando notas abaixo do mínimo; (2) integre Direito Penal, Processual Penal e Legislação Especial, muito cobrados; (3) mantenha Informática e Raciocínio Lógico com treino de questões; (4) treine a discursiva com temas de direitos humanos e segurança pública.

Material introdutório e autoral; não substitui o edital.', '', NULL, '', '', 'Orientação de estudo (base: edital 2025)', '', 1, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pf-policial-2025:nota:2', 'catalog:pf-policial-2025', 'nota', 'resumo_proprio', 'Nota — Direito Penal: princípio da legalidade', 'O princípio da legalidade (art. 1º do CP) exige que não há crime sem lei anterior que o defina, nem pena sem prévia cominação legal (nullum crimen, nulla poena sine lege). Dois desdobramentos:

- Anterioridade: a lei deve ser prévia ao fato.
- Reserva legal: lei em sentido estrito.

A lei penal não retroage, salvo para beneficiar o réu (CF, art. 5º, XL).

Erro comum: confundir legalidade com atipicidade. A atipicidade é a consequência de o fato não se encaixar no tipo penal, ainda que exista lei.', '', NULL, '', '', 'Código Penal, art. 1º; CF/88, art. 5º, XXXIX', 'https://www4.planalto.gov.br/legislacao/portal-legis/legislacao-1/constituicao', 2, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pf-policial-2025:nota:3', 'catalog:pf-policial-2025', 'nota', 'resumo_proprio', 'Nota — Direito Processual Penal: inquérito policial', 'O inquérito policial é procedimento administrativo, inquisitivo, escrito, destinado a apurar a materialidade e a autoria de infração penal, conduzido pela polícia judiciária.

Características: dispensável (o MP pode oferecer denúncia com outros elementos), sigiloso quanto a terceiros, indisponível (a autoridade não pode arquivar). Prazo: em regra 10 dias se preso e 30 dias se solto.

Ponto de prova: o inquérito não se presta ao contraditório pleno; a defesa atua de modo limitado.', '', NULL, '', '', 'Código de Processo Penal, arts. 4º a 23', '', 3, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pf-policial-2025:nota:4', 'catalog:pf-policial-2025', 'nota', 'resumo_proprio', 'Nota — Direito Constitucional: remédios constitucionais', 'Remédios constitucionais mais cobrados:

- Habeas corpus (art. 5º, LXVIII): liberdade de locomoção; gratuito.
- Habeas data (LXXII): acesso/retificação de dados pessoais em registros públicos.
- Mandado de segurança (LXIX): direito líquido e certo não amparado por HC/HD.
- Mandado de injunção (LXXI): falta de norma regulamentadora.
- Ação popular (LXXIII): ato lesivo ao patrimônio público/moralidade/meio ambiente.

Erro comum: atribuir o habeas data à liberdade de locomoção. Locomoção é HC.', '', NULL, '', '', 'Constituição Federal de 1988, art. 5º', 'https://www4.planalto.gov.br/legislacao/portal-legis/legislacao-1/constituicao', 4, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pf-policial-2025:nota:5', 'catalog:pf-policial-2025', 'nota', 'resumo_proprio', 'Nota — Noções de Informática: segurança da informação', 'Princípios de segurança (CID): confidencialidade, integridade e disponibilidade. Termos frequentes em prova:

- Autenticação x autorização: provar identidade x conceder acesso.
- Criptografia simétrica (mesma chave) x assimétrica (par de chaves pública/privada).
- Assinatura digital: garante autenticidade e integridade (não sigilo por si só).
- Phishing, ransomware e engenharia social: ameaças comuns.

Dica: diferencie backup (cópia) de redundância (duplicação operacional).', '', NULL, '', '', 'Conteúdo comum de preparação', '', 5, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pf-policial-2025:flashcard:20', 'catalog:pf-policial-2025', 'flashcard', 'flashcard', 'Flashcard — Remédio para liberdade de locomoção', 'Frente: Qual remédio constitucional protege a liberdade de locomoção e é gratuito?

Verso: Habeas corpus (art. 5º, LXVIII).', '', NULL, '', '', 'Constituição Federal de 1988, art. 5º, LXVIII', 'https://www4.planalto.gov.br/legislacao/portal-legis/legislacao-1/constituicao', 20, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pf-policial-2025:flashcard:21', 'catalog:pf-policial-2025', 'flashcard', 'flashcard', 'Flashcard — Princípio da legalidade penal', 'Frente: O que significa nullum crimen, nulla poena sine lege?

Verso: Não há crime sem lei anterior que o defina, nem pena sem prévia cominação legal.', '', NULL, '', '', 'Código Penal, art. 1º', '', 21, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pf-policial-2025:flashcard:22', 'catalog:pf-policial-2025', 'flashcard', 'flashcard', 'Flashcard — CID na segurança da informação', 'Frente: Quais são os três princípios básicos (CID) da segurança da informação?

Verso: Confidencialidade, Integridade e Disponibilidade.', '', NULL, '', '', 'Informática (conteúdo comum)', '', 22, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pf-policial-2025:flashcard:23', 'catalog:pf-policial-2025', 'flashcard', 'flashcard', 'Flashcard — Inquérito policial é dispensável?', 'Frente: O inquérito policial é peça indispensável para a denúncia?

Verso: Não. É dispensável; o MP pode denunciar com base em outros elementos.', '', NULL, '', '', 'Código de Processo Penal', '', 23, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pf-policial-2025:flashcard:24', 'catalog:pf-policial-2025', 'flashcard', 'flashcard', 'Flashcard — Anterioridade penal', 'Frente: A lei penal pode retroagir? Em que hipótese?

Verso: Em regra não; retroage apenas para beneficiar o réu.', '', NULL, '', '', 'Constituição Federal de 1988, art. 5º, XL', 'https://www4.planalto.gov.br/legislacao/portal-legis/legislacao-1/constituicao', 24, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pf-policial-2025:questao:100', 'catalog:pf-policial-2025', 'questao', 'questao_autoral', 'Questão autoral PF-01', 'Assinale a alternativa que apresenta um remédio constitucional gratuito destinado a proteger a liberdade de locomoção.', '["Mandado de segurança","Habeas data","Habeas corpus","Ação popular","Mandado de injunção"]', 2, 'O habeas corpus (art. 5º, LXVIII) protege a liberdade de locomoção e é gratuito.', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 100, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pf-policial-2025:questao:101', 'catalog:pf-policial-2025', 'questao', 'questao_autoral', 'Questão autoral PF-02', 'Sobre o princípio da legalidade penal, é correto afirmar que:', '["basta decreto para criar crime.","não há crime sem lei anterior que o defina, nem pena sem prévia cominação legal.","a lei penal sempre retroage.","a medida provisória é o instrumento adequado para tipificar crimes.","a legalidade não se aplica às contravenções."]', 1, 'Legalidade penal (art. 1º do CP): exige lei anterior (reserva legal + anterioridade); retroação só em benefício do réu.', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 101, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pf-policial-2025:questao:102', 'catalog:pf-policial-2025', 'questao', 'questao_autoral', 'Questão autoral PF-03', 'O inquérito policial, segundo o CPP, é:', '["peça indispensável para o oferecimento da denúncia.","procedimento judicial contraditório pleno.","procedimento administrativo inquisitivo e dispensável.","ato exclusivo do Ministério Público.","instrumento que impede a defesa de qualquer acesso."]', 2, 'O IP é procedimento administrativo, inquisitivo e dispensável; não é plenamente contraditório.', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 102, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pf-policial-2025:questao:103', 'catalog:pf-policial-2025', 'questao', 'questao_autoral', 'Questão autoral PF-04', 'O princípio da disponibilidade da ação penal pública significa que:', '["o delegado pode arquivar o inquérito.","o inquérito é indisponível para a autoridade policial.","o MP pode arquivar a denúncia por conveniência.","a ação penal pública é de titularidade do ofendido.","não há ação penal pública no Brasil."]', 1, 'O inquérito policial é indisponível para a autoridade policial; quem pode promover o arquivamento é o MP, nos termos legais.', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 103, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pf-policial-2025:questao:104', 'catalog:pf-policial-2025', 'questao', 'questao_autoral', 'Questão autoral PF-05', 'Em segurança da informação, o princípio da integridade garante que:', '["a informação esteja sempre disponível.","a informação seja mantida correta e não alterada indevidamente.","os dados sejam públicos.","haja backup obrigatório.","o usuário seja autenticado por senha."]', 1, 'Integridade assegura que a informação seja mantida íntegra/inalterada indevidamente. Disponibilidade é o outro princípio (CID).', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 104, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pf-policial-2025:questao:105', 'catalog:pf-policial-2025', 'questao', 'questao_autoral', 'Questão autoral PF-06', 'A assinatura digital de um documento tem como função principal:', '["cifrar o documento para torná-lo secreto.","garantir autenticidade e integridade do documento.","substituir a senha do usuário.","aumentar a velocidade da rede.","comprimir o arquivo."]', 1, 'A assinatura digital garante autenticidade e integridade; o sigilo é papel da criptografia, não da assinatura por si só.', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 105, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pf-policial-2025:questao:106', 'catalog:pf-policial-2025', 'questao', 'questao_autoral', 'Questão autoral PF-07', 'Sobre a Investigação Social no concurso da PF, é correto afirmar que:', '["é etapa classificatória, mas não eliminatória.","não existe no concurso da PF.","é etapa eliminatória.","só se aplica ao cargo de Delegado.","substitui a prova de aptidão física."]', 2, 'Conforme o edital, a Investigação Social é etapa eliminatória do certame.', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 106, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pf-policial-2025:questao:107', 'catalog:pf-policial-2025', 'questao', 'questao_autoral', 'Questão autoral PF-08', 'O habeas data destina-se a:', '["assegurar conhecimento/retificação de dados relativos à pessoa do impetrante em registros públicos.","proteger a liberdade de locomoção.","suprir falta de norma regulamentadora.","anular ato lesivo ao patrimônio público.","garantir o contraditório no inquérito."]', 0, 'O habeas data (art. 5º, LXXII) serve ao acesso/retificação de dados pessoais em registros de entidades governamentais ou de caráter público.', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 107, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pf-policial-2025:questao:108', 'catalog:pf-policial-2025', 'questao', 'questao_autoral', 'Questão autoral PF-09', 'Na distinção entre autenticação e autorização:', '["autenticação concede acesso; autorização prova identidade.","autenticação prova identidade; autorização concede acesso.","são sinônimos.","ambas se referem apenas a senhas.","autorização impede o login."]', 1, 'Autenticação é provar a identidade; autorização é definir o que aquele usuário pode acessar.', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 108, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pf-policial-2025:questao:109', 'catalog:pf-policial-2025', 'questao', 'questao_autoral', 'Questão autoral PF-10', 'A redação do art. 144 da CF/88 trata a segurança pública como:', '["dever exclusivo das polícias civis.","dever do Estado, direito e responsabilidade de todos.","matéria não prevista na Constituição.","atribuição exclusiva da União.","responsabilidade apenas dos municípios."]', 1, 'Art. 144, caput: segurança pública é dever do Estado, direito e responsabilidade de todos.', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 109, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pf-policial-2025:nota:90', 'catalog:pf-policial-2025', 'nota', 'resumo_proprio', 'Ficha — Constituição Federal de 1988: arts. 5º, 37 e 144', 'Resumo de estudo dos dispositivos mais recorrentes em provas de carreiras policiais. O texto entre aspas é citação literal da redação oficial; o restante é explicação didática de autoria própria.

Art. 5º — Direitos e garantias individuais. "Todos são iguais perante a lei, sem distinção de qualquer natureza..." Abrange a inviolabilidade da vida, liberdade, igualdade, segurança e propriedade. É cláusula pétrea (art. 60, § 4º). Ponto de prova: o caput é exemplificativo, não taxativo (art. 5º, § 2º).

Art. 37 — Administração pública. Estabelece os princípios expressos: "legalidade, impessoalidade, moralidade, publicidade e eficiência". A eficiência foi incluída pela EC 19/1998. Costuma aparecer combinado com os princípios implícitos (razoabilidade, proporcionalidade, motivação) e com a Lei 8.429/1992 (improbidade).

Art. 144 — Segurança pública. "A segurança pública, dever do Estado, direito e responsabilidade de todos..." Lista os órgãos responsáveis, entre eles a polícia federal, a polícia rodoviária federal e as polícias militares. Ponto de prova: segurança pública é dever do Estado, mas também direito e responsabilidade de todos.

Checagem de aprendizagem: (1) Quais são os cinco princípios expressos do art. 37? (2) O art. 144 caput trata a segurança pública como direito de quem? (3) O art. 5º é cláusula pétrea?', '', NULL, '', '', 'Constituição Federal de 1988', 'https://www4.planalto.gov.br/legislacao/portal-legis/legislacao-1/constituicao', 90, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pf-policial-2025:nota:80', 'catalog:pf-policial-2025', 'nota', 'resumo_proprio', 'Fontes oficiais — PF Agente 2025', 'Página oficial dos editais da carreira policial da Polícia Federal (2025) e edital nº 1 – PF – Policial, de 20/05/2025.

Link oficial: https://www.gov.br/pf/pt-br/acesso-a-informacao/servidores/concursos/edital/carreira-policial-2025/editais

Material autoral de resumo; não é cópia de apostila ou prova oficial. Onde há lei citada, o texto está entre aspas com o artigo e o link oficial.', '', NULL, '', '', 'Fonte oficial', 'https://www.gov.br/pf/pt-br/acesso-a-informacao/servidores/concursos/edital/carreira-policial-2025/editais', 80, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pf-policial-2025:nota:6', 'catalog:pf-policial-2025', 'nota', 'resumo_proprio', 'Nota — Polícia Federal: competências constitucionais (art. 144, § 1º)', 'O art. 144, § 1º, lista as funções da Polícia Federal (caráter de polícia judiciária da União):

- Apurar infrações penais contra a ordem política e social ou em detrimento de bens, serviços e interesses da União;
- Prevenir e reprimir o tráfico de drogas, o contrabando e o descaminho, sem excluir a ação fazendária;
- Exercer as funções de polícia marítima, aeroportuária e de fronteiras;
- Exercer com exclusividade a polícia judiciária da União.

Ponto de prova: as competências são do rol constitucional; prevalece o critério da matéria/do interesse.', '', NULL, '', '', 'Constituição Federal de 1988, art. 144, § 1º', 'https://www4.planalto.gov.br/legislacao/portal-legis/legislacao-1/constituicao', 6, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pf-policial-2025:nota:7', 'catalog:pf-policial-2025', 'nota', 'resumo_proprio', 'Nota — Inquérito policial: características e prazos (PF)', 'O inquérito policial é procedimento administrativo, inquisitivo, escrito e sigiloso, destinado a colher elementos de informação para a ação penal.

- Instauração: de ofício, por portaria, a requerimento ou por requisição do Ministério Público/juiz.
- Prazos (preso): 10 dias, prorrogáveis por igual período (regra do CPP, art. 10).
- Prazos (solto): prazo específico conforme a norma aplicável.
- Indiciamento: ato que aponta suspeito; não vincula o MP.

Ponto de prova: o inquérito não comporta contraditório pleno e não tem valor condenatório isolado.', '', NULL, '', '', 'Código de Processo Penal, arts. 4º a 23', 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del3689compilado.htm', 7, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pf-policial-2025:nota:8', 'catalog:pf-policial-2025', 'nota', 'resumo_proprio', 'Nota — Lei de Drogas: distinção usuário x traficante (art. 28 x art. 33)', 'A Lei nº 11.343/2006 distingue o porte para consumo pessoal (art. 28) do tráfico (art. 33).

- Art. 28: condutas de adquirir/guardar/ter em depósito para consumo; penas não privativas de liberdade (advertência, serviços à comunidade, medida educativa).
- Art. 33: importar, exportar, adquirir, guardar, transportar, vender, oferecer etc. — reclusão.
- A dosimetria considera quantidade, natureza e condição do agente (art. 28, § 2º, e art. 33, § 4º, para tráfico privilegiado).

Erro comum: achar que todo porte é tráfico; a lei exige análise do conjunto (destinação).', '', NULL, '', '', 'Lei nº 11.343/2006, arts. 28 e 33', 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11343.htm', 8, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pf-policial-2025:flashcard:25', 'catalog:pf-policial-2025', 'flashcard', 'flashcard', 'Flashcard — Competência da PF: art. 144, § 1º', 'Frente: Qual é o papel constitucional da Polícia Federal (art. 144, § 1º)?

Verso: É a polícia judiciária da União, com funções de apurar crimes de interesse da União, combater tráfico/contrabando/descaminho e atuar em polícia marítima, aeroportuária e de fronteiras.', '', NULL, '', '', 'Constituição Federal de 1988', 'https://www4.planalto.gov.br/legislacao/portal-legis/legislacao-1/constituicao', 25, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pf-policial-2025:flashcard:26', 'catalog:pf-policial-2025', 'flashcard', 'flashcard', 'Flashcard — Prazo do inquérito com preso (regra geral)', 'Frente: Qual o prazo, como regra geral, para conclusão do inquérito policial quando o investigado está preso?

Verso: 10 dias, prorrogáveis por igual período (regra geral do CPP).', '', NULL, '', '', 'Código de Processo Penal, art. 10', 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del3689compilado.htm', 26, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pf-policial-2025:flashcard:27', 'catalog:pf-policial-2025', 'flashcard', 'flashcard', 'Flashcard — Usuário x traficante (Lei 11.343/2006)', 'Frente: O que diferencia o porte para consumo (art. 28) do tráfico (art. 33) na Lei de Drogas?

Verso: A destinação da droga e as circunstâncias (quantidade, local, conduta). O consumo tem penas não privativas; o tráfico, reclusão.', '', NULL, '', '', 'Lei nº 11.343/2006', 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11343.htm', 27, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pf-policial-2025:nota:81', 'catalog:pf-policial-2025', 'nota', 'resumo_proprio', 'Cronograma sugerido — PF Agente (16 semanas)', 'Sugestão de distribuição semanal (ajuste à sua rotina). Não é cronograma oficial.

- Semanas 1–4: Português + Raciocínio Lógico + Noções de Informática (base diária).
- Semanas 5–7: Direito Constitucional e Direito Administrativo.
- Semanas 8–11: Direito Penal e Processual Penal (peso alto na PF).
- Semanas 12–13: Legislação Especial e Direitos Humanos.
- Semanas 14–16: Contabilidade/Estatística/Administração conforme cargo + revisão e simulados cronometrados (Certo/Errado).

Treine o formato Cebraspe Certo/Errado: um erro anula um acerto, então precisão > chute.', '', NULL, '', '', 'Sugestão de estudo (não oficial)', '', 81, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pf-policial-2025:questao:200', 'catalog:pf-policial-2025', 'questao', 'questao_autoral', 'Questão autoral PF-EXTRA-01', 'Entre as competências constitucionais da Polícia Federal (art. 144, § 1º), encontram-se:', '["O policiamento ostensivo das rodovias federais.","A apuração de infrações penais contra bens, serviços e interesses da União.","O julgamento de crimes de competência da Justiça Federal.","A defesa do patrimônio ecológico estadual.","O comando das polícias militares."]', 1, 'Cabe à PF apurar infrações penais em detrimento de bens, serviços e interesses da União, além das demais funções do § 1º.', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 200, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pf-policial-2025:questao:201', 'catalog:pf-policial-2025', 'questao', 'questao_autoral', 'Questão autoral PF-EXTRA-02', 'O inquérito policial, como regra, é:', '["Procedimento judicial com contraditório pleno.","Procedimento administrativo, inquisitivo, escrito e sigiloso.","Peça de acusação elaborada pelo Ministério Público.","Sentença condenatória antecipada.","Meio de prova exclusivo para condenação."]', 1, 'O inquérito é procedimento administrativo, inquisitivo, escrito e sigiloso, destinado a colher elementos de informação, sem contraditório pleno.', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 201, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:pf-policial-2025:questao:202', 'catalog:pf-policial-2025', 'questao', 'questao_autoral', 'Questão autoral PF-EXTRA-03', 'Sobre a Lei de Drogas (Lei nº 11.343/2006), assinale a correta.', '["Todo porte de droga é automaticamente tráfico.","O art. 28 trata do porte para consumo pessoal, com penas não privativas de liberdade.","O tráfico (art. 33) é infração de menor potencial ofensivo.","A lei não distingue usuário e traficante.","A quantidade de droga é irrelevante em qualquer análise."]', 1, 'O art. 28 trata o porte para consumo com penas não privativas; o art. 33 cuida do tráfico, com reclusão. A quantidade é relevante na dosimetria.', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 202, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;

-- Trilha: PRF — Policial Rodoviário Federal
insert into catalog_collections (id, slug, title, discipline_label, summary, status, status_note, source_name, source_url, edital_ref, checked_at, created_at, updated_at) values ('catalog:prf-policial', 'prf-policial', 'PRF — Policial Rodoviário Federal', 'Concursos', 'Trilha de preparação para o cargo de Policial Rodoviário Federal (PRF), Padrão I da Terceira Classe, com tópicos básicos e específicos.', 'historico', 'Baseado no Edital Concurso PRF nº 1, de 18/01/2021 (Cebraspe) — referência histórica do último edital oficial. A validade foi prorrogada por decisão judicial (Edital nº 119, de 18/06/2026, +6 meses). Não há, nesta verificação, novo edital de abertura confirmado; não trate este material como edital vigente.', 'Edital Concurso PRF nº 1, de 18/01/2021 (Cebraspe / PRF)', 'https://www.gov.br/prf/pt-br/acesso-a-informacao/servidores/concursos-e-selecoes/concurso-2021', 'Edital Concurso PRF nº 1, de 18/01/2021', '2026-10-20', '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (slug) do update set title=excluded.title, summary=excluded.summary, status=excluded.status, status_note=excluded.status_note, source_name=excluded.source_name, source_url=excluded.source_url, edital_ref=excluded.edital_ref, checked_at=excluded.checked_at, updated_at=excluded.updated_at;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:area:0', 'catalog:prf-policial', 'area', 'resumo_proprio', 'Língua Portuguesa', '', '', NULL, '', '', 'Matéria da trilha', '', 0, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:area:1', 'catalog:prf-policial', 'area', 'resumo_proprio', 'Raciocínio Lógico e Matemático', '', '', NULL, '', '', 'Matéria da trilha', '', 1, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:area:2', 'catalog:prf-policial', 'area', 'resumo_proprio', 'Física e Noções de Mecânica', '', '', NULL, '', '', 'Matéria da trilha', '', 2, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:area:3', 'catalog:prf-policial', 'area', 'resumo_proprio', 'Noções de Direito (Constitucional, Administrativo e Penal)', '', '', NULL, '', '', 'Matéria da trilha', '', 3, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:area:4', 'catalog:prf-policial', 'area', 'resumo_proprio', 'Legislação de Trânsito e Direito de Trânsito', '', '', NULL, '', '', 'Matéria da trilha', '', 4, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:area:5', 'catalog:prf-policial', 'area', 'resumo_proprio', 'Ética no Serviço Público', '', '', NULL, '', '', 'Matéria da trilha', '', 5, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:nota:1', 'catalog:prf-policial', 'nota', 'resumo_proprio', 'Como estudar para a PRF', 'A PRF exige graduação em qualquer área e organiza o concurso em etapas: prova objetiva e discursiva (1ª etapa), seguidas do Curso de Formação Policial (CFP) na UniPRF (2ª etapa), de caráter eliminatório e classificatório. A investigação social percorre todo o certame.

Estratégia: (1) fortaleça Português e Raciocínio Lógico; (2) domine Física aplicada a trânsito (velocidade, frenagem, dinâmica); (3) integre Legislação de Trânsito (CTB) com Direito Constitucional e Penal; (4) treine Ética e a prova discursiva.

Material introdutório e autoral; confira sempre o edital oficial mais recente.', '', NULL, '', '', 'Orientação de estudo (base: edital 2021)', '', 1, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:nota:2', 'catalog:prf-policial', 'nota', 'resumo_proprio', 'Nota — Física: cinemática e movimento uniforme', 'Movimento uniforme (MU): velocidade constante. Equações:

- v = ΔS / Δt
- S = S₀ + v·t

Unidades: SI usa m/s; para converter km/h em m/s, divida por 3,6.

Exemplo resolvido: um veículo a 72 km/h percorre 100 m em quanto tempo? 72 km/h = 20 m/s; t = 100 / 20 = 5 s.

Erro comum: esquecer a conversão de unidades. Sempre confira se velocidade e distância estão no mesmo sistema.', '', NULL, '', '', 'Conteúdo comum de preparação (Física)', '', 2, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:nota:3', 'catalog:prf-policial', 'nota', 'resumo_proprio', 'Nota — Legislação de Trânsito: infrações e penalidades', 'As infrações do CTB classificam-se em leve, média, grave e gravíssima, com pontuação e valores distintos.

Conceitos-chave: penalidade (advertência, multa, suspensão, cassação) x medida administrativa (retenção, remoção do veículo, recolhimento de CNH).

Ponto de prova: direção sob influência de álcool é infração gravíssima, com multiplicador e possibilidade de crime de trânsito (art. 306 do CTB).

Dica: crie uma tabela de pontos por gravidade e revise semanalmente.', '', NULL, '', '', 'Código de Trânsito Brasileiro (Lei 9.503/1997)', '', 3, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:nota:4', 'catalog:prf-policial', 'nota', 'resumo_proprio', 'Nota — Direito Administrativo: princípios e poderes', 'A administração pública rege-se pelos princípios expressos do art. 37 (LIMPE) e por poderes administrativos:

- Poder hierárquico, disciplinar, regulamentar, de polícia.
- Poder de polícia: condiciona/limita direitos em favor do interesse público (ex.: fiscalização de trânsito).

Erro comum: confundir poder de polícia (administração) com polícia judiciária (apuração de crimes). O policiamento ostensivo de trânsito aproxima-se do poder de polícia.', '', NULL, '', '', 'Constituição Federal de 1988, art. 37', 'https://www4.planalto.gov.br/legislacao/portal-legis/legislacao-1/constituicao', 4, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:nota:5', 'catalog:prf-policial', 'nota', 'resumo_proprio', 'Nota — Ética no serviço público', 'Princípios e valores: legalidade, impessoalidade, moralidade, publicidade, eficiência, além de dignidade, decoro, zelo, lealdade e cortesia.

Vedações frequentes em prova: usar o cargo para favorecimento próprio ou de terceiros, retirar documento do órgão sem autorização, apresentar-se embriagado em serviço.

Comissão de Ética: orienta e aconselha, sem natureza punitiva.

Dica: relacione ética à moralidade administrativa do art. 37 da CF.', '', NULL, '', '', 'Decreto 1.171/1994 (Código de Ética) — conteúdo comum', '', 5, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:flashcard:20', 'catalog:prf-policial', 'flashcard', 'flashcard', 'Flashcard — Conversão km/h para m/s', 'Frente: Como converter 72 km/h para m/s?

Verso: Divida por 3,6. 72 / 3,6 = 20 m/s.', '', NULL, '', '', 'Física (conteúdo comum)', '', 20, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:flashcard:21', 'catalog:prf-policial', 'flashcard', 'flashcard', 'Flashcard — Classificação das infrações do CTB', 'Frente: Quais são as classificações das infrações de trânsito no CTB?

Verso: Leve, média, grave e gravíssima.', '', NULL, '', '', 'Código de Trânsito Brasileiro', '', 21, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:flashcard:22', 'catalog:prf-policial', 'flashcard', 'flashcard', 'Flashcard — Poder de polícia', 'Frente: O que caracteriza o poder de polícia da Administração?

Verso: A faculdade de condicionar/limitar direitos e liberdades em favor do interesse público (ex.: fiscalização de trânsito).', '', NULL, '', '', 'Direito Administrativo (conteúdo comum)', '', 22, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:flashcard:23', 'catalog:prf-policial', 'flashcard', 'flashcard', 'Flashcard — Velocidade média', 'Frente: Qual a fórmula da velocidade média no movimento uniforme?

Verso: v = ΔS / Δt (distância percorrida dividida pelo tempo).', '', NULL, '', '', 'Física (conteúdo comum)', '', 23, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:flashcard:24', 'catalog:prf-policial', 'flashcard', 'flashcard', 'Flashcard — Fases do concurso PRF', 'Frente: Quais são as etapas do concurso PRF conforme o edital de referência?

Verso: 1ª etapa — prova objetiva e discursiva; 2ª etapa — Curso de Formação Policial (CFP) na UniPRF. A investigação social percorre todo o certame.', '', NULL, '', '', 'Edital PRF 2021', '', 24, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:questao:100', 'catalog:prf-policial', 'questao', 'questao_autoral', 'Questão autoral PRF-01', 'Um veículo trafega a 72 km/h. Qual é sua velocidade em metros por segundo?', '["72 m/s","20 m/s","7,2 m/s","36 m/s","10 m/s"]', 1, 'Para converter km/h em m/s, divide-se por 3,6: 72 ÷ 3,6 = 20 m/s.', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 100, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:questao:101', 'catalog:prf-policial', 'questao', 'questao_autoral', 'Questão autoral PRF-02', 'No movimento uniforme, a velocidade média é dada por:', '["v = ΔS · Δt","v = ΔS / Δt","v = Δt / ΔS","v = ΔS + Δt","v = ΔS²"]', 1, 'Velocidade média = variação da posição (ΔS) dividida pelo intervalo de tempo (Δt).', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 101, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:questao:102', 'catalog:prf-policial', 'questao', 'questao_autoral', 'Questão autoral PRF-03', 'Sobre as infrações do Código de Trânsito Brasileiro, é correto afirmar que:', '["existem apenas conforme a vontade do agente.","classificam-se em leve, média, grave e gravíssima.","são todas gravíssimas.","não geram pontuação.","só existem para veículos de carga."]', 1, 'O CTB classifica as infrações em leve, média, grave e gravíssima, com pontuações distintas.', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 102, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:questao:103', 'catalog:prf-policial', 'questao', 'questao_autoral', 'Questão autoral PRF-04', 'O poder de polícia da Administração caracteriza-se por:', '["apurar crimes e indiciar suspeitos.","condicionar o exercício de direitos e liberdades em favor do interesse público.","julgar infrações administrativas.","legislar sobre trânsito.","representar judicialmente o Estado."]', 1, 'Poder de polícia condiciona/limita direitos em favor do interesse público; a apuração de crimes é função da polícia judiciária.', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 103, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:questao:104', 'catalog:prf-policial', 'questao', 'questao_autoral', 'Questão autoral PRF-05', 'A direção de veículo sob influência de álcool, no CTB, configura infração:', '["leve","média","grave","gravíssima","não é infração"]', 3, 'A condução sob influência de álcool é infração gravíssima, podendo também configurar crime de trânsito (art. 306 do CTB).', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 104, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:questao:105', 'catalog:prf-policial', 'questao', 'questao_autoral', 'Questão autoral PRF-06', 'O Curso de Formação Policial (CFP) do concurso PRF é:', '["primeira etapa, eliminatória.","segunda etapa, eliminatória e classificatória.","etapa meramente classificatória.","opcional, sem impacto na posse.","realizado antes da prova objetiva."]', 1, 'Conforme o edital de referência, o CFP é a segunda etapa, de caráter eliminatório e classificatório, realizado na UniPRF.', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 105, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:questao:106', 'catalog:prf-policial', 'questao', 'questao_autoral', 'Questão autoral PRF-07', 'Sobre a ética no serviço público, é vedado ao servidor:', '["ser cortês no atendimento.","usar o cargo para obter favorecimento próprio ou de terceiros.","zelar pelo patrimônio público.","cumprir a lei.","ser assíduo."]', 1, 'Usar o cargo para favorecimento próprio ou de terceiros viola o Código de Ética e a moralidade administrativa.', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 106, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:questao:107', 'catalog:prf-policial', 'questao', 'questao_autoral', 'Questão autoral PRF-08', 'A Comissão de Ética, no serviço público federal:', '["aplica penas criminais.","orienta e aconselha, sem natureza punitiva.","substitui a corregedoria.","julga crimes de trânsito.","demite servidores."]', 1, 'A Comissão de Ética tem função educativa/orientadora; não aplica penalidades.', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 107, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:questao:108', 'catalog:prf-policial', 'questao', 'questao_autoral', 'Questão autoral PRF-09', 'Em relação aos princípios da administração pública (art. 37), a PRF, ao fiscalizar rodovias, deve observar:', '["apenas a legalidade.","legalidade, impessoalidade, moralidade, publicidade e eficiência.","somente a eficiência.","a conveniência política do agente.","a discricionariedade absoluta, sem limites."]', 1, 'Toda atuação administrativa deve observar os cinco princípios expressos (LIMPE).', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 108, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:questao:109', 'catalog:prf-policial', 'questao', 'questao_autoral', 'Questão autoral PRF-10', 'Um veículo percorre 150 m em 6 s com velocidade constante. Sua velocidade é:', '["25 m/s","15 m/s","90 m/s","0,04 m/s","600 m/s"]', 0, 'v = ΔS / Δt = 150 / 6 = 25 m/s.', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 109, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:nota:90', 'catalog:prf-policial', 'nota', 'resumo_proprio', 'Ficha — Constituição Federal de 1988: arts. 5º, 37 e 144', 'Resumo de estudo dos dispositivos mais recorrentes em provas de carreiras policiais. O texto entre aspas é citação literal da redação oficial; o restante é explicação didática de autoria própria.

Art. 5º — Direitos e garantias individuais. "Todos são iguais perante a lei, sem distinção de qualquer natureza..." Abrange a inviolabilidade da vida, liberdade, igualdade, segurança e propriedade. É cláusula pétrea (art. 60, § 4º). Ponto de prova: o caput é exemplificativo, não taxativo (art. 5º, § 2º).

Art. 37 — Administração pública. Estabelece os princípios expressos: "legalidade, impessoalidade, moralidade, publicidade e eficiência". A eficiência foi incluída pela EC 19/1998. Costuma aparecer combinado com os princípios implícitos (razoabilidade, proporcionalidade, motivação) e com a Lei 8.429/1992 (improbidade).

Art. 144 — Segurança pública. "A segurança pública, dever do Estado, direito e responsabilidade de todos..." Lista os órgãos responsáveis, entre eles a polícia federal, a polícia rodoviária federal e as polícias militares. Ponto de prova: segurança pública é dever do Estado, mas também direito e responsabilidade de todos.

Checagem de aprendizagem: (1) Quais são os cinco princípios expressos do art. 37? (2) O art. 144 caput trata a segurança pública como direito de quem? (3) O art. 5º é cláusula pétrea?', '', NULL, '', '', 'Constituição Federal de 1988', 'https://www4.planalto.gov.br/legislacao/portal-legis/legislacao-1/constituicao', 90, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:nota:80', 'catalog:prf-policial', 'nota', 'resumo_proprio', 'Fontes oficiais — PRF 2021', 'Página oficial do concurso PRF 2021 (Edital Concurso PRF nº 1, de 18/01/2021, Cebraspe).

Link oficial: https://www.gov.br/prf/pt-br/acesso-a-informacao/servidores/concursos-e-selecoes/concurso-2021

Material autoral de resumo; não é cópia de apostila ou prova oficial. Onde há lei citada, o texto está entre aspas com o artigo e o link oficial.', '', NULL, '', '', 'Fonte oficial', 'https://www.gov.br/prf/pt-br/acesso-a-informacao/servidores/concursos-e-selecoes/concurso-2021', 80, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:nota:6', 'catalog:prf-policial', 'nota', 'resumo_proprio', 'Nota — Código de Trânsito Brasileiro: estrutura e princípios', 'O CTB (Lei nº 9.503/1997) é a norma central de Legislação de Trânsito na PRF (maior peso na prova).

Estrutura e temas mais cobrados:
- Sistema Nacional de Trânsito (SNT) e suas competências (CONTRAN, SENATRAN, CETRAN, CONTRADIFE, JARI).
- Normas gerais de circulação e conduta.
- Habilitação e veículos.
- Infrações, penalidades e medidas administrativas (arts. 161 a 255).
- Crimes de trânsito (arts. 291 a 312).

Ponto de prova: distinguir infração administrativa de crime de trânsito; a embriaguez (art. 165 x art. 306) é clássica.', '', NULL, '', '', 'Lei nº 9.503/1997 (CTB)', 'https://www.planalto.gov.br/ccivil_03/leis/l9503compilado.htm', 6, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:nota:7', 'catalog:prf-policial', 'nota', 'resumo_proprio', 'Nota — Crimes de trânsito: art. 306 (embriaguez) x art. 165 (infração)', 'A embriaguez ao volante tem tratamento administrativo (art. 165) e penal (art. 306).

- Art. 165: infração administrativa gravíssima (multa e suspensão do direito de dirigir).
- Art. 306: crime — conduzir sob influência de álcool ou substância psicoativa com capacidade psicomotora alterada (detenção, multa e suspensão).
- A caracterização do art. 306 admite prova por etilômetro, exame de sangue ou, na falta, sinais notórios (vídeo, testemunhas, constatação).

Erro comum: confundir a infração administrativa (art. 165) com o crime (art. 306); ambos podem coexistir.', '', NULL, '', '', 'CTB, arts. 165 e 306', 'https://www.planalto.gov.br/ccivil_03/leis/l9503compilado.htm', 7, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:nota:8', 'catalog:prf-policial', 'nota', 'resumo_proprio', 'Nota — Organização do Sistema Nacional de Trânsito (SNT)', 'O SNT integra órgãos e entidades da União, estados, DF e municípios para gestão e fiscalização do trânsito.

Principais órgãos:
- CONTRAN: órgão normativo, consultivo e coordenador máximo.
- SENATRAN (antigo DENATRAN): órgão executivo máximo.
- CETRAN / CONTRADIFE: órgãos normativos, consultivos e fiscalizadores nos estados/DF.
- JARI: julga recursos de infrações.
- PRF: patrulhamento e fiscalização nas rodovias federais (competência do art. 20).

Ponto de prova: a competência fiscalizatória da PRF é nas rodovias federais, com atuação prevista em lei.', '', NULL, '', '', 'CTB, arts. 5º a 25', 'https://www.planalto.gov.br/ccivil_03/leis/l9503compilado.htm', 8, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:nota:9', 'catalog:prf-policial', 'nota', 'resumo_proprio', 'Nota — Direito Penal (base PRF): aplicação da lei penal', 'O Direito Penal integra o bloco II da PRF (peso relevante). Base inicial:

- Princípio da legalidade (art. 1º): não há crime sem lei anterior que o defina.
- Lei penal no tempo: regra da irretroatividade; retroatividade apenas benéfica (art. 2º).
- Tempo do crime (art. 4º): teoria da atividade (momento da conduta).
- Lugar do crime (art. 6º): teoria da ubiquidade (ação ou resultado).
- Territorialidade (art. 5º) e extraterritorialidade (art. 7º).

Ponto de prova: decorar as teorias do tempo (atividade) e do lugar (ubiquidade) do crime.', '', NULL, '', '', 'Código Penal, arts. 1º a 12', 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm', 9, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:flashcard:25', 'catalog:prf-policial', 'flashcard', 'flashcard', 'Flashcard — Competência fiscalizatória da PRF', 'Frente: Qual é a competência da PRF no âmbito do SNT?

Verso: Patrulhamento ostensivo e fiscalização do trânsito nas rodovias federais (art. 20 do CTB).', '', NULL, '', '', 'CTB, art. 20', 'https://www.planalto.gov.br/ccivil_03/leis/l9503compilado.htm', 25, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:flashcard:26', 'catalog:prf-policial', 'flashcard', 'flashcard', 'Flashcard — Tempo e lugar do crime', 'Frente: Quais teorias definem o tempo e o lugar do crime no CP?

Verso: Tempo do crime = teoria da atividade (art. 4º); lugar do crime = teoria da ubiquidade (art. 6º).', '', NULL, '', '', 'Código Penal, arts. 4º e 6º', 'https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm', 26, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:flashcard:27', 'catalog:prf-policial', 'flashcard', 'flashcard', 'Flashcard — Embriaguez: art. 165 x art. 306 do CTB', 'Frente: Qual a diferença entre o art. 165 e o art. 306 do CTB quanto à embriaguez ao volante?

Verso: Art. 165 = infração administrativa (gravíssima); art. 306 = crime de conduzir sob influência de álcool/substância psicoativa com capacidade psicomotora alterada.', '', NULL, '', '', 'CTB, arts. 165 e 306', 'https://www.planalto.gov.br/ccivil_03/leis/l9503compilado.htm', 27, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:nota:81', 'catalog:prf-policial', 'nota', 'resumo_proprio', 'Cronograma sugerido — PRF (14 semanas)', 'Sugestão de distribuição semanal (ajuste à sua rotina). Não é cronograma oficial.

- Semanas 1–3: Língua Portuguesa + Raciocínio Lógico + Informática.
- Semanas 4–6: Legislação de Trânsito (CTB + Resoluções CONTRAN) — maior peso (25%).
- Semanas 7–9: Direito Penal + Processual Penal + Direito Administrativo/Constitucional.
- Semanas 10–11: Legislação Especial + Direitos Humanos + Ética e Cidadania.
- Semanas 12–13: Física + Geopolítica + Língua Estrangeira.
- Semana 14: revisão geral e simulados no formato Certo/Errado.

Peso da prova (referência edital 2021): Legislação de Trânsito 30 questões (25%), Língua Portuguesa 18 (15%).', '', NULL, '', '', 'Sugestão de estudo (não oficial)', '', 81, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:questao:200', 'catalog:prf-policial', 'questao', 'questao_autoral', 'Questão autoral PRF-EXTRA-01', 'A competência da Polícia Rodoviária Federal, no âmbito do Sistema Nacional de Trânsito, é:', '["Fiscalizar o trânsito em todas as vias urbanas.","Patrulhar e fiscalizar as rodovias federais.","Julgar recursos de infrações de trânsito.","Editar normas gerais de trânsito.","Gerenciar a habilitação de condutores."]', 1, 'A PRF exerce patrulhamento ostensivo e fiscalização nas rodovias federais (art. 20 do CTB). Julgar recursos é da JARI; normatizar é do CONTRAN.', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 200, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:questao:201', 'catalog:prf-policial', 'questao', 'questao_autoral', 'Questão autoral PRF-EXTRA-02', 'Sobre o crime de embriaguez ao volante (art. 306 do CTB), é correto afirmar que:', '["É apenas infração administrativa.","Exige sempre valor exato de dosagem alcoólica no etilômetro.","Configura crime conduzir sob influência de álcool com capacidade psicomotora alterada.","Só se aplica a motoristas profissionais.","Foi revogado pela Lei nº 14.071/2020."]', 2, 'O art. 306 é crime e a alteração da capacidade psicomotora pode ser demonstrada por etilômetro, exame ou sinais notórios.', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 201, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;
insert into catalog_items (id, collection_id, kind, category, title, body, options_json, correct_index, explanation, origin_note, ref_label, url, sort_order, created_at, updated_at) values ('catalog:prf-policial:questao:202', 'catalog:prf-policial', 'questao', 'questao_autoral', 'Questão autoral PRF-EXTRA-03', 'Quanto ao tempo e ao lugar do crime, o Código Penal adota, respectivamente:', '["Teoria do resultado e teoria da atividade.","Teoria da atividade e teoria da ubiquidade.","Teoria da ubiquidade e teoria do resultado.","Teoria mista e teoria da atividade.","Teoria da atividade e teoria do resultado."]', 1, 'O CP adota a teoria da atividade para o tempo do crime (art. 4º) e a ubiquidade para o lugar (art. 6º).', 'Autoral/gerada para prática — NÃO é questão oficial.', 'Treino autoral', '', 202, '2026-10-21T13:40:19.419Z', '2026-10-21T13:40:19.419Z')
on conflict (collection_id, title, kind) do nothing;

commit;
