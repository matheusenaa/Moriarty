import { getDb, nowIso, uid } from "../db";

export type FriendshipResult = { ok: true } | { ok: false; error: string };

export function areFriends(a: string, b: string): boolean {
  const [x, y] = a < b ? [a, b] : [b, a];
  return !!getDb().prepare("SELECT 1 FROM friendships WHERE user_a = ? AND user_b = ?").get(x, y);
}

export function listFriendIds(userId: string): string[] {
  const rows = getDb()
    .prepare("SELECT user_a, user_b FROM friendships WHERE user_a = ? OR user_b = ?")
    .all(userId, userId) as { user_a: string; user_b: string }[];
  return rows.map((r) => (r.user_a === userId ? r.user_b : r.user_a));
}

export type FriendRow = { id: string; username: string; display_name: string; friends_since: string };

export function listFriends(userId: string): FriendRow[] {
  return getDb()
    .prepare(
      `SELECT CASE WHEN f.user_a = ? THEN f.user_b ELSE f.user_a END AS id,
              p.username, p.display_name, f.created_at AS friends_since
         FROM friendships f
         JOIN profiles p ON p.user_id = CASE WHEN f.user_a = ? THEN f.user_b ELSE f.user_a END
        WHERE f.user_a = ? OR f.user_b = ?
        ORDER BY p.username COLLATE NOCASE`,
    )
    .all(userId, userId, userId, userId) as FriendRow[];
}

export function isBlocked(blocker: string, blocked: string): boolean {
  return !!getDb().prepare("SELECT 1 FROM blocks WHERE blocker = ? AND blocked = ?").get(blocker, blocked);
}

export function anyBlockBetween(a: string, b: string): boolean {
  return isBlocked(a, b) || isBlocked(b, a);
}

export function sendFriendRequest(from: string, to: string): FriendshipResult {
  if (from === to) return { ok: false, error: "Você não pode enviar solicitação para si mesmo." };
  const db = getDb();
  const target = db
    .prepare("SELECT 1 FROM profiles WHERE user_id = ?")
    .get(to);
  if (!target) return { ok: false, error: "Usuário não encontrado." };
  if (anyBlockBetween(from, to)) return { ok: false, error: "Não é possível enviar solicitação a este usuário." };
  if (areFriends(from, to)) return { ok: false, error: "Vocês já são amigos." };

  const existing = db
    .prepare(
      `SELECT id, status, from_user FROM friend_requests
        WHERE (from_user = ? AND to_user = ?) OR (from_user = ? AND to_user = ?)`,
    )
    .get(from, to, to, from) as { id: string; status: string; from_user: string } | undefined;

  if (existing) {
    if (existing.status === "pendente") {
      if (existing.from_user === from) return { ok: false, error: "Solicitação já enviada. Aguarde a resposta." };
      // Caso raro: solicitação cruzada — aceita automaticamente.
      return decideFriendRequest(from, existing.id, "aceite");
    }
    if (["aceite"].includes(existing.status)) return { ok: false, error: "Vocês já são amigos." };
    db.prepare("UPDATE friend_requests SET status = 'pendente', created_at = ?, decided_at = NULL WHERE id = ?").run(
      nowIso(),
      existing.id,
    );
    return { ok: true };
  }

  db.prepare(
    "INSERT INTO friend_requests (id, from_user, to_user, status, created_at) VALUES (?, ?, ?, 'pendente', ?)",
  ).run(uid(), from, to, nowIso());
  return { ok: true };
}

export function decideFriendRequest(toUser: string, requestId: string, decision: "aceite" | "recusado" | "cancelado"): FriendshipResult {
  const db = getDb();
  const req = db
    .prepare("SELECT * FROM friend_requests WHERE id = ? AND status = 'pendente'")
    .get(requestId) as
    | { id: string; from_user: string; to_user: string; status: string }
    | undefined;
  if (!req) return { ok: false, error: "Solicitação não encontrada." };
  const isRecipient = req.to_user === toUser;
  const isSender = req.from_user === toUser;
  if (decision === "cancelado" && !isSender) return { ok: false, error: "Apenas quem enviou pode cancelar." };
  if (decision !== "cancelado" && !isRecipient) return { ok: false, error: "Apenas quem recebeu pode responder." };

  db.transaction(() => {
    db.prepare("UPDATE friend_requests SET status = ?, decided_at = ? WHERE id = ?").run(decision, nowIso(), requestId);
    if (decision === "aceite") {
      const [a, b] = req.from_user < req.to_user ? [req.from_user, req.to_user] : [req.to_user, req.from_user];
      db.prepare("INSERT OR IGNORE INTO friendships (user_a, user_b, created_at) VALUES (?, ?, ?)").run(a, b, nowIso());
    }
  })();
  return { ok: true };
}

