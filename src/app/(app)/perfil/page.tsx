import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getProfile, getUserAuth } from "@/lib/repo/profile";
import { listReminders } from "@/lib/repo/notifications";
import { Card, CardTitle, CardDescription } from "@/components/Card";
import { ProfileForm } from "@/components/ProfileForm";
import { ReminderForm } from "@/components/ReminderForm";
import { ExportButton } from "@/components/ExportButton";
import { DeleteAccountForm } from "@/components/DeleteAccountForm";
import { gamificationSummary } from "@/lib/repo/gamification";
import { studyStreak } from "@/lib/repo/stats";
import { todayStr } from "@/lib/dates";
import { rankForXp, ACHIEVEMENTS } from "@/lib/xp";
import { Badge } from "@/components/Badge";
import { SeedButton } from "@/components/SeedButton";
import { ehAdmin } from "@/lib/admin";

export default async function PerfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const profile = await getProfile(user.id);
  const auth = await getUserAuth(user.id);
  const reminders = await listReminders(user.id);
  const today = todayStr(user.timezone);
  const streak = await studyStreak(user.id, today);
  const gamification = user.gamificationEnabled ? await gamificationSummary(user.id, streak) : null;
  const rank = gamification ? rankForXp(gamification.xp) : null;
  const isAdmin = ehAdmin(user.email);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="font-titulo text-3xl font-bold">Perfil e configurações</h1>
        <p className="text-sm text-cinza">
          @{user.username} · {user.email}
        </p>
      </header>

      {gamification && rank ? (
        <Card>
          <CardTitle>Conquistas</CardTitle>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone="latiao">
              {rank.name} · {gamification.xp} XP
            </Badge>
            <Badge tone="neutro">sequência {streak} dia(s)</Badge>
          </div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {gamification.achievements.map((a) => (
              <li
                key={a.code}
                className={`rounded-md border p-2.5 text-sm ${
                  a.unlockedAt ? "border-latao/40 bg-latao/10" : "border-white/10 opacity-60"
                }`}
              >
                <p className="font-medium text-pergaminho">
                  {a.name} {a.unlockedAt ? "✓" : "—"}
                </p>
                <p className="text-xs text-cinza">{a.description}</p>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-cinza-escuro">
            {gamification.achievements.filter((a) => a.unlockedAt).length} de {ACHIEVEMENTS.length} desbloqueadas
          </p>
        </Card>
      ) : null}

      <Card>
        <CardTitle>Preferências</CardTitle>
        <ProfileForm
          displayName={profile?.display_name ?? user.displayName}
          timezone={profile?.timezone ?? user.timezone}
          gamificationEnabled={profile?.gamification_enabled === 1}
          remindersEnabled={profile?.reminders_enabled === 1}
        />
      </Card>

      <Card>
        <CardTitle>Lembretes internos</CardTitle>
        <CardDescription>
          Aparecem no sino da plataforma. Não prometemos notificação do navegador nem e-mail: se
          quiser alerta externo, use o lembrete do seu sistema operacional.
        </CardDescription>
        {(["revisao", "sessao"] as const).map((kind) => {
          const r = reminders.find((x) => x.kind === kind);
          return (
            <ReminderForm
              key={kind}
              kind={kind}
              initialTime={r ? `${String(Math.floor(r.time_minute / 60)).padStart(2, "0")}:${String(r.time_minute % 60).padStart(2, "0")}` : "09:00"}
              initialDays={
                r
                  ? (JSON.parse(r.days_json) as number[])
                  : [0, 1, 2, 3, 4, 5, 6]
              }
              initialEnabled={r ? r.enabled === 1 : true}
            />
          );
        })}
      </Card>

      <Card>
        <CardTitle>Exportação de dados</CardTitle>
        <CardDescription>
          Baixa um JSON com todos os seus registros desta instalação (objetivos, sessões,
          revisões, materiais, questões, tentativas e conquistas).
        </CardDescription>
        <ExportButton />
      </Card>

      {isAdmin ? (
        <Card>
          <CardTitle>Administração — conteúdo das trilhas</CardTitle>
          <CardDescription>
            Carrega/atualiza as trilhas de concursos (PMDF, PF, PRF) no banco. É idempotente: pode
            clicar quantas vezes quiser, não duplica nada. Roda no servidor, então funciona mesmo
            quando a porta do banco está bloqueada na sua rede.
          </CardDescription>
          <SeedButton />
        </Card>
      ) : null}

      <Card className="border-alerta/40">
        <CardTitle>Zona de risco</CardTitle>
        <CardDescription>
          A exclusão da conta remove o acesso e apaga o perfil e os dados vinculados neste banco.
          Confirme digitando <strong>EXCLUIR</strong>. A ação não pode ser desfeita.
        </CardDescription>
        <DeleteAccountForm userId={user.id} email={auth?.email ?? user.email} />
      </Card>
    </div>
  );
}
