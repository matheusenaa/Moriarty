import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getProfile } from "@/lib/repo/profile";
import { areFriends } from "@/lib/repo/social";
import { lerArquivo } from "@/lib/storage";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(_req: Request, ctx: { params: Promise<{ userId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { userId } = await ctx.params;
  const profile = await getProfile(userId);
  if (!profile?.photo_url) {
    return NextResponse.json({ error: "Foto não encontrada." }, { status: 404 });
  }

  if (user.id !== userId && !(await areFriends(user.id, userId))) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  }

  const buffer = await lerArquivo(profile.photo_url);
  if (!buffer) {
    return NextResponse.json({ error: "Foto indisponível no armazenamento." }, { status: 404 });
  }

  const ext = profile.photo_url.split(".").pop()?.toLowerCase() ?? "";
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": MIME[ext] ?? "application/octet-stream",
      "Content-Disposition": "inline",
      "Cache-Control": "private, max-age=60",
    },
  });
}
