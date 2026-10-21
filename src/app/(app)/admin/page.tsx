import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ehAdmin } from "@/lib/admin";
import { Card, CardTitle, CardDescription } from "@/components/Card";
import { SeedButton } from "@/components/SeedButton";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");

  if (!ehAdmin(user.email)) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="font-titulo text-2xl font-bold">Administração</h1>
        <Card>
          <CardTitle className="text-base">Acesso restrito</CardTitle>
          <CardDescription>
            Sua conta ({user.email}) não está na lista de administradores desta instalação.
          </CardDescription>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="font-titulo text-3xl font-bold">Administração</h1>
        <p className="text-sm text-cinza">Ferramentas de manutenção do conteúdo do Moriarty.</p>
      </header>

      <Card>
        <CardTitle className="text-base">Conteúdo das trilhas (PMDF, PF, PRF)</CardTitle>
        <CardDescription>
          Carrega/atualiza as trilhas de concursos no banco. É <strong>idempotente</strong>: pode
          clicar quantas vezes quiser, não duplica nada. Roda no servidor (Vercel), que tem acesso
          aberto ao banco — funciona mesmo quando a porta 5432 está bloqueada na sua rede.
        </CardDescription>
        <SeedButton />
      </Card>
    </div>
  );
}
