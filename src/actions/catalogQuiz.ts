"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { sortearQuestoes } from "@/lib/catalogQuiz";
import {
  getCollectionBySlug,
  getItem,
  listItems,
  recordQuestionAnswer,
} from "@/lib/repo/catalog";
import {
  createAttempt,
  finishAttempt,
  getAttempt,
  parseQuestionIds,
  saveAttemptAnswer,
} from "@/lib/repo/catalogQuiz";

const QUANTIDADES = [5, 10, 20];
const DURACOES = [10, 20, 30, 45];

/**
 * Sorteia as questões de uma trilha e cria a tentativa de simulado.
 * O sorteio é aleatório (semente do relógio) e o gabarito NUNCA é enviado ao
 * cliente: a correção acontece no servidor.
 */
export async function startCatalogQuizAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const slug = String(formData.get("slug") ?? "");
  const collection = await getCollectionBySlug(slug);
  if (!collection) return;

  const quantidade = Number(formData.get("quantidade") ?? 10);
  const duracao = Number(formData.get("duracao") ?? 20);
  const qtd = QUANTIDADES.includes(quantidade) ? quantidade : 10;
  const min = DURACOES.includes(duracao) ? duracao : 20;

  const itens = await listItems(collection.id, "questao");
  const seed = (Date.now() % 2147483647) + Math.floor(Math.random() * 1000);
  const questoes = sortearQuestoes(itens, qtd, seed);
  if (questoes.length === 0) return;

  const attemptId = await createAttempt(user.id, {
    collectionId: collection.id,
    collectionSlug: collection.slug,
    questionIds: questoes.map((q) => q.id),
    durationMinutes: min,
  });

  redirect(`/biblioteca/concursos/${collection.slug}/simulado/${attemptId}`);
}

/**
 * Registra a resposta de uma questão do simulado.
 * O gabarito é conferido NO SERVIDOR (a partir do item do catálogo) e a questão
 * precisa fazer parte da tentativa do próprio usuário.
 */
export async function answerCatalogQuizAction(input: {
  attemptId: string;
  itemId: string;
  chosenIndex: number;
}): Promise<void> {
  const user = await requireUser();
  if (!input?.attemptId || !input?.itemId) return;
  if (!Number.isInteger(input.chosenIndex) || input.chosenIndex < 0) return;

  const attempt = await getAttempt(user.id, input.attemptId);
  if (!attempt || attempt.finished_at) return;
  if (!parseQuestionIds(attempt.question_ids_json).includes(input.itemId)) return;

  const item = await getItem(input.itemId);
  if (!item || item.kind !== "questao" || item.correct_index === null) return;

  const isCorrect = input.chosenIndex === item.correct_index;
  await saveAttemptAnswer(user.id, attempt.id, item.id, input.chosenIndex, isCorrect);
  await recordQuestionAnswer(user.id, item.id, input.chosenIndex, isCorrect);

  revalidatePath("/desempenho");
}

/** Encerra a tentativa e leva para o resultado. */
export async function finishCatalogQuizAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const attemptId = String(formData.get("attemptId") ?? "");
  const attempt = await getAttempt(user.id, attemptId);
  if (!attempt) return;
  await finishAttempt(user.id, attempt.id);
  redirect(`/biblioteca/concursos/${attempt.collection_slug}/simulado/${attempt.id}/resultado`);
}
