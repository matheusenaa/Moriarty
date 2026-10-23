import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { validateQuestionForSave } from "@/lib/agent";
import { getSubject } from "@/lib/repo/planning";
import { createQuestion } from "@/lib/repo/quiz";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  subjectId: z.string().min(1),
  statement: z.string().min(10).max(5000),
  type: z.enum(["multipla", "certo_errado"]),
  options: z.array(z.string().min(1).max(500)).min(2).max(6),
  correctIndex: z.coerce.number().int().min(0),
  explanation: z.string().max(3000).optional().default(""),
  difficulty: z.coerce.number().int().min(1).max(5).optional().default(3),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Questão inválida." }, { status: 400 });
  }

  const subject = await getSubject(user.id, parsed.data.subjectId);
  if (!subject) return NextResponse.json({ error: "Matéria não encontrada na sua conta." }, { status: 404 });

  const question = validateQuestionForSave(parsed.data);
  if (!question) return NextResponse.json({ error: "Questão inválida." }, { status: 400 });

  const id = await createQuestion(user.id, {
    statement: question.statement,
    type: question.type,
    options: question.options,
    correctIndex: question.correctIndex,
    explanation: question.explanation,
    subjectId: subject.id,
    difficulty: question.difficulty,
    sourceName: "Gerada por IA — revisada pelo usuário",
    origin: "ia",
  });

  revalidatePath("/questoes");
  revalidatePath("/simulados");
  revalidatePath("/desempenho");
  return NextResponse.json({
    ok: true,
    id,
    message: "Questão salva no seu banco. Ela já pode ser usada em simulados.",
  });
}
