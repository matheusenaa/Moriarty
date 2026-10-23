import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canChat, sendChatMessage } from "@/lib/repo/profile";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Não autenticado" }, { status: 401 });

  try {
    const formData = await request.formData();
    const toUserId = String(formData.get("toUserId") ?? "");
    const body = String(formData.get("body") ?? "").trim();

    if (!toUserId) return NextResponse.json({ ok: false, error: "Destinatário inválido" }, { status: 400 });
    if (!body) return NextResponse.json({ ok: false, error: "Mensagem vazia" }, { status: 400 });
    if (body.length > 2000) return NextResponse.json({ ok: false, error: "Mensagem muito longa" }, { status: 400 });
    if (!(await canChat(user.id, toUserId))) {
      return NextResponse.json({ ok: false, error: "Vocês precisam ser amigos para conversar." }, { status: 403 });
    }

    await sendChatMessage(user.id, toUserId, body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Erro ao enviar mensagem:", err);
    return NextResponse.json({ ok: false, error: "Erro interno" }, { status: 500 });
  }
}