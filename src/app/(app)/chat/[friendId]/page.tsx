import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProfile } from "@/lib/repo/profile";
import { areFriends } from "@/lib/repo/social";
import { normalizarStatus } from "@/lib/user-status";
import { ChatClient } from "./ChatClient";

export default async function ChatPage({ params }: { params: Promise<{ friendId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");

  const { friendId } = await params;
  if (friendId === user.id) redirect("/perfil");

  const profile = await getProfile(friendId);
  if (!profile) redirect("/amigos");
  if (!(await areFriends(user.id, friendId))) redirect("/amigos");

  return (
    <ChatClient
      currentUserId={user.id}
      friend={{
        id: profile.user_id,
        username: profile.username,
        displayName: profile.display_name,
        photoUrl: profile.photo_url
          ? `/api/avatar/${profile.user_id}?v=${encodeURIComponent(profile.photo_url)}`
          : null,
        phrase: profile.custom_phrase,
        status: normalizarStatus(profile.user_status),
      }}
    />
  );
}
