import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canChat, markChatMessagesRead } from "@/lib/repo/profile";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Não autenticado" }, { status: 401 });

  try {
    const formData = await request.formData();
    const fromUserId = String(formData.get("fromUserId") ?? "");
    if (!fromUserId) return NextResponse.json({ ok: false, error: "Remetente inválido" }, { status: 400 });
    if (!(await canChat(user.id, fromUserId))) {
      return NextResponse.json({ ok: false, error: "Conversa indisponível." }, { status: 403 });
    }

    await markChatMessagesRead(user.id, fromUserId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Erro ao marcar como lida:", err);
    return NextResponse.json({ ok: false, error: "Erro interno" }, { status: 500 });
  }
}