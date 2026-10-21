"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { requireUser } from "@/lib/auth";
import { todayStr } from "@/lib/dates";
import {
  copyMaterial,
  createMaterial,
  deleteMaterial,
  enableShare,
  getMaterial,
  listFriendMaterials,
  listPublicMaterials,
  revokeShare,
  updateMaterial,
  type MaterialRow,
} from "@/lib/repo/materials";
import { areFriends, listFriendIds } from "@/lib/repo/social";
import { scheduleReview } from "@/lib/repo/reviews";
import { awardXp, checkCountAchievements } from "@/lib/repo/gamification";
import type { ActionState } from "./auth";
export type { ActionState };

const ALLOWED_MIME = new Map<string, string>([
  ["application/pdf", ".pdf"],
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
  ["image/webp", ".webp"],
  ["text/plain", ".txt"],
  ["text/markdown", ".md"],
]);
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

const materialSchema = z.object({
  title: z.string().min(2, "Informe o título.").max(160),
  description: z.string().max(1000).optional().default(""),
  type: z.enum(["nota", "link", "arquivo", "flashcard"]),
  contentText: z.string().max(100000).optional().default(""),
  url: z.string().url("URL inválida.").or(z.literal("")).optional().default(""),
  subjectId: z.string().optional().default(""),
  tags: z.string().max(300).optional().default(""),
  aiGenerated: z.coerce.boolean().optional().default(false),
});