export function removeFriendship(userId: string, otherId: string): boolean {
  const [a, b] = userId < otherId ? [userId, otherId] : [otherId, userId];
  return getDb().prepare("DELETE FROM friendships WHERE user_a = ? AND user_b = ?").run(a, b).changes > 0;
}

export function blockUser(blocker: string, blocked: string): FriendshipResult {
  if (blocker === blocked) return { ok: false, error: "Não é possível bloquear a si mesmo." };
  const db = getDb();
  const exists = db.prepare("SELECT 1 FROM profiles WHERE user_id = ?").get(blocked);
  if (!exists) return { ok: false, error: "Usuário não encontrado." };
  db.transaction(() => {
    db.prepare("INSERT OR IGNORE INTO blocks (blocker, blocked, created_at) VALUES (?, ?, ?)").run(blocker, blocked, nowIso());
    const [a, b] = blocker < blocked ? [blocker, blocked] : [blocked, blocker];
    db.prepare("DELETE FROM friendships WHERE user_a = ? AND user_b = ?").run(a, b);
    db.prepare(
      "UPDATE friend_requests SET status = 'recusado', decided_at = ? WHERE status = 'pendente' AND ((from_user = ? AND to_user = ?) OR (from_user = ? AND to_user = ?))",
    ).run(nowIso(), blocker, blocked, blocked, blocker);
  })();
  return { ok: true };
}

export function unblockUser(blocker: string, blocked: string): boolean {
  return getDb().prepare("DELETE FROM blocks WHERE blocker = ? AND blocked = ?").run(blocker, blocked).changes > 0;
}

export type RequestRow = {
  id: string;
  from_user: string;
  to_user: string;
  status: string;
  created_at: string;
  username: string;
  display_name: string;
};

export function listPendingRequests(userId: string): { received: RequestRow[]; sent: RequestRow[] } {
  const db = getDb();
  const received = db
    .prepare(
      `SELECT r.*, p.username, p.display_name
         FROM friend_requests r JOIN profiles p ON p.user_id = r.from_user
        WHERE r.to_user = ? AND r.status = 'pendente' ORDER BY r.created_at DESC`,
    )
    .all(userId) as RequestRow[];
  const sent = db
    .prepare(
      `SELECT r.*, p.username, p.display_name
         FROM friend_requests r JOIN profiles p ON p.user_id = r.to_user
        WHERE r.from_user = ? AND r.status = 'pendente' ORDER BY r.created_at DESC`,
    )
    .all(userId) as RequestRow[];
  return { received, sent };
}

export function listBlocks(userId: string): { id: string; username: string; display_name: string }[] {
  return getDb()
    .prepare(
      `SELECT b.blocked AS id, p.username, p.display_name
         FROM blocks b JOIN profiles p ON p.user_id = b.blocked
        WHERE b.blocker = ? ORDER BY p.username`,
    )
    .all(userId) as { id: string; username: string; display_name: string }[];
}

export function searchUsers(by: string, query: string, limit = 20): { id: string; username: string; display_name: string }[] {
  const like = `%${query.trim()}%`;
  return getDb()
    .prepare(
      `SELECT u.id, p.username, p.display_name
         FROM profiles p JOIN users u ON u.id = p.user_id
        WHERE u.deleted_at IS NULL AND p.user_id != ? AND (p.username LIKE ? OR p.display_name LIKE ?)
        ORDER BY p.username COLLATE NOCASE LIMIT ?`,
    )
    .all(by, like, like, limit) as { id: string; username: string; display_name: string }[];
}
