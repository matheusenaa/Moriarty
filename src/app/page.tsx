import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/Button";
import { Card, CardTitle, CardDescription } from "@/components/Card";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/central");

  return (
    <main className="textura-arquivo mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-10">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-latao">Moriarty</p>
          <h1 className="font-titulo text-3xl font-bold">Sua plataforma de estudos</h1>
        </div>
        <nav className="flex gap-2">
          <Link href="/entrar">
            <Button variant="fantasma">Entrar</Button>
          </Link>
          <Link href="/cadastro">
            <Button variant="primario">Criar conta</Button>
          </Link>
        </nav>
      </header>

      <section className="mt-16 max-w-2xl">
        <h2 className="font-titulo text-4xl leading-tight sm:text-5xl">
          Planeje. Pratique. Revise. Avance.
        </h2>
        <p className="mt-4 text-lg text-cinza">
          Cronograma realista, revisão espaçada, simulados, biblioteca pessoal e
          compartilhamento seguro de materiais — com privacidade de verdade e
          funcionamento completo sem serviços pagos.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/cadastro">
            <Button variant="primario" className="px-5 py-3">
              Começar a estudar
            </Button>
          </Link>
          <Link href="/entrar">
            <Button variant="secundario" className="px-5 py-3">
              Já tenho conta
            </Button>
          </Link>
        </div>
      </section>

      <section className="mt-16 grid gap-4 sm:grid-cols-3">
        {[
          {
            t: "Plano que cabe na vida real",
            d: "Respeita sua disponibilidade, preserva sessões concluídas e explica cada sugestão.",
          },
          {
            t: "Revisão espaçada",
            d: "Algoritmo SM-2 simplificado, documentado e testado. Fila por vencimento, sem notificações prometidas em vão.",
          },
          {
            t: "Privacidade por padrão",
            d: "Seu progresso é só seu. Materiais compartilhados exigem login e nunca expõem estatísticas pessoais.",
          },
        ].map((f) => (
          <Card key={f.t}>
            <CardTitle>{f.t}</CardTitle>
            <CardDescription>{f.d}</CardDescription>
          </Card>
        ))}
      </section>

      <footer className="mt-auto pt-16 text-sm text-cinza-escuro">
        Moriarty · plataforma de estudos pessoal · dados guardados localmente nesta instalação
      </footer>
    </main>
  );
}
