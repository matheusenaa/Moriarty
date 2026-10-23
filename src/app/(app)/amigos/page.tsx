import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { listBlocks, listFriendsWithStatus, listPendingRequests } from "@/lib/repo/social";
import { Card, CardTitle, CardDescription } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/Feedback";
import { FriendSearch } from "@/components/FriendSearch";
import { RespondRequestForm } from "@/components/RespondRequestForm";
import { ConfirmForm } from "@/components/ConfirmForm";
import { blockUserFormAction, removeFriendAction, respondFriendRequestFormAction, unblockUserFormAction } from "@/actions/social";
import { STATUS_EMOJI, STATUS_LABEL, STATUS_TONE } from "@/lib/user-status";

export default async function AmigosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");

  const [friends, requests, blocks] = await Promise.all([
    listFriendsWithStatus(user.id),
    listPendingRequests(user.id),
    listBlocks(user.id),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="font-titulo text-3xl font-bold">Amigos</h1>
        <p className="text-sm text-cinza">
          Amizade é mútua e aceita. Solicitação pendente não libera acesso a nada.
        </p>
      </header>

      <Card>
        <CardTitle>Buscar estudantes</CardTitle>
        <CardDescription>Busca por username ou nome de exibição.</CardDescription>
        <FriendSearch />
      </Card>

      <Card>
        <CardTitle>Solicitações recebidas</CardTitle>
        {requests.received.length === 0 ? (
          <CardDescription className="mt-2">Nenhuma solicitação recebida.</CardDescription>
        ) : (
          <ul className="mt-3 space-y-2">
            {requests.received.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-white/10 p-3">
                <span className="text-sm">
                  <span className="font-medium text-pergaminho">{r.display_name}</span>{" "}
                  <span className="text-cinza">@{r.username}</span>
                </span>
                <RespondRequestForm id={r.id} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardTitle>Enviadas (aguardando resposta)</CardTitle>
        {requests.sent.length === 0 ? (
          <CardDescription className="mt-2">Nenhuma solicitação pendente enviada.</CardDescription>
        ) : (
          <ul className="mt-3 space-y-2">
            {requests.sent.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-white/10 p-3">
                <span className="text-sm">
                  <span className="font-medium text-pergaminho">{r.display_name}</span>{" "}
                  <span className="text-cinza">@{r.username}</span> <Badge tone="neutro">pendente</Badge>
                </span>
                <ConfirmForm
                  action={respondFriendRequestFormAction}
                  fields={{ id: r.id, decision: "cancelado" }}
                  message="Cancelar esta solicitação?"
                  className="text-xs text-alerta-claro underline"
                >
                  cancelar
                </ConfirmForm>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardTitle>Amigos ({friends.length})</CardTitle>
        {friends.length === 0 ? (
          <EmptyState
            className="mt-3 border-0 shadow-none"
            title="Nenhum amigo ainda"
            description="Busque estudantes pelo username e envie uma solicitação. Amizades permitem ver materiais com visibilidade de amigos e conversar no chat."
          />
        ) : (
          <ul className="mt-3 space-y-2">
            {friends.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-white/10 p-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {f.photo_url ? (
                    <img
                      src={`/api/avatar/${f.id}?v=${encodeURIComponent(f.photo_url)}`}
                      alt={f.display_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-latao/10 flex items-center justify-center text-latao font-medium">
                      {f.display_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-pergaminho truncate">{f.display_name}</span>
                      <span className="text-cinza">@{f.username}</span>
                      <Badge tone={STATUS_TONE[f.user_status]} className="text-xs">
                        {STATUS_EMOJI[f.user_status]} {STATUS_LABEL[f.user_status]}
                      </Badge>
                      {f.unread_count > 0 ? (
                        <Badge tone="alerta" className="text-xs">
                          {f.unread_count} mensagem(ns) não lida(s)
                        </Badge>
                      ) : null}
                    </p>
                    {f.custom_phrase && (
                      <p className="text-xs text-cinza truncate max-w-xs">{f.custom_phrase}</p>
                    )}
                    <p className="text-xs text-cinza-escuro">amigos desde {f.friends_since.slice(0, 10)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/chat/${f.id}`}
                    className="rounded-md border border-latao/40 px-3 py-1.5 text-sm text-latao hover:bg-latao/10"
                  >
                    Conversar
                  </Link>
                  <ConfirmForm
                    action={removeFriendAction}
                    fields={{ id: f.id }}
                    message={`Remover @${f.username} da sua lista de amigos?`}
                    className="text-xs text-alerta-claro underline"
                  >
                    remover
                  </ConfirmForm>
                  <ConfirmForm
                    action={blockUserFormAction}
                    fields={{ id: f.id }}
                    message={`Bloquear @${f.username}? A amizade será removida.`}
                    className="text-xs text-alerta-claro underline"
                  >
                    bloquear
                  </ConfirmForm>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardTitle>Usuários bloqueados</CardTitle>
        {blocks.length === 0 ? (
          <CardDescription className="mt-2">Ninguém bloqueado.</CardDescription>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {blocks.map((b) => (
              <li key={b.id} className="flex items-center justify-between border-b border-white/5 py-1.5">
                <span>@{b.username}</span>
                <ConfirmForm
                  action={unblockUserFormAction}
                  fields={{ id: b.id }}
                  message={`Desbloquear @${b.username}?`}
                  className="text-xs text-latao underline"
                >
                  desbloquear
                </ConfirmForm>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
