import { randomBytes } from "crypto";
import { getDb, nowIso, uid } from "../db";

export type MaterialRow = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  type: string;
  content_text: string;
  url: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  subject_id: string | null;
  visibility: string;
  share_token: string | null;
  share_enabled: number;
  favorite: number;
  archived: number;
  source_material_id: string | null;
  source_user_id: string | null;
  origin_note: string;
  ai_generated: number;
  created_at: string;
  updated_at: string;
  author_username?: string;
  author_display?: string;
  tags?: string;
};

export type MaterialInput = {
  title: string;
  description: string;
  type: "nota" | "link" | "arquivo" | "flashcard";
  contentText: string;
  url: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  subjectId: string | null;
  tags: string[];
  aiGenerated?: boolean;
};

export function createMaterial(userId: string, input: MaterialInput): string {
  const db = getDb();
  const id = uid();
  const now = nowIso();
  db.transaction(() => {
    db.prepare(
      `INSERT INTO materials (id, user_id, title, description, type, content_text, url, file_path, file_size, mime_type, subject_id, visibility, created_at, updated_at, ai_generated)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'privado', ?, ?, ?)`,
    ).run(
      id,
      userId,
      input.title,
      input.description,
      input.type,
      input.contentText,
      input.url,
      input.filePath ?? "",
      input.fileSize ?? 0,
      input.mimeType ?? "",
      input.subjectId,
      now,
      now,
      input.aiGenerated ? 1 : 0,
    );
    const tagStmt = db.prepare("INSERT OR IGNORE INTO material_tags (material_id, user_id, tag) VALUES (?, ?, ?)");
    for (const t of normalizeTags(input.tags)) tagStmt.run(id, userId, t);
  })();
  return id;
}

export function normalizeTags(tags: string[]): string[] {
  const out: string[] = [];
  for (const raw of tags) {
    const t = raw.trim().toLowerCase();
    if (t.length === 0 || t.length > 30) continue;
    if (!out.includes(t)) out.push(t);
  }
  return out.slice(0, 12);
}

export function getMaterial(userId: string, id: string): MaterialRow | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT m.*, p.username AS author_username, p.display_name AS author_display,
              (SELECT group_concat(tag, ', ') FROM material_tags t WHERE t.material_id = m.id) AS tags
         FROM materials m
         LEFT JOIN profiles p ON p.user_id = m.user_id
        WHERE m.id = ? AND m.user_id = ?`,
    )
    .get(id, userId) as MaterialRow | undefined;
  return row ?? null;
}

export function getMaterialByToken(token: string): MaterialRow | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT m.*, p.username AS author_username, p.display_name AS author_display
         FROM materials m LEFT JOIN profiles p ON p.user_id = m.user_id
        WHERE m.share_token = ? AND m.share_enabled = 1 AND m.visibility IN ('link','publico')`,
    )
    .get(token) as MaterialRow | undefined;
  return row ?? null;
}

export function listMaterials(
  userId: string,
  filters: { search?: string; tag?: string; subjectId?: string; includeArchived?: boolean; favoritesOnly?: boolean } = {},
): MaterialRow[] {
  const db = getDb();
  const clauses = ["m.user_id = ?"];
  const params: unknown[] = [userId];
  if (!filters.includeArchived) clauses.push("m.archived = 0");
  if (filters.favoritesOnly) clauses.push("m.favorite = 1");
  if (filters.search) {
    clauses.push("(m.title LIKE ? OR m.description LIKE ? OR m.content_text LIKE ?)");
    const like = `%${filters.search}%`;
    params.push(like, like, like);
  }
  if (filters.subjectId) {
    clauses.push("m.subject_id = ?");
    params.push(filters.subjectId);
  }
  if (filters.tag) {
    clauses.push("EXISTS (SELECT 1 FROM material_tags t WHERE t.material_id = m.id AND t.tag = ?)");
    params.push(filters.tag.trim().toLowerCase());
  }
  return db
    .prepare(
      `SELECT m.*, (SELECT group_concat(tag, ', ') FROM material_tags t WHERE t.material_id = m.id) AS tags
         FROM materials m WHERE ${clauses.join(" AND ")}
        ORDER BY m.updated_at DESC LIMIT 200`,
    )
    .all(...params) as MaterialRow[];
}

