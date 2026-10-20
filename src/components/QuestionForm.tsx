"use client";

import { useActionState, useState } from "react";
import { saveQuestionAction, type ActionState } from "@/actions/questions";
import { Button } from "@/components/Button";
import { Field, Input, Select, Textarea } from "@/components/FormControls";

export function QuestionForm({ subjects }: { subjects: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveQuestionAction, { ok: true });
  const [type, setType] = useState("multipla");
  const [options, setOptions] = useState(["", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);

  const isMc = type === "multipla";

  return (
    <form action={action} className="mt-3">
      <Field id="statement" label="Enunciado">
        <Textarea id="statement" name="statement" rows={4} required minLength={10} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="type" label="Tipo">
          <Select id="type" name="type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="multipla">Múltipla escolha</option>
            <option value="certo_errado">Certo / errado</option>
          </Select>
        </Field>
        <Field id="subjectId" label="Matéria">
          <Select id="subjectId" name="subjectId" defaultValue="">
            <option value="">Sem matéria</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="difficulty" label="Dificuldade (1 a 5)">
          <Select id="difficulty" name="difficulty" defaultValue={3}>
            {[1, 2, 3, 4, 5].map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="sourceName" label="Fonte (opcional)">
          <Input id="sourceName" name="sourceName" placeholder="Ex.: TRF 2023" />
        </Field>
      </div>
      <Field id="origin" label="Origem">
        <Select id="origin" name="origin" defaultValue="autoral">
          <option value="autoral">Autoral (minha)</option>
          <option value="ia">Gerada por IA (revise antes de usar)</option>
          <option value="importada">Importada de fonte que tenho permissão</option>
        </Select>
      </Field>

      {isMc ? (
        <div className="mb-3">
          <p className="mb-1 text-sm font-medium">Alternativas</p>
          {options.map((opt, i) => (
            <div key={i} className="mb-2 flex items-center gap-2">
              <input
                type="radio"
                name="correctIndex"
                value={i}
                checked={correctIndex === i}
                onChange={() => setCorrectIndex(i)}
                aria-label={`Marcar alternativa ${i + 1} como correta`}
                className="accent-petroleo"
              />
              <Input
                aria-label={`Alternativa ${i + 1}`}
                value={opt}
                onChange={(e) => setOptions(options.map((o, j) => (j === i ? e.target.value : o)))}
                placeholder={`Alternativa ${i + 1}`}
                required
              />
              {options.length > 2 ? (
                <button
                  type="button"
                  className="text-xs text-alerta-claro"
                  onClick={() => {
                    const next = options.filter((_, j) => j !== i);
                    setOptions(next);
                    if (correctIndex >= next.length) setCorrectIndex(0);
                  }}
                >
                  rem
                </button>
              ) : null}
            </div>
          ))}
          <Button type="button" variant="fantasma" onClick={() => setOptions([...options, ""])} disabled={options.length >= 6}>
            + alternativa
          </Button>
          <input type="hidden" name="options" value={JSON.stringify(options)} />
        </div>
      ) : (
        <input type="hidden" name="options" value={JSON.stringify(["Certo", "Errado"])} />
      )}
      {isMc ? <input type="hidden" name="correctIndex" value={correctIndex} /> : <input type="hidden" name="correctIndex" value={0} />}

      <Field id="explanation" label="Explicação (opcional)">
        <Textarea id="explanation" name="explanation" rows={2} />
      </Field>

      {state.message ? (
        <p role="status" className="mb-2 text-sm text-petroleo-claro">
          {state.message}
        </p>
      ) : null}
      {!state.ok && state.error ? (
        <p role="alert" className="mb-2 text-sm text-alerta-claro">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" variant="primario" disabled={pending}>
        {pending ? "Salvando…" : "Salvar questão"}
      </Button>
    </form>
  );
}
