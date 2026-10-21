"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  blockUser,
  decideFriendRequest,
  listBlocks,
  listFriends,
  listPendingRequests,
  removeFriendship,
  searchUsers,
  sendFriendRequest,
  unblockUser,
} from "@/lib/repo/social";
import type { ActionState } from "./auth";

export async function searchUsersAction(query: string) {
  const user = await requireUser();
  const q = query.trim();
  if (q.length < 2) return [];
  return searchUsers(user.id, q);
}

export async function sendFriendRequestAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const to = String(formData.get("to") ?? "");
  const result = await sendFriendRequest(user.id, to);
  revalidatePath("/amigos");
  return result.ok ? { ok: true, message: "Solicitação enviada." } : { ok: false, error: result.error };
}

export async function respondFriendRequestAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "") as "aceite" | "recusado" | "cancelado";
  if (!["aceite", "recusado", "cancelado"].includes(decision)) {
    return { ok: false, error: "Ação inválida." };
  }
  const result = await decideFriendRequest(user.id, id, decision);
  revalidatePath("/amigos");
  if (!result.ok) return { ok: false, error: result.error };
  const messages = { aceite: "Amizade aceita.", recusado: "Solicitação recusada.", cancelado: "Solicitação cancelada." };
  return { ok: true, message: messages[decision] };
}

export async function removeFriendAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  await removeFriendship(user.id, String(formData.get("id") ?? ""));
  revalidatePath("/amigos");
}

export async function blockUserAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const result = await blockUser(user.id, String(formData.get("id") ?? ""));
  revalidatePath("/amigos");
  return result.ok ? { ok: true, message: "Usuário bloqueado. Amizade e solicitações foram removidas." } : { ok: false, error: result.error };
}

export async function unblockUserAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  await unblockUser(user.id, String(formData.get("id") ?? ""));
  revalidatePath("/amigos");
}

export async function friendsPageData(userId: string) {
  return {
    friends: await listFriends(userId),
    requests: await listPendingRequests(userId),
    blocks: await listBlocks(userId),
  };
}

/** Wrappers com assinatura (formData) para uso em <form action={...}> direto. */
export async function respondFriendRequestFormAction(formData: FormData): Promise<void> {
  await respondFriendRequestAction({ ok: true }, formData);
}

export async function blockUserFormAction(formData: FormData): Promise<void> {
  await blockUserAction({ ok: true }, formData);
}

export async function unblockUserFormAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  await unblockUser(user.id, String(formData.get("id") ?? ""));
  revalidatePath("/amigos");
}
