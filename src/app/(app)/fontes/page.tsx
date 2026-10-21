import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardTitle, CardDescription } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { SeloConcurso } from "@/components/SeloConcurso";
import { BuscaFontes } from "@/components/BuscaFontes";
import { FONTES_OFICIAIS } from "@/lib/fontes";

export default async function FontesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");

  const porConcurso = FONTES_OFICIAIS.reduce<Record<string, number>>((acc, f) => {
    for (const c of f.concursos) acc[c] = (acc[c] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-2">
        <SeloConcurso className="mb-2" />
        <h1 className="font-titulo text-3xl font-bold">Fontes oficiais</h1>
        <p className="text-sm text-cinza">
          Busca <strong>determinística</strong> (sem IA paga) na base de leis e artigos oficiais das
          carreiras policiais. O resultado aponta sempre para a fonte primária (Planalto/gov.br).
        </p>
        <div className="flex flex-wrap gap-1.5">
          <Badge tone="neutro">{FONTES_OFICIAIS.length} fontes curadas</Badge>
          {Object.entries(porConcurso).map(([c, n]) => (
            <Badge key={c} tone="latiao">
              {c}: {n}
            </Badge>
          ))}
        </div>
      </header>

      <Card>
        <CardTitle className="text-base">Buscar</CardTitle>
        <CardDescription className="mb-3">
          Digite o número do artigo, o nome da lei ou o assunto. Retornamos o link oficial e um
          resumo próprio do que trata.
        </CardDescription>
        <BuscaFontes />
      </Card>

      <Card>
        <CardTitle className="text-base">Como funciona</CardTitle>
        <ul className="mt-2 space-y-1 text-sm text-cinza">
          <li>
            <strong>Grátis e offline:</strong> roda no seu servidor, sem chamar APIs pagas.
          </li>
          <li>
            <strong>Fonte primária:</strong> cada resultado leva ao texto oficial da lei.
          </li>
          <li>
            <strong>Sem cópia de prova:</strong> não reproduzimos questões oficiais protegidas;
            apenas a lei, com o artigo identificado.
          </li>
          <li>
            <strong>Salvar:</strong> você pode guardar o link na sua biblioteca para revisar depois.
          </li>
        </ul>
        <p className="mt-3 text-xs text-cinza-escuro">
          A base é curada manualmente e pode não cobrir todos os dispositivos. Para a redação
          exata, sempre confira o texto no link oficial.
        </p>
      </Card>
    </div>
  );
}
