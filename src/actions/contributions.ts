"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ehAdmin } from "@/lib/admin";
import {
  normalizarContribuicao,
  validarContribuicao,
  tipoContribuicao,
} from "@/lib/contributions";
import {
  createContribution,
  listUserContributions,
  listPendingContributions,
  reviewContribution,
  type ContentContributionRow,
} from "@/lib/repo/contributions";
import { getCollectionBySlug } from "@/lib/repo/catalog";

import type { ActionState } from "./auth";

/** Sugere conteúdo para uma trilha (usuário autenticado). */
export async function createContributionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const collectionSlug = String(formData.get("collectionSlug") ?? "");
  const kind = String(formData.get("kind") ?? "") as "nota" | "questao" | "flashcard";
  const title = String(formData.get("title") ?? "");
  const body = String(formData.get("body") ?? "");
  const optionsRaw = String(formData.get("options") ?? "");
  const correctIndexRaw = String(formData.get("correctIndex") ?? "");
  const explanation = String(formData.get("explanation") ?? "");
  const sourceUrl = String(formData.get("sourceUrl") ?? "");
  const sourceLabel = String(formData.get("sourceLabel") ?? "");

  const options = optionsRaw
    .split(/\r?\n/)
    .map((o) => o.trim())
    .filter((o) => o.length > 0);

  const correctIndex =
    correctIndexRaw === "" ? null : parseInt(correctIndexRaw, 10) - 1; // form usa 1-based

  const entrada = normalizarContribuicao({
    collectionSlug,
    kind,
    title,
    body,
    options,
    correctIndex,
    explanation,
    sourceUrl,
    sourceLabel,
  });

  const erros = validarContribuicao(entrada);
  if (erros.length > 0) return { ok: false, error: erros.join(" | ") };

  // Verifica se a trilha existe
  const col = await getCollectionBySlug(entrada.collectionSlug);
  if (!col) return { ok: false, error: "Trilha não encontrada." };

  await createContribution(user.id, {
    collectionSlug: entrada.collectionSlug,
    kind: entrada.kind,
    title: entrada.title,
    body: entrada.body,
    options: entrada.options,
    correctIndex: entrada.correctIndex,
    explanation: entrada.explanation,
    sourceUrl: entrada.sourceUrl,
    sourceLabel: entrada.sourceLabel,
  });

  revalidatePath("/contribuir");
  redirect("/contribuir?enviado=1");
}

/** Lista pendentes (admin). */
export async function getPendingContributionsAction(): Promise<{
  ok: boolean;
  data?: ContentContributionRow[];
}> {
  const user = await requireUser();
  if (!ehAdmin(user.email)) return { ok: false };
  const data = await listPendingContributions(100);
  return { ok: true, data };
}

/** Aprova/rejeita contribuição (admin). */
export async function reviewContributionAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!ehAdmin(user.email)) return;

  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "") as "aprovado" | "rejeitado";
  const note = String(formData.get("note") ?? "");

  if (!id || !["aprovado", "rejeitado"].includes(decision)) return;

  await reviewContribution(user.id, id, decision, note);

  revalidatePath("/admin/contribuicoes");
  revalidatePath("/contribuir");
}

/** Minhas contribuições (usuário). */
export async function getMyContributionsAction(): Promise<{
  ok: boolean;
  data?: ContentContributionRow[];
}> {
  const user = await requireUser();
  const data = await listUserContributions(user.id);
  return { ok: true, data };
}