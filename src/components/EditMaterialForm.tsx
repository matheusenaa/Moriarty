"use client";

import { useActionState } from "react";
import { updateMaterialAction, type ActionState } from "@/actions/materials";
import { Button } from "@/components/Button";
import { Field, Input, Select, Textarea } from "@/components/FormControls";

export function EditMaterialForm({
  material,
  subjects,
}: {
  material: {
    id: string;
    title: string;
    description: string;
    content_text: string;
    url: string;
    subject_id: string | null;
  };
  subjects: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateMaterialAction, { ok: true });

  return (
    <form action={action} className="mt-3">
      <input type="hidden" name="id" value={material.id} />
      <input type="hidden" name="type" value="nota" />
      <Field id="title" label="Título">
        <Input id="title" name="title" required defaultValue={material.title} />
      </Field>
      <Field id="description" label="Descrição">
        <Input id="description" name="description" defaultValue={material.description} />
      </Field>
      <Field id="contentText" label="Conteúdo / notas">
        <Textarea id="contentText" name="contentText" rows={6} defaultValue={material.content_text} />
      </Field>
      <Field id="url" label="URL (se houver)">
        <Input id="url" name="url" type="url" defaultValue={material.url} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="subjectId" label="Matéria">
          <Select id="subjectId" name="subjectId" defaultValue={material.subject_id ?? ""}>
            <option value="">Sem matéria</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="tags" label="Etiquetas">
          <Input id="tags" name="tags" />
        </Field>
      </div>
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
        {pending ? "Salvando…" : "Salvar alterações"}
      </Button>
    </form>
  );
}
