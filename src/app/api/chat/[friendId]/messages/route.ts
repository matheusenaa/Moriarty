import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canChat, getChatMessages, countTotalUnread, countUnreadFrom } from "@/lib/repo/profile";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ friendId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Não autenticado" }, { status: 401 });

  const { friendId } = await params;
  if (!(await canChat(user.id, friendId))) {
    return NextResponse.json({ ok: false, error: "Vocês precisam ser amigos para conversar." }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const before = searchParams.get("before");
  const limit = Number(searchParams.get("limit") ?? 50);

  try {
    const [messages, totalUnread, unreadFrom] = await Promise.all([
      getChatMessages(user.id, friendId, limit, before ?? undefined),
      countTotalUnread(user.id),
      countUnreadFrom(user.id, friendId),
    ]);
    return NextResponse.json({
      ok: true,
      messages,
      totalUnread,
      unreadFrom,
    });
  } catch (err) {
    console.error("Erro ao buscar mensagens:", err);
    return NextResponse.json({ ok: false, error: "Erro interno" }, { status: 500 });
  }
}