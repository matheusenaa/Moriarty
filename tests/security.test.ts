/**
 * Testes de isolamento de dados entre usuários (autorização horizontal).
 * Reproduzem os cenários de segurança exigidos no escopo do Moriarty
 * na camada de acesso a dados — a mesma usada pelas rotas e ações.
 */
import fs from "fs";
import path from "path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

process.env.DATABASE_PATH = "./data/test-security.db";
process.env.AUTH_SECRET = "segredo-de-teste-somente-local-1234567890";

const dbFile = path.join(process.cwd(), "data", "test-security.db");

let repos: typeof import("@/lib/repo/planning");
let materials: typeof import("@/lib/repo/materials");
let social: typeof import("@/lib/repo/social");
let reviews: typeof import("@/lib/repo/reviews");
let gamification: typeof import("@/lib/repo/gamification");
let quizRepo: typeof import("@/lib/repo/quiz");
let profile: typeof import("@/lib/repo/profile");
let closeDb: () => void;

let userA: string;
let userB: string;
let subjectA: string;

beforeAll(async () => {
  for (const suffix of ["", "-wal", "-shm"]) {
    const f = dbFile + suffix;
    if (fs.existsSync(f)) fs.rmSync(f);
  }
  repos = await import("@/lib/repo/planning");
  materials = await import("@/lib/repo/materials");
  social = await import("@/lib/repo/social");
  reviews = await import("@/lib/repo/reviews");
  gamification = await import("@/lib/repo/gamification");
  quizRepo = await import("@/lib/repo/quiz");
  profile = await import("@/lib/repo/profile");
  closeDb = (await import("@/lib/db")).closeDb;

  userA = profile.createUser("a@teste.local", "hash-a");
  profile.setInitialUsername(userA, "alice", "Alice");
  userB = profile.createUser("b@teste.local", "hash-b");
  profile.setInitialUsername(userB, "bob", "Bob");
  subjectA = repos.createSubject(userA, { name: "Direito", priority: 5, mastery: 1, color: "#c9a227", goalId: null });
});

afterAll(() => {
  closeDb();
});

