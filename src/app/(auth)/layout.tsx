import Link from "next/link";
import { AcademicScene } from "@/components/AcademicScene";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="textura-arquivo grid min-h-screen lg:grid-cols-2">
      {/* Painel visual de estudos (desktop). No mobile vira faixa superior discreta. */}
      <section
        aria-hidden="true"
        className="relative hidden overflow-hidden border-r border-latao/15 bg-grafite lg:block"
      >
        <div className="textura-livro absolute inset-0" />
        <AcademicScene />
        <div className="relative z-10 flex h-full flex-col justify-between p-10">
          <Link href="/" className="inline-flex items-baseline gap-2">
            <span className="text-[11px] uppercase tracking-[0.35em] text-latao">Moriarty</span>
          </Link>
          <div className="max-w-md">
            <h2 className="font-titulo text-4xl leading-tight text-pergaminho">
              Estude com método. Evolua com constância.
            </h2>
            <p className="mt-3 text-sm text-cinza">
              Cronograma realista, revisão espaçada, simulados e biblioteca — incluindo
              trilhas de preparação PMDF, Polícia Federal e PRF.
            </p>
          </div>
          <p className="text-xs text-cinza-escuro">
            Conhecimento construído um dia de cada vez.
          </p>
        </div>
      </section>

      {/* Área de acesso */}
      <section className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
        <div className="mb-6 w-full max-w-md text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-latao">Moriarty</p>
          <h1 className="font-titulo text-2xl font-bold">Sua plataforma de estudos</h1>
          {/* Faixa decorativa simplificada no mobile */}
          <div aria-hidden="true" className="relative mx-auto mt-4 h-20 w-full max-w-md overflow-hidden rounded-lg border border-latao/15 bg-grafite/60 lg:hidden">
            <AcademicScene />
          </div>
        </div>
        <div className="w-full max-w-md">{children}</div>
      </section>
    </main>
  );
}