export function updateMaterial(userId: string, id: string, patch: Partial<MaterialInput> & { visibility?: string; shareEnabled?: boolean; favorite?: boolean; archived?: boolean }): boolean {
  const current = getMaterial(userId, id);
  if (!current) return false;
  const db = getDb();
  db.transaction(() => {
    db.prepare(
      `UPDATE materials SET title = ?, description = ?, content_text = ?, url = ?, subject_id = ?,
        visibility = ?, share_enabled = ?, favorite = ?, archived = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
    ).run(
      patch.title ?? current.title,
      patch.description ?? current.description,
      patch.contentText ?? current.content_text,
      patch.url ?? current.url,
      patch.subjectId !== undefined ? patch.subjectId : current.subject_id,
      patch.visibility ?? current.visibility,
      (patch.shareEnabled ?? current.share_enabled === 1) ? 1 : 0,
      (patch.favorite ?? current.favorite === 1) ? 1 : 0,
      (patch.archived ?? current.archived === 1) ? 1 : 0,
      nowIso(),
      id,
      userId,
    );
    if (patch.tags) {
      db.prepare("DELETE FROM material_tags WHERE material_id = ?").run(id);
      const tagStmt = db.prepare("INSERT OR IGNORE INTO material_tags (material_id, user_id, tag) VALUES (?, ?, ?)");
      for (const t of normalizeTags(patch.tags)) tagStmt.run(id, userId, t);
    }
  })();
  return true;
}

export function deleteMaterial(userId: string, id: string): boolean {
  return getDb().prepare("DELETE FROM materials WHERE id = ? AND user_id = ?").run(id, userId).changes > 0;
}

/** Gera/atualiza token de compartilhamento e habilita o link. */
export function enableShare(userId: string, id: string, visibility: "amigos" | "link" | "publico"): string | null {
  const current = getMaterial(userId, id);
  if (!current) return null;
  const token = current.share_token ?? randomBytes(24).toString("hex");
  getDb()
    .prepare("UPDATE materials SET share_token = ?, share_enabled = 1, visibility = ?, updated_at = ? WHERE id = ? AND user_id = ?")
    .run(token, visibility, nowIso(), id, userId);
  return token;
}

export function revokeShare(userId: string, id: string): boolean {
  const current = getMaterial(userId, id);
  if (!current) return false;
  getDb()
    .prepare("UPDATE materials SET share_enabled = 0, visibility = 'privado', updated_at = ? WHERE id = ? AND user_id = ?")
    .run(nowIso(), id, userId);
  return true;
}

/** Materiais de amigos (amizade aceita) com visibilidade 'amigos' ou 'publico'. */
export function listFriendMaterials(userId: string, friendIds: string[]): MaterialRow[] {
  if (friendIds.length === 0) return [];
  const db = getDb();
  const placeholders = friendIds.map(() => "?").join(",");
  return db
    .prepare(
      `SELECT m.*, p.username AS author_username, p.display_name AS author_display,
              (SELECT group_concat(tag, ', ') FROM material_tags t WHERE t.material_id = m.id) AS tags
         FROM materials m JOIN profiles p ON p.user_id = m.user_id
        WHERE m.user_id IN (${placeholders})
          AND m.archived = 0
          AND (m.visibility = 'amigos' OR m.visibility = 'publico')
        ORDER BY m.updated_at DESC LIMIT 200`,
    )
    .all(...friendIds) as MaterialRow[];
}

export function listPublicMaterials(query?: string): MaterialRow[] {
  const db = getDb();
  if (query) {
    const like = `%${query}%`;
    return db
      .prepare(
        `SELECT m.*, p.username AS author_username, p.display_name AS author_display
           FROM materials m JOIN profiles p ON p.user_id = m.user_id
          WHERE m.visibility = 'publico' AND m.archived = 0 AND (m.title LIKE ? OR m.description LIKE ?)
          ORDER BY m.updated_at DESC LIMIT 50`,
      )
      .all(like, like) as MaterialRow[];
  }
  return db
    .prepare(
      `SELECT m.*, p.username AS author_username, p.display_name AS author_display
         FROM materials m JOIN profiles p ON p.user_id = m.user_id
        WHERE m.visibility = 'publico' AND m.archived = 0
        ORDER BY m.updated_at DESC LIMIT 50`,
    )
    .all() as MaterialRow[];
}

/** Cópia para a biblioteca do destinatário, preservando autoria/origem. Sem edição do original. */
export function copyMaterial(targetUserId: string, source: MaterialRow): string {
  const db = getDb();
  const id = uid();
  const now = nowIso();
  db.transaction(() => {
    db.prepare(
      `INSERT INTO materials (id, user_id, title, description, type, content_text, url, file_path, file_size, mime_type,
        subject_id, visibility, share_enabled, source_material_id, source_user_id, origin_note, ai_generated, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'privado', 0, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      targetUserId,
      source.title,
      source.description,
      source.type,
      source.content_text,
      source.url,
      source.file_path,
      source.file_size,
      source.mime_type,
      source.id,
      source.user_id,
      `Cópia de material de @${source.author_username ?? "desconhecido"}`,
      source.ai_generated,
      now,
      now,
    );
  })();
  return id;
}

export function countMaterials(userId: string): number {
  return (
    getDb().prepare("SELECT COUNT(*) c FROM materials WHERE user_id = ? AND archived = 0").get(userId) as {
      c: number;
    }
  ).c;
}
