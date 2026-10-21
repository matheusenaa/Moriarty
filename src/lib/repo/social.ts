import { execute, nowIso, query, queryOne, uid, withTransaction } from "../db";

export type FriendshipResult = { ok: true } | { ok: false; error: string };

export async function areFriends(a: string, b: string): Promise<boolean> {
  const [x, y] = a < b ? [a, b] : [b, a];
  const row = await queryOne("SELECT 1 FROM friendships WHERE user_a = $1 AND user_b = $2", [x, y]);
  return !!row;
}

export async function listFriendIds(userId: string): Promise<string[]> {
  const rows = await query<{ user_a: string; user_b: string }>(
    "SELECT user_a, user_b FROM friendships WHERE user_a = $1 OR user_b = $1",
    [userId],
  );
  return rows.map((r) => (r.user_a === userId ? r.user_b : r.user_a));
}

export type FriendRow = { id: string; username: string; display_name: string; friends_since: string };

export function listFriends(userId: string): Promise<FriendRow[]> {
  return query<FriendRow>(
    `SELECT CASE WHEN f.user_a = $1 THEN f.user_b ELSE f.user_a END AS id,
            p.username, p.display_name, f.created_at AS friends_since
       FROM friendships f
       JOIN profiles p ON p.user_id = CASE WHEN f.user_a = $1 THEN f.user_b ELSE f.user_a END
      WHERE f.user_a = $1 OR f.user_b = $1
      ORDER BY lower(p.username)`,
    [userId],
  );
}

export async function isBlocked(blocker: string, blocked: string): Promise<boolean> {
  const row = await queryOne("SELECT 1 FROM blocks WHERE blocker = $1 AND blocked = $2", [blocker, blocked]);
  return !!row;
}

export async function anyBlockBetween(a: string, b: string): Promise<boolean> {
  return (await isBlocked(a, b)) || (await isBlocked(b, a));
}

export async function sendFriendRequest(from: string, to: string): Promise<FriendshipResult> {
  if (from === to) return { ok: false, error: "Você não pode enviar solicitação para si mesmo." };
  const target = await queryOne("SELECT 1 FROM profiles WHERE user_id = $1", [to]);
  if (!target) return { ok: false, error: "Usuário não encontrado." };
  if (await anyBlockBetween(from, to)) return { ok: false, error: "Não é possível enviar solicitação a este usuário." };
  if (await areFriends(from, to)) return { ok: false, error: "Vocês já são amigos." };

  const existing = await queryOne<{ id: string; status: string; from_user: string }>(
    `SELECT id, status, from_user FROM friend_requests
      WHERE (from_user = $1 AND to_user = $2) OR (from_user = $2 AND to_user = $1)`,
    [from, to],
  );

  if (existing) {
    if (existing.status === "pendente") {
      if (existing.from_user === from) return { ok: false, error: "Solicitação já enviada. Aguarde a resposta." };
      // Caso raro: solicitação cruzada — aceita automaticamente.
      return decideFriendRequest(from, existing.id, "aceite");
    }
    if (["aceite"].includes(existing.status)) return { ok: false, error: "Vocês já são amigos." };
    await execute("UPDATE friend_requests SET status = 'pendente', created_at = $1, decided_at = NULL WHERE id = $2", [
      nowIso(),
      existing.id,
    ]);
    return { ok: true };
  }

  await execute(
    "INSERT INTO friend_requests (id, from_user, to_user, status, created_at) VALUES ($1, $2, $3, 'pendente', $4)",
    [uid(), from, to, nowIso()],
  );
  return { ok: true };
}

