/**
 * Testes de isolamento de dados entre usuários (autorização horizontal).
 * Reproduzem os cenários de segurança exigidos no escopo do Moriarty
 * na camada de acesso a dados — a mesma usada pelas rotas e ações.
 *
 * Executados contra Postgres real (.env.test).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

process.env.DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5432/moriarty_test";
process.env.AUTH_SECRET = "segredo-de-teste-somente-local-1234567890";

let repos: typeof import("@/lib/repo/planning");
let materials: typeof import("@/lib/repo/materials");
let social: typeof import("@/lib/repo/social");
let reviews: typeof import("@/lib/repo/reviews");
let gamification: typeof import("@/lib/repo/gamification");
let quizRepo: typeof import("@/lib/repo/quiz");
let profile: typeof import("@/lib/repo/profile");

let userA: string;
let userB: string;
let subjectA: string;

beforeAll(async () => {
  const { setupPostgresTest } = await import("./helpers/db");
  await setupPostgresTest();

  repos = await import("@/lib/repo/planning");
  materials = await import("@/lib/repo/materials");
  social = await import("@/lib/repo/social");
  reviews = await import("@/lib/repo/reviews");
  gamification = await import("@/lib/repo/gamification");
  quizRepo = await import("@/lib/repo/quiz");
  profile = await import("@/lib/repo/profile");

  userA = await profile.createUser("a@teste.local", "hash-a");
  await profile.setInitialUsername(userA, "alice", "Alice");
  userB = await profile.createUser("b@teste.local", "hash-b");
  await profile.setInitialUsername(userB, "bob", "Bob");
  subjectA = await repos.createSubject(userA, {
    name: "Direito",
    priority: 5,
    mastery: 1,
    color: "#c9a227",
    goalId: null,
  });
});

afterAll(async () => {
  const { teardownPostgresTest } = await import("./helpers/db");
  await teardownPostgresTest();
});

describe("1. usuário A não lê dados privados do usuário B", () => {
  it("sessões são isoladas por usuário", async () => {
    await repos.createSession(userA, {
      goalId: null,
      subjectId: subjectA,
      topicId: null,
      date: "2026-03-02",
      startMinute: 1140,
      plannedMinutes: 50,
      kind: "estudo",
    });
    expect((await repos.listSessions(userA, "2026-03-01", "2026-03-31")).length).toBeGreaterThan(0);
    expect(await repos.listSessions(userB, "2026-03-01", "2026-03-31")).toHaveLength(0);
  });

  it("materiais privados de A não aparecem para B", async () => {
    const id = await materials.createMaterial(userA, {
      title: "Minha nota secreta",
      description: "",
      type: "nota",
      contentText: "conteúdo privado",
      url: "",
      subjectId: null,
      tags: [],
    });
    expect(await materials.getMaterial(userA, id)).not.toBeNull();
    expect(await materials.getMaterial(userB, id)).toBeNull();
    expect(await materials.listMaterials(userB, {})).toHaveLength(0);
  });

  it("revisões e questões são isoladas", async () => {
    await reviews.scheduleReview(userA, {
      title: "Revisão privada de A",
      subjectId: null,
      sourceType: "manual",
      sourceId: null,
      dueDate: "2026-03-05",
    });
    expect((await reviews.listReviews(userA)).length).toBeGreaterThan(0);
    expect(await reviews.listReviews(userB)).toHaveLength(0);

    await quizRepo.createQuestion(userA, {
      statement: "Enunciado privado de A sobre direito constitucional?",
      type: "multipla",
      options: ["a", "b", "c"],
      correctIndex: 0,
      explanation: "",
      subjectId: null,
      difficulty: 3,
      sourceName: "",
      origin: "autoral",
    });
    expect((await quizRepo.listQuestions(userA)).length).toBe(1);
    expect(await quizRepo.listQuestions(userB)).toHaveLength(0);
  });
});

describe("2. usuário A não altera ou exclui material de B", () => {
  it("update/delete de A sobre material de B não têm efeito", async () => {
    const idB = await materials.createMaterial(userB, {
      title: "Material do Bob",
      description: "",
      type: "nota",
      contentText: "segredo",
      url: "",
      subjectId: null,
      tags: [],
    });
    expect(await materials.updateMaterial(userA, idB, { title: "hackeado" })).toBe(false);
    expect(await materials.deleteMaterial(userA, idB)).toBe(false);
    expect((await materials.getMaterial(userB, idB))?.title).toBe("Material do Bob");
    // A própria tentativa de obter como dono falha:
    expect(await materials.getMaterial(userA, idB)).toBeNull();
  });
});

describe("3. material privado não abre para outro usuário", () => {
  it("sem token e sem amizade, não há acesso", async () => {
    const idA = await materials.createMaterial(userA, {
      title: "Privado de A",
      description: "",
      type: "nota",
      contentText: "x",
      url: "",
      subjectId: null,
      tags: [],
    });
    // Regra de acesso: só o dono enxerga 'privado'.
    expect(await materials.getMaterial(userB, idA)).toBeNull();
    expect(await materials.getMaterialByToken("token-inexistente")).toBeNull();
  });
});

describe("4. material compartilhado acessível só nas condições autorizadas", () => {
  it("visibilidade 'link' com token válido; revogar bloqueia", async () => {
    const idA = await materials.createMaterial(userA, {
      title: "Compartilhado por link",
      description: "",
      type: "nota",
      contentText: "y",
      url: "",
      subjectId: null,
      tags: [],
    });
    const token = await materials.enableShare(userA, idA, "link");
    expect(token).toBeTruthy();
    const row = await materials.getMaterialByToken(token!);
    expect(row?.id).toBe(idA);

    await materials.revokeShare(userA, idA);
    expect(await materials.getMaterialByToken(token!)).toBeNull();
  });

  it("visibilidade 'amigos' só aparece para amigos aceitos", async () => {
    const idA = await materials.createMaterial(userA, {
      title: "Só para amigos",
      description: "",
      type: "nota",
      contentText: "z",
      url: "",
      subjectId: null,
      tags: [],
    });
    await materials.enableShare(userA, idA, "amigos");
    expect(
      await materials.listFriendMaterials(userB, await social.listFriendIds(userB)),
    ).toHaveLength(0);
    await social.sendFriendRequest(userB, userA);
    // Solicitação pendente ainda não libera nada:
    expect(await social.areFriends(userB, userA)).toBe(false);
    expect(
      await materials.listFriendMaterials(userB, await social.listFriendIds(userB)),
    ).toHaveLength(0);
    const requests = await social.listPendingRequests(userA);
    await social.decideFriendRequest(userA, requests.received[0].id, "aceite");
    expect(await social.areFriends(userB, userA)).toBe(true);
    const visible = await materials.listFriendMaterials(
      userB,
      await social.listFriendIds(userB),
    );
    expect(visible.map((m) => m.id)).toContain(idA);
  });
});

describe("5. solicitação pendente ≠ amizade aceita", () => {
  it("listFriendIds não inclui pares com solicitação pendente", async () => {
    const a2 = await profile.createUser("a2@teste.local", "hash");
    await profile.setInitialUsername(a2, "carol", "Carol");
    await social.sendFriendRequest(a2, userB);
    expect(await social.areFriends(a2, userB)).toBe(false);
    expect(await social.listFriendIds(a2)).not.toContain(userB);
    expect(await social.listFriendIds(userB)).not.toContain(a2);
  });
});

describe("6. revogar compartilhamento bloqueia acessos posteriores", () => {
  it("token deixa de funcionar após revogação", async () => {
    const idA = await materials.createMaterial(userA, {
      title: "Revogável",
      description: "",
      type: "nota",
      contentText: "w",
      url: "",
      subjectId: null,
      tags: [],
    });
    const token = await materials.enableShare(userA, idA, "link");
    expect(await materials.getMaterialByToken(token!)).not.toBeNull();
    await materials.revokeShare(userA, idA);
    expect(await materials.getMaterialByToken(token!)).toBeNull();
  });
});

describe("7. cliente não atribui XP por manipulação", () => {
  it("awardXp é idempotente por evento", async () => {
    const before = await gamification.getXp(userA);
    const first = await gamification.awardXp(userA, "sessao_concluida", "study_sessions", "evt-1");
    const second = await gamification.awardXp(userA, "sessao_concluida", "study_sessions", "evt-1");
    expect(first).toBeGreaterThan(0);
    expect(second).toBe(0);
    expect(await gamification.getXp(userA)).toBe(before + first);
  });
});

describe("8. bloqueio remove amizade e impede novas solicitações", () => {
  it("bloquear encerra amizade", async () => {
    expect(await social.areFriends(userA, userB)).toBe(true);
    await social.blockUser(userA, userB);
    expect(await social.areFriends(userA, userB)).toBe(false);
    expect(
      await materials.listFriendMaterials(userB, await social.listFriendIds(userB)),
    ).toHaveLength(0);
    const r = await social.sendFriendRequest(userB, userA);
    expect(r.ok).toBe(false);
    await social.unblockUser(userA, userB);
  });
});

describe("9. rate limiting das rotas de auth", () => {
  it("bloqueia ao atingir o limite e libera após limpar o bucket", async () => {
    const rl = await import("@/lib/rate-limit");
    const email = "bruto@teste.local";
    for (let i = 0; i < 3; i++) await rl.registrarTentativa("login", email);

    const bloqueado = await rl.checarLimite("login", email, 3);
    expect(bloqueado.bloqueado).toBe(true);
    expect(bloqueado.restantes).toBe(0);

    await rl.limparBucket("login", email);
    const liberado = await rl.checarLimite("login", email, 3);
    expect(liberado.bloqueado).toBe(false);
    expect(liberado.restantes).toBe(3);
  });

  it("contas diferentes não compartilham o contador", async () => {
    const rl = await import("@/lib/rate-limit");
    for (let i = 0; i < 2; i++) await rl.registrarTentativa("login", "aluno-a@teste.local");
    const outro = await rl.checarLimite("login", "aluno-b@teste.local", 2);
    expect(outro.bloqueado).toBe(false);
  });

  it("janela vencida reinicia a contagem", async () => {
    const rl = await import("@/lib/rate-limit");
    const { execute } = await import("@/lib/db");
    const email = "velho@teste.local";
    await rl.registrarTentativa("login", email, 900);
    // Envelhece a janela (mais de 15 min atrás).
    await execute(
      "update auth_rate_limits set window_started_at = $2 where bucket = $1",
      [rl.chaveBucket("login", email), new Date(Date.now() - 60 * 60 * 1000).toISOString()],
    );

    const estado = await rl.checarLimite("login", email, 1);
    expect(estado.bloqueado).toBe(false);

    await rl.registrarTentativa("login", email, 900);
    const depois = await rl.checarLimite("login", email, 1);
    expect(depois.bloqueado).toBe(true);
  });
});

describe("cópia preserva origem e não concede edição do original", () => {
  it("cópia fica na biblioteca do destinatário com atribuição", async () => {
    const idA = await materials.createMaterial(userA, {
      title: "Original de A",
      description: "",
      type: "nota",
      contentText: "conteúdo",
      url: "",
      subjectId: null,
      tags: [],
    });
    const token = await materials.enableShare(userA, idA, "amigos");
    const source =
      (await materials.getMaterialByToken(token!)) ?? (await materials.getMaterial(userA, idA))!;
    const copyId = await materials.copyMaterial(userB, source);
    const copy = await materials.getMaterial(userB, copyId);
    expect(copy).not.toBeNull();
    expect(copy?.user_id).toBe(userB);
    expect(copy?.source_material_id).toBe(idA);
    expect(copy?.origin_note).toContain("alice");
    // O dono da cópia não pode editar o original:
    expect(await materials.updateMaterial(userB, idA, { title: "hack" })).toBe(false);
    // E o original continua com o dono A:
    expect((await materials.getMaterial(userA, idA))?.title).toBe("Original de A");
  });
});