describe("1. usuário A não lê dados privados do usuário B", () => {
  it("sessões são isoladas por usuário", () => {
    repos.createSession(userA, {
      goalId: null,
      subjectId: subjectA,
      topicId: null,
      date: "2026-03-02",
      startMinute: 1140,
      plannedMinutes: 50,
      kind: "estudo",
    });
    expect(repos.listSessions(userA, "2026-03-01", "2026-03-31").length).toBeGreaterThan(0);
    expect(repos.listSessions(userB, "2026-03-01", "2026-03-31")).toHaveLength(0);
  });

  it("materiais privados de A não aparecem para B", () => {
    const id = materials.createMaterial(userA, {
      title: "Minha nota secreta",
      description: "",
      type: "nota",
      contentText: "conteúdo privado",
      url: "",
      subjectId: null,
      tags: [],
    });
    expect(materials.getMaterial(userA, id)).not.toBeNull();
    expect(materials.getMaterial(userB, id)).toBeNull();
    expect(materials.listMaterials(userB, {})).toHaveLength(0);
  });

  it("revisões e questões são isoladas", () => {
    reviews.scheduleReview(userA, {
      title: "Revisão privada de A",
      subjectId: null,
      sourceType: "manual",
      sourceId: null,
      dueDate: "2026-03-05",
    });
    expect(reviews.listReviews(userA).length).toBeGreaterThan(0);
    expect(reviews.listReviews(userB)).toHaveLength(0);

    quizRepo.createQuestion(userA, {
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
    expect(quizRepo.listQuestions(userA).length).toBe(1);
    expect(quizRepo.listQuestions(userB)).toHaveLength(0);
  });
});

describe("2. usuário A não altera ou exclui material de B", () => {
  it("update/delete de A sobre material de B não têm efeito", () => {
    const idB = materials.createMaterial(userB, {
      title: "Material do Bob",
      description: "",
      type: "nota",
      contentText: "segredo",
      url: "",
      subjectId: null,
      tags: [],
    });
    expect(materials.updateMaterial(userA, idB, { title: "hackeado" })).toBe(false);
    expect(materials.deleteMaterial(userA, idB)).toBe(false);
    expect(materials.getMaterial(userB, idB)?.title).toBe("Material do Bob");
    // A própria tentativa de obter como dono falha:
    expect(materials.getMaterial(userA, idB)).toBeNull();
  });
});

describe("3. material privado não abre para outro usuário", () => {
  it("sem token e sem amizade, não há acesso", () => {
    const idA = materials.createMaterial(userA, {
      title: "Privado de A",
      description: "",
      type: "nota",
      contentText: "x",
      url: "",
      subjectId: null,
      tags: [],
    });
    // Regra de acesso: só o dono enxerga 'privado'.
    expect(materials.getMaterial(userB, idA)).toBeNull();
    expect(materials.getMaterialByToken("token-inexistente")).toBeNull();
  });
});

describe("4. material compartilhado acessível só nas condições autorizadas", () => {
  it("visibilidade 'link' com token válido; revogar bloqueia", () => {
    const idA = materials.createMaterial(userA, {
      title: "Compartilhado por link",
      description: "",
      type: "nota",
      contentText: "y",
      url: "",
      subjectId: null,
      tags: [],
    });
    const token = materials.enableShare(userA, idA, "link");
    expect(token).toBeTruthy();
    const row = materials.getMaterialByToken(token!);
    expect(row?.id).toBe(idA);

    materials.revokeShare(userA, idA);
    expect(materials.getMaterialByToken(token!)).toBeNull();
  });

  it("visibilidade 'amigos' só aparece para amigos aceitos", () => {
    const idA = materials.createMaterial(userA, {
      title: "Só para amigos",
      description: "",
      type: "nota",
      contentText: "z",
      url: "",
      subjectId: null,
      tags: [],
    });
    materials.enableShare(userA, idA, "amigos");
    expect(materials.listFriendMaterials(userB, social.listFriendIds(userB))).toHaveLength(0);
    social.sendFriendRequest(userB, userA);
    // Solicitação pendente ainda não libera nada:
    expect(social.areFriends(userB, userA)).toBe(false);
    expect(materials.listFriendMaterials(userB, social.listFriendIds(userB))).toHaveLength(0);
    const requests = social.listPendingRequests(userA);
    social.decideFriendRequest(userA, requests.received[0].id, "aceite");
    expect(social.areFriends(userB, userA)).toBe(true);
    const visible = materials.listFriendMaterials(userB, social.listFriendIds(userB));
    expect(visible.map((m) => m.id)).toContain(idA);
  });
});

describe("5. solicitação pendente ≠ amizade aceita", () => {
  it("listFriendIds não inclui pares com solicitação pendente", () => {
    const a2 = profile.createUser("a2@teste.local", "hash");
    profile.setInitialUsername(a2, "carol", "Carol");
    social.sendFriendRequest(a2, userB);
    expect(social.areFriends(a2, userB)).toBe(false);
    expect(social.listFriendIds(a2)).not.toContain(userB);
    expect(social.listFriendIds(userB)).not.toContain(a2);
  });
});

describe("6. revogar compartilhamento bloqueia acessos posteriores", () => {
  it("token deixa de funcionar após revogação", () => {
    const idA = materials.createMaterial(userA, {
      title: "Revogável",
      description: "",
      type: "nota",
      contentText: "w",
      url: "",
      subjectId: null,
      tags: [],
    });
    const token = materials.enableShare(userA, idA, "link");
    expect(materials.getMaterialByToken(token!)).not.toBeNull();
    materials.revokeShare(userA, idA);
    expect(materials.getMaterialByToken(token!)).toBeNull();
  });
});

describe("7. cliente não atribui XP por manipulação", () => {
  it("awardXp é idempotente por evento", () => {
    const before = gamification.getXp(userA);
    const first = gamification.awardXp(userA, "sessao_concluida", "study_sessions", "evt-1");
    const second = gamification.awardXp(userA, "sessao_concluida", "study_sessions", "evt-1");
    expect(first).toBeGreaterThan(0);
    expect(second).toBe(0);
    expect(gamification.getXp(userA)).toBe(before + first);
  });
});

describe("8. bloqueio remove amizade e impede novas solicitações", () => {
  it("bloquear encerra amizade", () => {
    expect(social.areFriends(userA, userB)).toBe(true);
    social.blockUser(userA, userB);
    expect(social.areFriends(userA, userB)).toBe(false);
    expect(materials.listFriendMaterials(userB, social.listFriendIds(userB))).toHaveLength(0);
    const r = social.sendFriendRequest(userB, userA);
    expect(r.ok).toBe(false);
    social.unblockUser(userA, userB);
  });
});

describe("cópia preserva origem e não concede edição do original", () => {
  it("cópia fica na biblioteca do destinatário com atribuição", () => {
    const idA = materials.createMaterial(userA, {
      title: "Original de A",
      description: "",
      type: "nota",
      contentText: "conteúdo",
      url: "",
      subjectId: null,
      tags: [],
    });
    const token = materials.enableShare(userA, idA, "amigos");
    const source = materials.getMaterialByToken(token!) ?? materials.getMaterial(userA, idA)!;
    const copyId = materials.copyMaterial(userB, source);
    const copy = materials.getMaterial(userB, copyId);
    expect(copy).not.toBeNull();
    expect(copy?.user_id).toBe(userB);
    expect(copy?.source_material_id).toBe(idA);
    expect(copy?.origin_note).toContain("alice");
    // O dono da cópia não pode editar o original:
    expect(materials.updateMaterial(userB, idA, { title: "hack" })).toBe(false);
    // E o original continua com o dono A:
    expect(materials.getMaterial(userA, idA)?.title).toBe("Original de A");
  });
});
