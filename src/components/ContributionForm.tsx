"use client";

import { useState, useActionState } from "react";
import { createContributionAction } from "@/actions/contributions";
import { TIPOS_CONTRIBUICAO } from "@/lib/contributions";
import { Input, Textarea, Select, Field } from "@/components/FormControls";
import { cn } from "@/lib/cn";

const TRILHAS = [
  { slug: "pf-policial-2025", label: "PF – Policial 2025" },
  { slug: "prf-policial", label: "PRF – Policial" },
  { slug: "pmdf-cfo", label: "PMDF – CFO" },
  { slug: "pmdf-soldado", label: "PMDF – Soldado" },
  { slug: "pcdf-agente", label: "PCDF – Agente" },
  { slug: "policia-penal", label: "Polícia Penal" },
];

const KIND_HINT: Record<string, string> = {
  nota: "Resumo, esquema, mnemônico ou anotação sobre um tema da trilha.",
  questao: "Enunciado + 2–6 alternativas + gabarito + explicação detalhada.",
  flashcard:
    'Use o formato exato "Frente: ... Verso: ..." no conteúdo (uma linha cada). Ex.: Frente: O que é... Verso: É ...',
};

type Props = { defaultCollectionSlug?: string };

export function ContributionForm({ defaultCollectionSlug }: Props) {
  const [kind, setKind] = useState<"nota" | "questao" | "flashcard">("nota");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);
  const [state, action, pending] = useActionState(createContributionAction, {
    ok: true,
  });

  const isQuestao = kind === "questao";
  const isFlashcard = kind === "flashcard";

  function handleKindChange(newKind: "nota" | "questao" | "flashcard") {
    setKind(newKind);
    if (newKind === "questao") {
      setOptions((prev) => (prev.length < 2 ? ["", ""] : prev));
    } else {
      setOptions(["", ""]);
    }
    setCorrectIndex(null);
  }

  function handleOptionChange(index: number, value: string) {
    const next = [...options];
    next[index] = value;
    setOptions(next);
  }

  function addOption() {
    if (options.length >= 6) return;
    setOptions([...options, ""]);
  }

  function removeOption(index: number) {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  }

  function renderOptions() {
    return options.map((opt, i) => (
      <div key={i} className="flex items-center gap-2">
        <Input
          value={opt}
          onChange={(e) => handleOptionChange(i, e.target.value)}
          placeholder={`Alternativa ${String.fromCharCode(65 + i)}`}
        />
        {isQuestao && (
          <label className="flex items-center gap-1.5 text-sm text-pergaminho/90">
            <input
              type="radio"
              name="correctIndex"
              checked={correctIndex === i}
              onChange={() => setCorrectIndex(i)}
              className="accent-latao"
            />
            Gabarito
          </label>
        )}
        {options.length > 2 && (
          <button
            type="button"
            onClick={() => removeOption(i)}
            className="text-cinza hover:text-alerta text-sm"
            title="Remover"
          >
            ✕
          </button>
        )}
      </div>
    ));
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="collectionSlug" value={defaultCollectionSlug ?? TRILHAS[0].slug} />

      <Field id="collectionSlug" label="Trilha destino">
        <Select
          name="collectionSlug"
          required
          className="w-full"
          key={defaultCollectionSlug}
          defaultValue={defaultCollectionSlug ?? TRILHAS[0].slug}
        >
          {TRILHAS.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.label}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid gap-3 sm:grid-cols-3">
        {TIPOS_CONTRIBUICAO.map((t) => (
          <label
            key={t.valor}
            className={cn(
              "relative rounded-md border p-3 cursor-pointer transition-colors text-sm",
              kind === t.valor
                ? "border-latao/60 bg-latao/10 text-pergaminho"
                : "border-white/10 text-cinza hover:border-latao/30",
            )}
          >
            <input
              type="radio"
              name="kind"
              value={t.valor}
              checked={kind === t.valor}
              onChange={() => handleKindChange(t.valor)}
              className="sr-only"
            />
            <strong className="block">{t.label}</strong>
            <p className="mt-1 text-xs text-cinza">{KIND_HINT[t.valor]}</p>
          </label>
        ))}
      </div>

      <Field id="title" label="Título">
        <Input name="title" required maxLength={160} placeholder="Ex.: Resumo: Princípios da Administração" />
      </Field>

      {isFlashcard ? (
        <>
          <Field id="frente" label="Frente (pergunta)">
            <Textarea
              name="body"
              required
              placeholder='Ex.: Frente: O que é improbidade administrativa? Verso: É o ato...'
              rows={4}
            />
          </Field>
          <p className="text-xs text-cinza">
            O conteúdo será salvo no formato <code>Frente: ... Verso: ...</code>.
          </p>
        </>
      ) : (
        <Field id="body" label="Conteúdo" hint={isQuestao ? "Enunciado da questão." : "Resumo, esquema ou anotação."}>
          <Textarea name="body" required minLength={10} maxLength={8000} rows={6} />
        </Field>
      )}

      {isQuestao && (
        <>
          <Field id="options" label="Alternativas (uma por linha)">
            <div className="space-y-2">{renderOptions()}</div>
            {options.length < 6 && (
              <button type="button" onClick={addOption} className="text-sm text-latao underline mt-1">
                + Adicionar alternativa
              </button>
            )}
            <p className="text-xs text-cinza">Mínimo 2, máximo 6. Marque a alternativa correta ao lado.</p>
          </Field>
          <Field id="explanation" label="Explicação do gabarito">
            <Textarea name="explanation" required minLength={10} maxLength={5000} rows={3} />
          </Field>
        </>
      )}

      <Field id="sourceUrl" label="Link da fonte oficial (opcional)">
        <Input
          name="sourceUrl"
          type="url"
          placeholder="https://www.planalto.gov.br/ccivil_03/leis/l8429.htm"
        />
      </Field>

      <Field id="sourceLabel" label="Rótulo da fonte (opcional)">
        <Input
          name="sourceLabel"
          placeholder="Lei 8.429/92 – Art. 11"
        />
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-latao/50 bg-latao/10 px-4 py-2 text-sm font-medium text-latao hover:bg-latao/20 disabled:opacity-40"
        >
          {pending ? "Enviando..." : "Enviar sugestão"}
        </button>
        {state.error && <p className="text-sm text-alerta">{state.error}</p>}
        {state.message && <p className="text-sm text-petroleo">{state.message}</p>}
      </div>
    </form>
  );
}