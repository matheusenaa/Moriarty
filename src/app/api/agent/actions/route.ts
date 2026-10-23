import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { applyAgentAction } from "@/lib/agent-actions";
import {
  claimAgentAction,
  discardAgentAction,
  finishAgentAction,
  getAgentAction,
  saveAssistantMessage,
} from "@/lib/repo/agent";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  actionId: z.string().min(1),
  decision: z.enum(["apply", "dismiss"]),
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
  if (!parsed.success) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });

  const action = await getAgentAction(user.id, parsed.data.actionId);
  if (!action) return NextResponse.json({ error: "Ação não encontrada." }, { status: 404 });

  if (parsed.data.decision === "dismiss") {
    const ok = await discardAgentAction(user.id, action.id);
    if (!ok) return NextResponse.json({ error: "Esta ação já foi decidida." }, { status: 409 });
    return NextResponse.json({ ok: true, status: "descartado" });
  }

  if (action.status !== "pendente") {
    return NextResponse.json({ error: "Esta ação já foi decidida.", status: action.status }, { status: 409 });
  }

  const claimed = await claimAgentAction(user.id, action.id);
  if (!claimed) return NextResponse.json({ error: "Esta ação já foi decidida." }, { status: 409 });

  let payload: unknown;
  try {
    payload = JSON.parse(claimed.payload_json);
  } catch {
    await finishAgentAction(user.id, action.id, "falhou", "Payload corrompido.");
    return NextResponse.json({ error: "Não foi possível ler a ação." }, { status: 422 });
  }

  let result: Awaited<ReturnType<typeof applyAgentAction>>;
  try {
    result = await applyAgentAction(user.id, user.timezone, claimed.kind, payload);
  } catch (err) {
    console.error("[agent/actions] falha ao aplicar", err);
    await finishAgentAction(user.id, action.id, "falhou", "Erro interno ao aplicar a ação.");
    await saveAssistantMessage(user.id, "Não apliquei a ação por um erro interno. Nada foi alterado.");
    return NextResponse.json({ error: "Erro interno ao aplicar a ação. Nada foi alterado.", status: "falhou" }, { status: 500 });
  }
  if (!result.ok) {
    await finishAgentAction(user.id, action.id, "falhou", result.message);
    await saveAssistantMessage(user.id, `Não apliquei a ação: ${result.message}`);
    return NextResponse.json({ error: result.message }, { status: 422 });
  }

  await finishAgentAction(user.id, action.id, "aplicado", result.message);
  const message = await saveAssistantMessage(user.id, result.message);
  return NextResponse.json({ ok: true, status: "aplicado", message: result.message, assistantMessage: message });
}
