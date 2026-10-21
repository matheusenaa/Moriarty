"use client";

import { useState, useTransition } from "react";
import { buscarFontesAction, salvarFonteAction } from "@/actions/fontes";
import { Button } from "@/components/Button";
import { Input } from "@/components/FormControls";
import { Badge } from "@/components/Badge";
import type { ResultadoBusca } from "@/lib/fontes";

const SUGESTOES = [
  "art. 306 CTB embriaguez",
  "inquérito policial prazo",
  "usuário x traficante",
  "segurança pública art. 144",
  "hierarquia e disciplina",
  "crimes militares em tempo de paz",
];

export function BuscaFontes() {
  const [consulta, setConsulta] = useState("");
  const [resultados, setResultados] = useState<ResultadoBusca[] | null>(null);
  const [salvos, setSalvos] = useState<Record<string, boolean>>({});
  const [pending, startTransition] = useTransition();

  function buscar(e: React.FormEvent, termo?: string) {
    e.preventDefault();
    const q = termo ?? consulta;
    startTransition(async () => {
      const r = await buscarFontesAction(q);
      setResultados(r);
      setSalvos({});
    });
  }

  function salvar(fonte: ResultadoBusca) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("rotulo", fonte.rotulo);
      fd.set("norma", fonte.norma);
      fd.set("sobre", fonte.sobre);
      fd.set("url", fonte.url);
      await salvarFonteAction(fd);
      setSalvos((s) => ({ ...s, [fonte.id]: true }));
    });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={buscar} className="flex flex-wrap gap-2">
        <Input
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          placeholder="ex.: art. 306 CTB, inquérito policial, tráfico de drogas"
          aria-label="Buscar em fontes oficiais"
          className="min-w-[16rem] flex-1"
        />
        <Button type="submit" variant="primario" disabled={pending}>
          {pending ? "Buscando…" : "Buscar"}
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {SUGESTOES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={(e) => {
              setConsulta(s);
              buscar(e, s);
            }}
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-cinza hover:border-latao/40 hover:text-pergaminho"
          >
            {s}
          </button>
        ))}
      </div>

      {resultados !== null && resultados.length === 0 ? (
        <p role="status" className="text-sm text-cinza">
          Nenhuma fonte oficial casou com sua busca. Tente termos como o número do artigo,
          o nome da lei ou o assunto (ex.: “embriaguez”, “inquérito”).
        </p>
      ) : null}

      <ul className="space-y-3">
        {resultados?.map((f) => (
          <li key={f.id} className="rounded-md border border-white/10 p-3 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-pergaminho">{f.rotulo}</span>
              <div className="flex flex-wrap gap-1.5">
                {f.concursos.map((c) => (
                  <Badge key={c} tone="latiao">
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
            <p className="mt-1 text-xs text-cinza-escuro">{f.norma}</p>
            <p className="mt-2 text-sm text-pergaminho/90">{f.sobre}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-latao underline"
              >
                Abrir fonte oficial
              </a>
              <button
                type="button"
                onClick={() => salvar(f)}
                disabled={pending || salvos[f.id]}
                className="text-cinza underline hover:text-pergaminho disabled:opacity-50"
              >
                {salvos[f.id] ? "salvo na biblioteca ✓" : "salvar na minha biblioteca"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
