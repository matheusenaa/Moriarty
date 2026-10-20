/** Embaralhamento e correção de simulados — funções puras e testáveis. */

export type QuestionForQuiz = {
  id: string;
  statement: string;
  type: "multipla" | "certo_errado";
  options: string[];
  correctIndex: number;
  explanation: string;
  subjectId: string | null;
  difficulty: number;
};

/** Embaralha questões e alternativas mantendo o vínculo com a resposta correta. */
export function shuffleQuiz<T extends QuestionForQuiz>(
  questions: T[],
  seed: number,
): T[] {
  const indexed = questions.map((q, i) => ({ q, i }));
  const shuffledQ = mulberry32<{ q: T; i: number }>(seed)(indexed).map(({ q }) => {
    const order = mulberry32<{ o: string; i: number }>(seed + q.id.length * 31 + q.correctIndex)(
      q.options.map((o, i) => ({ o, i })),
    );
    const options = order.map((x) => x.o);
    const newCorrect = order.findIndex((x) => x.i === q.correctIndex);
    return { ...q, options, correctIndex: newCorrect };
  });
  return shuffledQ;
}

function mulberry32<T>(seed: number) {
  let a = (seed >>> 0) || 1;
  return (arr: T[]): T[] => {
    const result = arr.slice();
    for (let i = result.length - 1; i > 0; i--) {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      const r = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      const j = Math.floor(r * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };
}

export type AnswerInput = { questionId: string; chosenIndex: number | null; secondsSpent: number };
export type Corrected = {
  perQuestion: { questionId: string; correct: boolean; correctIndex: number; chosenIndex: number | null }[];
  correct: number;
  total: number;
  bySubject: Record<string, { correct: number; total: number }>;
  weakSubjects: { subjectId: string; correct: number; total: number; accuracy: number }[];
};

export function gradeQuiz(
  questions: Pick<QuestionForQuiz, "id" | "correctIndex" | "subjectId">[],
  answers: AnswerInput[],
): Corrected {
  const answerMap = new Map(answers.map((a) => [a.questionId, a]));
  const perQuestion: Corrected["perQuestion"] = [];
  const bySubject: Record<string, { correct: number; total: number }> = {};

  for (const q of questions) {
    const a = answerMap.get(q.id);
    const chosen = a?.chosenIndex ?? null;
    const correct = chosen !== null && chosen === q.correctIndex;
    perQuestion.push({ questionId: q.id, correct, correctIndex: q.correctIndex, chosenIndex: chosen });
    const key = q.subjectId ?? "sem-materia";
    const bucket = bySubject[key] ?? { correct: 0, total: 0 };
    bucket.total += 1;
    if (correct) bucket.correct += 1;
    bySubject[key] = bucket;
  }

  const correct = perQuestion.filter((p) => p.correct).length;
  const weakSubjects = Object.entries(bySubject)
    .map(([subjectId, b]) => ({
      subjectId,
      correct: b.correct,
      total: b.total,
      accuracy: b.total === 0 ? 0 : b.correct / b.total,
    }))
    .filter((s) => s.accuracy < 0.7)
    .sort((a, b) => a.accuracy - b.accuracy);

  return { perQuestion, correct, total: questions.length, bySubject, weakSubjects };
}

export function accuracyPct(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}
