import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { aiConfigured, aiInfo, NotConfiguredError, ProviderError, tutorChat } from "@/lib/ai";
import { normalizeTutorActions, parseTutorReply } from "@/lib/agent";
import { buildAgentContext } from "@/lib/agent-context";
import { aiDailyLimit, consumeAiQuota, getAiUsage, listAgentMessages, saveAgentTurn } from "@/lib/repo/agent";
import { todayStr } from "@/lib/dates";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  message: z.string().trim().min(1, "Escreva uma mensagem.").max(2000, "Mensagem longa demais."),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const limit = aiDailyLimit();
  const usage = await getAiUsage(user.id, todayStr(user.timezone), limit);
  const messages = await listAgentMessages(user.id);
  return NextResponse.json({
    configured: aiConfigured(),
    provider: aiInfo().provider,
    usage,
    messages,
  });
}

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
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Mensagem inválida." }, { status: 400 });
  }

  const limit = aiDailyLimit();
  const usage = await consumeAiQuota(user.id, todayStr(user.timezone), limit);
  if (!usage.allowed) {
    return NextResponse.json(
      { error: `Limite diário de ${usage.limit} mensagens de IA atingido. Tente novamente amanhã.`, code: "quota" },
      { status: 429 },
    );
  }

  try {
    const history = (await listAgentMessages(user.id, 12)).map((m) => ({ role: m.role, body: m.body }));
    const context = await buildAgentContext(user);
    const raw = await tutorChat({ context: context.prompt, history, message: parsed.data.message });
    const base = parseTutorReply(JSON.stringify(raw));
    const normalized = normalizeTutorActions(base.rawActions, context.actions);
    const warnings = normalized.warnings;
    const reply = warnings.length
      ? `${base.reply}\n\n⚠ ${warnings.join(" ")}`
      : base.reply;
    const saved = await saveAgentTurn(user.id, parsed.data.message, reply, normalized.actions);
    return NextResponse.json({
      message: saved.assistantMessage,
      remaining: usage.remaining,
      warnings,
    });
  } catch (err) {
    console.error("[agent/chat] falha", err);
    if (err instanceof NotConfiguredError) {
      return NextResponse.json({ error: "IA não configurada no servidor.", code: "not_configured" }, { status: 503 });
    }
    if (err instanceof ProviderError && err.status === 503) {
      return NextResponse.json(
        { error: "O provedor de IA está temporariamente indisponível. Tente novamente em instantes." },
        { status: 503 },
      );
    }
    if (err instanceof ProviderError) {
      return NextResponse.json({ error: "O provedor de IA não respondeu. Tente novamente." }, { status: 502 });
    }
    return NextResponse.json({ error: "Não consegui falar com o tutor agora. Tente novamente." }, { status: 502 });
  }
}
