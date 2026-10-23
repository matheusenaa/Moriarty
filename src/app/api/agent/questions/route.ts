import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { aiConfigured, generateQuestions, NotConfiguredError, ProviderError } from "@/lib/ai";
import { validateQuestionForSave } from "@/lib/agent";
import { aiDailyLimit, consumeAiQuota } from "@/lib/repo/agent";
import { getSubject } from "@/lib/repo/planning";
import { todayStr } from "@/lib/dates";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  subjectId: z.string().min(1, "Escolha uma matéria."),
  topic: z.string().trim().max(160).optional().default(""),
  count: z.coerce.number().int().min(1).max(10).optional().default(3),
  difficulty: z.coerce.number().int().min(1).max(5).optional().default(3),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!aiConfigured()) {
    return NextResponse.json(
      { error: "IA não configurada no servidor. Defina AI_PROVIDER=gemini e AI_API_KEY.", code: "not_configured" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const subject = await getSubject(user.id, parsed.data.subjectId);
  if (!subject) return NextResponse.json({ error: "Matéria não encontrada na sua conta." }, { status: 404 });

  const limit = aiDailyLimit();
  const usage = await consumeAiQuota(user.id, todayStr(user.timezone), limit);
  if (!usage.allowed) {
    return NextResponse.json(
      { error: `Limite diário de ${usage.limit} chamadas de IA atingido. Tente novamente amanhã.`, code: "quota" },
      { status: 429 },
    );
  }

  try {
    const generated = await generateQuestions({
      subjectName: subject.name,
      topic: parsed.data.topic,
      count: parsed.data.count,
      difficulty: parsed.data.difficulty,
    });
    const questions = generated
      .map((q) => validateQuestionForSave(q))
      .filter((q): q is NonNullable<typeof q> => q !== null)
      .slice(0, parsed.data.count);
    if (questions.length === 0) {
      return NextResponse.json({ error: "A IA não retornou questões válidas. Tente novamente." }, { status: 502 });
    }
    return NextResponse.json({
      questions,
      subject: { id: subject.id, name: subject.name },
      remaining: usage.remaining,
    });
  } catch (err) {
    console.error("[agent/questions] falha", err);
    if (err instanceof NotConfiguredError) {
      return NextResponse.json({ error: "IA não configurada no servidor." }, { status: 503 });
    }
    if (err instanceof ProviderError) {
      return NextResponse.json({ error: "O provedor de IA não respondeu. Tente novamente." }, { status: 502 });
    }
    return NextResponse.json({ error: "Não foi possível gerar questões agora." }, { status: 502 });
  }
}
