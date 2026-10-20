import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { OnboardingForm } from "@/components/OnboardingForm";
import { Card } from "@/components/Card";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  if (user.onboarded) redirect("/central");

  return (
    <main className="textura-arquivo mx-auto max-w-2xl px-4 py-10">
      <p className="text-xs uppercase tracking-[0.3em] text-latao">Primeiros passos</p>
      <h1 className="mb-1 font-titulo text-3xl font-bold">Configure seu plano de estudos</h1>
      <p className="mb-6 text-sm text-cinza">
        Três passos curtos: seu objetivo, as matérias e quando você consegue estudar.
        Tudo pode ser ajustado depois em <strong>Meu plano</strong> e <strong>Matérias</strong>.
      </p>
      <Card>
        <OnboardingForm displayName={user.displayName} />
      </Card>
    </main>
  );
}
