import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BookOpen,
  CalendarRange,
  FolderOpen,
  GraduationCap,
  Library,
  ListChecks,
  LogOut,
  Search,
  Settings,
  Share2,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";
import { generateDailyReminders, listNotifications } from "@/lib/repo/notifications";
import { todayStr } from "@/lib/dates";
import { NavClient } from "@/components/NavClient";
import { NotificationList } from "@/components/NotificationList";
import { gamificationSummary } from "@/lib/repo/gamification";
import { studyStreak } from "@/lib/repo/stats";
import { rankForXp, progressToNextRank } from "@/lib/xp";
import { ProgressBar } from "@/components/Feedback";
import { Badge } from "@/components/Badge";

const NAV = [
  { href: "/central", label: "Central", icon: Sparkles },
  { href: "/plano", label: "Meu plano", icon: CalendarRange },
  { href: "/revisoes", label: "Revisões", icon: ListChecks },
  { href: "/biblioteca/concursos", label: "Concursos", icon: Shield },
  { href: "/materias", label: "Matérias", icon: GraduationCap },
  { href: "/biblioteca", label: "Biblioteca", icon: Library },
  { href: "/questoes", label: "Questões", icon: BookOpen },
  { href: "/simulados", label: "Simulados", icon: Search },
  { href: "/desempenho", label: "Desempenho", icon: Share2 },
  { href: "/arquivo", label: "Arquivo", icon: FolderOpen },
  { href: "/amigos", label: "Amigos", icon: Users },
  { href: "/perfil", label: "Perfil", icon: Settings },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  if (!user.onboarded) redirect("/onboarding");

  const today = todayStr(user.timezone);
  await generateDailyReminders(user.id, today);
  const notifications = (await listNotifications(user.id)).filter((n) => !n.read_at).slice(0, 8);
  const streak = await studyStreak(user.id, today);
  const gamification = user.gamificationEnabled ? await gamificationSummary(user.id, streak) : null;
  const rank = gamification ? rankForXp(gamification.xp) : null;
  const progress = gamification ? progressToNextRank(gamification.xp) : null;

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-latao/15 bg-grafite lg:flex">
        <div className="border-b border-latao/15 px-5 py-5">
          <p className="text-[10px] uppercase tracking-[0.3em] text-latao">Moriarty</p>
          <p className="font-titulo text-xl font-bold">Central</p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-3" aria-label="Navegação principal">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-cinza transition-colors hover:bg-latao/10 hover:text-pergaminho"
            >
              <item.icon aria-hidden size={16} className="text-latao/70" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-latao/15 p-4">
          {gamification && rank && progress ? (
            <div className="mb-3">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-pergaminho">{rank.name}</span>
                <span className="text-cinza">{gamification.xp} XP</span>
              </div>
              <ProgressBar pct={progress.pct} label="" />
            </div>
          ) : null}
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-cinza hover:bg-white/5 hover:text-pergaminho"
            >
              <LogOut aria-hidden size={15} /> Sair da conta
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-latao/15 bg-carvao/95 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm text-cinza">
                Olá, <span className="font-medium text-pergaminho">{user.displayName}</span>
                {streak > 0 ? (
                  <Badge tone="latiao" className="ml-2">
                    {streak} dia(s) seguidos
                  </Badge>
                ) : null}
              </p>
            </div>
            <NotificationList notifications={notifications} />
          </div>
          <NavClient items={NAV.map(({ href, label }) => ({ href, label }))} />
        </header>
        <main className="textura-operacional textura-arquivo flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