export async function saveMaterialAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const type = String(formData.get("type") ?? "nota") as "nota" | "link" | "arquivo" | "flashcard";
  const parsed = materialSchema.safeParse({
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    type,
    contentText: String(formData.get("contentText") ?? ""),
    url: String(formData.get("url") ?? "").trim(),
    subjectId: String(formData.get("subjectId") ?? ""),
    tags: String(formData.get("tags") ?? ""),
    aiGenerated: formData.get("aiGenerated") === "on" || formData.get("aiGenerated") === "true",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  let filePath = "";
  let fileSize = 0;
  let mimeType = "";
  const file = formData.get("file");
  if (type === "arquivo" && file instanceof File && file.size > 0) {
    const mime = file.type;
    if (!ALLOWED_MIME.has(mime)) {
      return { ok: false, error: "Tipo de arquivo não permitido. Use PDF, PNG, JPG, WEBP, TXT ou MD." };
    }
    if (file.size > MAX_FILE_BYTES) {
      return { ok: false, error: "Arquivo excede o limite de 10 MB." };
    }
    const ext = ALLOWED_MIME.get(mime)!;
    const dir = path.join(process.cwd(), "uploads", user.id);
    await mkdir(dir, { recursive: true });
    const name = `${randomBytes(16).toString("hex")}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, name), buffer);
    filePath = path.join(user.id, name);
    fileSize = file.size;
    mimeType = mime;
  }

  const tags = parsed.data.tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const id = await createMaterial(user.id, {
    title: parsed.data.title,
    description: parsed.data.description ?? "",
    type,
    contentText: parsed.data.contentText ?? "",
    url: parsed.data.url ?? "",
    filePath,
    fileSize,
    mimeType,
    subjectId: parsed.data.subjectId || null,
    tags,
    aiGenerated: parsed.data.aiGenerated,
  });
  const granted = await awardXp(user.id, "material_criado", "materials", id);
  await checkCountAchievements(user.id);
  revalidatePath("/biblioteca");
  revalidatePath("/central");
  return { ok: true, message: `Material salvo.${granted > 0 ? ` +${granted} XP.` : ""}`, data: { id } };
}

export async function updateMaterialAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const parsed = materialSchema.safeParse({
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    type: String(formData.get("type") ?? "nota"),
    contentText: String(formData.get("contentText") ?? ""),
    url: String(formData.get("url") ?? "").trim(),
    subjectId: String(formData.get("subjectId") ?? ""),
    tags: String(formData.get("tags") ?? ""),
    aiGenerated: false,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const ok = await updateMaterial(user.id, id, {
    title: parsed.data.title,
    description: parsed.data.description ?? "",
    contentText: parsed.data.contentText ?? "",
    url: parsed.data.url ?? "",
    subjectId: parsed.data.subjectId || null,
    tags: parsed.data.tags.split(",").map((t) => t.trim()).filter(Boolean),
  });
  if (!ok) return { ok: false, error: "Material não encontrado." };
  revalidatePath("/biblioteca");
  return { ok: true, message: "Material atualizado." };
}

export async function toggleFavoriteAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const material = await getMaterial(user.id, id);
  if (!material) return;
  await updateMaterial(user.id, id, { favorite: material.favorite !== 1 });
  revalidatePath("/biblioteca");
}

export async function archiveMaterialAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  await updateMaterial(user.id, String(formData.get("id") ?? ""), { archived: true });
  revalidatePath("/biblioteca");
}

export async function deleteMaterialAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  await deleteMaterial(user.id, String(formData.get("id") ?? ""));
  revalidatePath("/biblioteca");
}

export async function duplicateMaterialAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const material = await getMaterial(user.id, id);
  if (!material) return;
  await createMaterial(user.id, {
    title: `${material.title} (cópia)`,
    description: material.description,
    type: material.type as "nota" | "link" | "arquivo" | "flashcard",
    contentText: material.content_text,
    url: material.url,
    filePath: material.file_path,
    fileSize: material.file_size,
    mimeType: material.mime_type,
    subjectId: material.subject_id,
    tags: (material.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean),
  });
  revalidatePath("/biblioteca");
}

export async function setVisibilityAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const visibility = String(formData.get("visibility") ?? "privado");
  const material = await getMaterial(user.id, id);
  if (!material) return { ok: false, error: "Material não encontrado." };
  if (visibility === "privado") {
    await revokeShare(user.id, id);
    revalidatePath("/biblioteca");
    return { ok: true, message: "Material voltou a ser privado." };
  }
  if (!["amigos", "link", "publico"].includes(visibility)) {
    return { ok: false, error: "Visibilidade inválida." };
  }
  const token = await enableShare(user.id, id, visibility as "amigos" | "link" | "publico");
  revalidatePath("/biblioteca");
  return {
    ok: true,
    message: "Visibilidade atualizada. O compartilhamento exige login de quem acessa (exceto material público).",
    data: { token },
  };
}

export async function revokeShareAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  await revokeShare(user.id, String(formData.get("id") ?? ""));
  revalidatePath("/biblioteca");
}

export async function scheduleMaterialReviewAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const material = await getMaterial(user.id, id);
  if (!material) return;
  const due = addDaysStr(todayStr(user.timezone), 1);
  await scheduleReview(user.id, {
    title: material.title,
    subjectId: material.subject_id,
    sourceType: "material",
    sourceId: material.id,
    dueDate: due,
  });
  revalidatePath("/revisoes");
}

function addDaysStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Abre arquivo privado: só o dono autenticado acessa; nunca há URL pública permanente. */
export async function openOwnedFile(userId: string, materialId: string): Promise<{ path: string; name: string } | null> {
  const material = await getMaterial(userId, materialId);
  if (!material || !material.file_path) return null;
  return { path: material.file_path, name: material.title };
}

export type AccessCheck =
  | { kind: "owner"; material: MaterialRow }
  | { kind: "friend"; material: MaterialRow }
  | { kind: "token"; material: MaterialRow }
  | { kind: "public"; material: MaterialRow }
  | { kind: "denied"; reason: string };

/** Regra central de acesso a materiais compartilhados. */
export async function checkMaterialAccess(viewerId: string, materialId: string, token?: string): Promise<AccessCheck> {
  const own = await getMaterial(viewerId, materialId);
  if (own) return { kind: "owner", material: own };

  const { queryOne } = await import("@/lib/db");
  const row = await queryOne<MaterialRow>(
    `SELECT m.*, p.username AS author_username, p.display_name AS author_display
       FROM materials m LEFT JOIN profiles p ON p.user_id = m.user_id WHERE m.id = $1`,
    [materialId],
  );
  if (!row) return { kind: "denied", reason: "Material não encontrado." };

  if (row.visibility === "publico" && row.archived === 0) return { kind: "public", material: row };
  if (row.visibility === "amigos" && (await areFriends(viewerId, row.user_id))) return { kind: "friend", material: row };
  if (
    row.visibility === "link" &&
    row.share_enabled === 1 &&
    token &&
    row.share_token === token
  ) {
    return { kind: "token", material: row };
  }
  return { kind: "denied", reason: "Sem permissão para acessar este material." };
}

export async function copySharedMaterialAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const token = String(formData.get("token") ?? "") || undefined;
  const access = await checkMaterialAccess(user.id, id, token);
  if (access.kind === "denied" || access.kind === "owner") return;
  await copyMaterial(user.id, access.material);
  revalidatePath("/arquivo");
  revalidatePath("/biblioteca");
}

export async function searchPublicMaterials(query?: string): Promise<MaterialRow[]> {
  return listPublicMaterials(query);
}

export async function sharedWithMeMaterials(userId: string): Promise<MaterialRow[]> {
  const friends = await listFriendIds(userId);
  return listFriendMaterials(userId, friends);
}
