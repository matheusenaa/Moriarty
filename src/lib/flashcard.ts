/**
 * Utilidades puras para flashcards do catálogo.
 * Ficam FORA de componentes "use client" para poderem ser chamadas no servidor
 * (o Next transforma todo export de um módulo cliente em referência de cliente).
 */

/** Separa "Frente: ... Verso: ..." do corpo em frente/verso. */
export function splitFlashcard(
  body: string,
  fallbackTitle: string,
): { front: string; back: string } {
  const match = body.match(/Frente:\s*([\s\S]*?)\s*Verso:\s*([\s\S]*)/i);
  if (match) return { front: match[1].trim(), back: match[2].trim() };
  return { front: fallbackTitle, back: body.trim() };
}
