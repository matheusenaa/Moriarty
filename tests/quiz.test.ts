import { describe, expect, it } from "vitest";
import { gradeQuiz, shuffleQuiz } from "@/lib/quiz";

const questions = [
  {
    id: "q1",
    statement: "Pergunta 1",
    type: "multipla" as const,
    options: ["A", "B", "C"],
    correctIndex: 1,
    explanation: "",
    subjectId: "s1",
    difficulty: 3,
  },
  {
    id: "q2",
    statement: "Pergunta 2",
    type: "multipla" as const,
    options: ["X", "Y"],
    correctIndex: 0,
    explanation: "",
    subjectId: "s2",
    difficulty: 2,
  },
  {
    id: "q3",
    statement: "Pergunta 3",
    type: "certo_errado" as const,
    options: ["Certo", "Errado"],
    correctIndex: 1,
    explanation: "",
    subjectId: "s1",
    difficulty: 4,
  },
];

describe("embaralhamento de simulado", () => {
  it("mantém o vínculo com a resposta correta após embaralhar", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const shuffled = shuffleQuiz(questions, seed);
      expect(shuffled).toHaveLength(3);
      const map = new Map(questions.map((q) => [q.id, q]));
      for (const sq of shuffled) {
        const original = map.get(sq.id)!;
        expect(sq.options[sq.correctIndex]).toBe(original.options[original.correctIndex]);
        expect([...sq.options].sort()).toEqual([...original.options].sort());
      }
    }
  });
});

describe("correção de simulado", () => {
  it("calcula acertos, total e taxa por matéria", () => {
    const graded = gradeQuiz(
      questions.map((q) => ({ id: q.id, correctIndex: q.correctIndex, subjectId: q.subjectId })),
      [
        { questionId: "q1", chosenIndex: 1, secondsSpent: 30 },
        { questionId: "q2", chosenIndex: 1, secondsSpent: 20 },
        { questionId: "q3", chosenIndex: null, secondsSpent: 10 },
      ],
    );
    expect(graded.total).toBe(3);
    expect(graded.correct).toBe(1);
    expect(graded.bySubject["s1"]).toEqual({ correct: 1, total: 2 });
    expect(graded.bySubject["s2"]).toEqual({ correct: 0, total: 1 });
    // s2 com 0% e s1 com 50% entram nos pontos de atenção (<70%)
    expect(graded.weakSubjects.map((w) => w.subjectId).sort()).toEqual(["s1", "s2"]);
  });

  it("não conta resposta em branco como acerto", () => {
    const graded = gradeQuiz(
      questions.map((q) => ({ id: q.id, correctIndex: q.correctIndex, subjectId: q.subjectId })),
      [{ questionId: "q1", chosenIndex: null, secondsSpent: 0 }],
    );
    expect(graded.correct).toBe(0);
  });
});
