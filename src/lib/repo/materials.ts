import { randomBytes } from "crypto";
import { execute, nowIso, query, queryOne, uid, withTransaction } from "../db";

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

export async function createMaterial(userId: string, input: MaterialInput): Promise<string> {
  const id = uid();
  const now = nowIso();
  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO materials (id, user_id, title, description, type, content_text, url, file_path, file_size, mime_type, subject_id, visibility, created_at, updated_at, ai_generated)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'privado', $12, $13, $14)`,
      [
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
      ],
    );
    for (const t of normalizeTags(input.tags)) {
      await client.query(
        "INSERT INTO material_tags (material_id, user_id, tag) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
        [id, userId, t],
      );
    }
  });
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

export function getMaterial(userId: string, id: string): Promise<MaterialRow | null> {
  return queryOne<MaterialRow>(
    `SELECT m.*, p.username AS author_username, p.display_name AS author_display,
            (SELECT string_agg(tag, ', ') FROM material_tags t WHERE t.material_id = m.id) AS tags
       FROM materials m
       LEFT JOIN profiles p ON p.user_id = m.user_id
      WHERE m.id = $1 AND m.user_id = $2`,
    [id, userId],
  );
}

export function getMaterialByToken(token: string): Promise<MaterialRow | null> {
  return queryOne<MaterialRow>(
    `SELECT m.*, p.username AS author_username, p.display_name AS author_display
       FROM materials m LEFT JOIN profiles p ON p.user_id = m.user_id
      WHERE m.share_token = $1 AND m.share_enabled = 1 AND m.visibility IN ('link','publico')`,
    [token],
  );
}

export function listMaterials(
  userId: string,
  filters: { search?: string; tag?: string; subjectId?: string; includeArchived?: boolean; favoritesOnly?: boolean } = {},
): Promise<MaterialRow[]> {
  const clauses = ["m.user_id = $1"];
  const params: unknown[] = [userId];
  let idx = 2;
  if (!filters.includeArchived) clauses.push("m.archived = 0");
  if (filters.favoritesOnly) clauses.push("m.favorite = 1");
  if (filters.search) {
    clauses.push(`(m.title ILIKE $${idx} OR m.description ILIKE $${idx} OR m.content_text ILIKE $${idx})`);
    params.push(`%${filters.search}%`);
    idx++;
  }
  if (filters.subjectId) {
    clauses.push(`m.subject_id = $${idx}`);
    params.push(filters.subjectId);
    idx++;
  }
  if (filters.tag) {
    clauses.push(`EXISTS (SELECT 1 FROM material_tags t WHERE t.material_id = m.id AND t.tag = $${idx})`);
    params.push(filters.tag.trim().toLowerCase());
    idx++;
  }
  return query<MaterialRow>(
    `SELECT m.*, (SELECT string_agg(tag, ', ') FROM material_tags t WHERE t.material_id = m.id) AS tags
       FROM materials m WHERE ${clauses.join(" AND ")}
      ORDER BY m.updated_at DESC LIMIT 200`,
    params,
  );
}

export async function updateMaterial(
  userId: string,
  id: string,
  patch: Partial<MaterialInput> & { visibility?: string; shareEnabled?: boolean; favorite?: boolean; archived?: boolean },
): Promise<boolean> {
  const current = await getMaterial(userId, id);
  if (!current) return false;
  await withTransaction(async (client) => {
    await client.query(
      `UPDATE materials SET title = $1, description = $2, content_text = $3, url = $4, subject_id = $5,
        visibility = $6, share_enabled = $7, favorite = $8, archived = $9, updated_at = $10
       WHERE id = $11 AND user_id = $12`,
      [
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
      ],
    );
    if (patch.tags) {
      await client.query("DELETE FROM material_tags WHERE material_id = $1", [id]);
      for (const t of normalizeTags(patch.tags)) {
        await client.query(
          "INSERT INTO material_tags (material_id, user_id, tag) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
          [id, userId, t],
        );
      }
    }
  });
  return true;
}

export async function deleteMaterial(userId: string, id: string): Promise<boolean> {
  return (await execute("DELETE FROM materials WHERE id = $1 AND user_id = $2", [id, userId])) > 0;
}

/** Gera/atualiza token de compartilhamento e habilita o link. */
export async function enableShare(
  userId: string,
  id: string,
  visibility: "amigos" | "link" | "publico",
): Promise<string | null> {
  const current = await getMaterial(userId, id);
  if (!current) return null;
  const token = current.share_token ?? randomBytes(24).toString("hex");
  await execute(
    "UPDATE materials SET share_token = $1, share_enabled = 1, visibility = $2, updated_at = $3 WHERE id = $4 AND user_id = $5",
    [token, visibility, nowIso(), id, userId],
  );
  return token;
}

export async function revokeShare(userId: string, id: string): Promise<boolean> {
  const current = await getMaterial(userId, id);
  if (!current) return false;
  await execute(
    "UPDATE materials SET share_enabled = 0, visibility = 'privado', updated_at = $1 WHERE id = $2 AND user_id = $3",
    [nowIso(), id, userId],
  );
  return true;
}

/** Materiais de amigos (amizade aceita) com visibilidade 'amigos' ou 'publico'. */
export function listFriendMaterials(userId: string, friendIds: string[]): Promise<MaterialRow[]> {
  if (friendIds.length === 0) return Promise.resolve([]);
  const placeholders = friendIds.map((_, i) => `$${i + 1}`).join(",");
  return query<MaterialRow>(
    `SELECT m.*, p.username AS author_username, p.display_name AS author_display,
            (SELECT string_agg(tag, ', ') FROM material_tags t WHERE t.material_id = m.id) AS tags
       FROM materials m JOIN profiles p ON p.user_id = m.user_id
      WHERE m.user_id IN (${placeholders})
        AND m.archived = 0
        AND (m.visibility = 'amigos' OR m.visibility = 'publico')
      ORDER BY m.updated_at DESC LIMIT 200`,
    friendIds,
  );
}

export function listPublicMaterials(queryText?: string): Promise<MaterialRow[]> {
  if (queryText) {
    const like = `%${queryText}%`;
    return query<MaterialRow>(
      `SELECT m.*, p.username AS author_username, p.display_name AS author_display
         FROM materials m JOIN profiles p ON p.user_id = m.user_id
        WHERE m.visibility = 'publico' AND m.archived = 0 AND (m.title ILIKE $1 OR m.description ILIKE $1)
        ORDER BY m.updated_at DESC LIMIT 50`,
      [like],
    );
  }
  return query<MaterialRow>(
    `SELECT m.*, p.username AS author_username, p.display_name AS author_display
       FROM materials m JOIN profiles p ON p.user_id = m.user_id
      WHERE m.visibility = 'publico' AND m.archived = 0
      ORDER BY m.updated_at DESC LIMIT 50`,
  );
}

/** Cópia para a biblioteca do destinatário, preservando autoria/origem. Sem edição do original. */
export async function copyMaterial(targetUserId: string, source: MaterialRow): Promise<string> {
  const id = uid();
  const now = nowIso();
  await execute(
    `INSERT INTO materials (id, user_id, title, description, type, content_text, url, file_path, file_size, mime_type,
      subject_id, visibility, share_enabled, source_material_id, source_user_id, origin_note, ai_generated, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NULL, 'privado', 0, $11, $12, $13, $14, $15, $16)`,
    [
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
    ],
  );
  return id;
}

/** Índice leve (sem conteúdo nem arquivos) para o contexto do tutor de IA. */
export function listMaterialIndex(
  userId: string,
  limit = 40,
): Promise<{ id: string; title: string; type: string; subject_id: string | null }[]> {
  return query<{ id: string; title: string; type: string; subject_id: string | null }>(
    `SELECT id, title, type, subject_id FROM materials
      WHERE user_id = $1 AND archived = 0
      ORDER BY updated_at DESC LIMIT $2`,
    [userId, Math.min(Math.max(limit, 1), 100)],
  );
}

export async function countMaterials(userId: string): Promise<number> {
  const row = await queryOne<{ c: string }>(
    "SELECT COUNT(*) c FROM materials WHERE user_id = $1 AND archived = 0",
    [userId],
  );
  return Number(row?.c ?? 0);
}
