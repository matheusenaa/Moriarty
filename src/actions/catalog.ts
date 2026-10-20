"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { todayStr } from "@/lib/dates";
import { createMaterial } from "@/lib/repo/materials";
import { getCollectionWithItems, getItem, setItemProgress, type CatalogProgressState } from "@/lib/repo/catalog";
import { createSubject, createTopic, listSubjects, getActiveGoal } from "@/lib/repo/planning";
import { scheduleReview } from "@/lib/repo/reviews";

function addDaysStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/**
 * Salva uma nota/item do catálogo de sistema como material privado do usuário.
 * Cria uma CÓPIA — não concede acesso a dados de outros usuários nem altera o
 * conteúdo reservado ao sistema. Preserva a origem no texto do material.
 */
export async function saveCatalogItemAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const itemId = String(formData.get("itemId") ?? "");
  const item = getItem(itemId);
  if (!item) return;

  const type =
    item.kind === "flashcard" ? "flashcard" : item.category === "fonte_externa" ? "link" : "nota";
  const originLine =
    item.origin_note ||
    `Fonte: ${item.ref_label || "catálogo de concursos"}. Copiado da biblioteca de concursos do Moriarty.`;

  createMaterial(user.id, {
    title: item.title,
    description: `Do catálogo de concursos (${item.category}).`,
    type,
    contentText: `${item.body}\n\n— ${originLine}`,
    url: item.url,
    subjectId: null,
    tags: ["concursos", "catalogo"],
  });
  revalidatePath("/biblioteca");
  revalidatePath("/arquivo");
}

/** Agenda uma revisão espaçada a partir de um item do catálogo. */
export async function scheduleCatalogItemReviewAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const itemId = String(formData.get("itemId") ?? "");
  const item = getItem(itemId);
  if (!item) return;
  const due = addDaysStr(todayStr(user.timezone), 1);
  scheduleReview(user.id, {
    title: item.title,
    subjectId: null,
    sourceType: "manual",
    sourceId: item.id,
    dueDate: due,
  });
  revalidatePath("/revisoes");
  revalidatePath("/central");
}

/**
 * Importa as matérias (áreas) de uma trilha de concursos como matérias do usuário,
 * vinculadas ao objetivo ativo. Idempotente por nome: não duplica matérias já
 * existentes. Redireciona para /materias ao final.
 */
export async function importCollectionSubjectsAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const slug = String(formData.get("slug") ?? "");
  const data = getCollectionWithItems(slug);
  if (!data) return;

  const goal = getActiveGoal(user.id);
  const existing = new Set(listSubjects(user.id, true).map((s) => s.name.trim().toLowerCase()));
  const areas = data.items.filter((i) => i.kind === "area");
  const notas = data.items.filter((i) => i.kind === "nota");

  const createdSubjectIds: { id: string; name: string }[] = [];
  let priority = 3;
  for (const area of areas) {
    const key = area.title.trim().toLowerCase();
    if (existing.has(key)) continue;
    const id = createSubject(user.id, {
      name: area.title,
      priority: Math.max(1, priority--),
      mastery: 1,
      color: "#c9a227",
      goalId: goal?.id ?? null,
    });
    createdSubjectIds.push({ id, name: area.title });
    existing.add(key);
  }

  // Primeira disciplina da trilha recebe as notas como tópicos de estudo.
  if (createdSubjectIds.length > 0) {
    const first = createdSubjectIds[0];
    for (const n of notas) createTopic(user.id, first.id, n.title);
  }

  revalidatePath("/materias");
  revalidatePath("/plano");
  redirect("/materias");
}

/**
 * Marca/desmarca o progresso pessoal de um item do catálogo (lido/dominado).
 * Não altera o conteúdo de sistema; grava apenas o estado do usuário.
 */
export async function setCatalogItemProgressAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const itemId = String(formData.get("itemId") ?? "");
  const rawState = String(formData.get("state") ?? "");
  const item = getItem(itemId);
  if (!item) return;

  const state: CatalogProgressState | null =
    rawState === "lido" || rawState === "dominado" ? rawState : null;
  setItemProgress(user.id, itemId, state);

  revalidatePath("/biblioteca/concursos");
  revalidatePath(`/biblioteca/concursos/${String(formData.get("slug") ?? "")}`);
}