export async function decideFriendRequest(
  toUser: string,
  requestId: string,
  decision: "aceite" | "recusado" | "cancelado",
): Promise<FriendshipResult> {
  const req = await queryOne<{ id: string; from_user: string; to_user: string; status: string }>(
    "SELECT * FROM friend_requests WHERE id = $1 AND status = 'pendente'",
    [requestId],
  );
  if (!req) return { ok: false, error: "Solicitação não encontrada." };
  const isRecipient = req.to_user === toUser;
  const isSender = req.from_user === toUser;
  if (decision === "cancelado" && !isSender) return { ok: false, error: "Apenas quem enviou pode cancelar." };
  if (decision !== "cancelado" && !isRecipient) return { ok: false, error: "Apenas quem recebeu pode responder." };

  await withTransaction(async (client) => {
    await client.query("UPDATE friend_requests SET status = $1, decided_at = $2 WHERE id = $3", [
      decision,
      nowIso(),
      requestId,
    ]);
    if (decision === "aceite") {
      const [a, b] = req.from_user < req.to_user ? [req.from_user, req.to_user] : [req.to_user, req.from_user];
      await client.query(
        "INSERT INTO friendships (user_a, user_b, created_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
        [a, b, nowIso()],
      );
    }
  });
  return { ok: true };
}

export async function removeFriendship(userId: string, otherId: string): Promise<boolean> {
  const [a, b] = userId < otherId ? [userId, otherId] : [otherId, userId];
  return (await execute("DELETE FROM friendships WHERE user_a = $1 AND user_b = $2", [a, b])) > 0;
}

export async function blockUser(blocker: string, blocked: string): Promise<FriendshipResult> {
  if (blocker === blocked) return { ok: false, error: "Não é possível bloquear a si mesmo." };
  const exists = await queryOne("SELECT 1 FROM profiles WHERE user_id = $1", [blocked]);
  if (!exists) return { ok: false, error: "Usuário não encontrado." };
  await withTransaction(async (client) => {
    await client.query("INSERT INTO blocks (blocker, blocked, created_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", [
      blocker,
      blocked,
      nowIso(),
    ]);
    const [a, b] = blocker < blocked ? [blocker, blocked] : [blocked, blocker];
    await client.query("DELETE FROM friendships WHERE user_a = $1 AND user_b = $2", [a, b]);
    await client.query(
      "UPDATE friend_requests SET status = 'recusado', decided_at = $1 WHERE status = 'pendente' AND ((from_user = $2 AND to_user = $3) OR (from_user = $3 AND to_user = $2))",
      [nowIso(), blocker, blocked],
    );
  });
  return { ok: true };
}

export async function unblockUser(blocker: string, blocked: string): Promise<boolean> {
  return (await execute("DELETE FROM blocks WHERE blocker = $1 AND blocked = $2", [blocker, blocked])) > 0;
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

export async function listPendingRequests(
  userId: string,
): Promise<{ received: RequestRow[]; sent: RequestRow[] }> {
  const received = await query<RequestRow>(
    `SELECT r.*, p.username, p.display_name
       FROM friend_requests r JOIN profiles p ON p.user_id = r.from_user
      WHERE r.to_user = $1 AND r.status = 'pendente' ORDER BY r.created_at DESC`,
    [userId],
  );
  const sent = await query<RequestRow>(
    `SELECT r.*, p.username, p.display_name
       FROM friend_requests r JOIN profiles p ON p.user_id = r.to_user
      WHERE r.from_user = $1 AND r.status = 'pendente' ORDER BY r.created_at DESC`,
    [userId],
  );
  return { received, sent };
}

export function listBlocks(userId: string): Promise<{ id: string; username: string; display_name: string }[]> {
  return query<{ id: string; username: string; display_name: string }>(
    `SELECT b.blocked AS id, p.username, p.display_name
       FROM blocks b JOIN profiles p ON p.user_id = b.blocked
      WHERE b.blocker = $1 ORDER BY lower(p.username)`,
    [userId],
  );
}

export function searchUsers(
  by: string,
  queryText: string,
  limit = 20,
): Promise<{ id: string; username: string; display_name: string }[]> {
  const like = `%${queryText.trim()}%`;
  return query<{ id: string; username: string; display_name: string }>(
    `SELECT u.id, p.username, p.display_name
       FROM profiles p JOIN users u ON u.id = p.user_id
      WHERE u.deleted_at IS NULL AND p.user_id != $1 AND (p.username ILIKE $2 OR p.display_name ILIKE $2)
      ORDER BY lower(p.username) LIMIT $3`,
    [by, like, limit],
  );
}
