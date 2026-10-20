"use client";

import { useActionState, useState } from "react";
import { saveMaterialAction, type ActionState } from "@/actions/materials";
import { Button } from "@/components/Button";
import { Field, Input, Select, Textarea } from "@/components/FormControls";

export function MaterialForm({ subjects }: { subjects: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveMaterialAction, { ok: true });
  const [type, setType] = useState("nota");

  return (
    <form action={action} className="mt-3" encType="multipart/form-data">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="title" label="Título">
          <Input id="title" name="title" required />
        </Field>
        <Field id="type" label="Tipo">
          <Select id="type" name="type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="nota">Nota / resumo</option>
            <option value="link">Link externo</option>
            <option value="arquivo">Arquivo (PDF, imagem, texto)</option>
            <option value="flashcard">Flashcard</option>
          </Select>
        </Field>
      </div>
      <Field id="description" label="Descrição">
        <Input id="description" name="description" />
      </Field>
      {type === "link" ? (
        <Field id="url" label="URL" hint="Prefira fontes oficiais e recursos abertos.">
          <Input id="url" name="url" type="url" placeholder="https://..." />
        </Field>
      ) : null}
      {type === "nota" || type === "flashcard" ? (
        <Field id="contentText" label={type === "flashcard" ? "Frente e verso (separe com ---)" : "Conteúdo"}>
          <Textarea id="contentText" name="contentText" rows={5} />
        </Field>
      ) : null}
      {type === "arquivo" ? (
        <Field id="file" label="Arquivo" hint="Até 10 MB. Formatos: PDF, PNG, JPG, WEBP, TXT, MD.">
          <Input
            id="file"
            name="file"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md,application/pdf,image/*,text/*"
          />
        </Field>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
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
        <Field id="tags" label="Etiquetas (separadas por vírgula)">
          <Input id="tags" name="tags" placeholder="edital, revisão, lei" />
        </Field>
      </div>
      <label className="mb-3 flex items-center gap-2 text-sm text-pergaminho/90">
        <input type="checkbox" name="aiGenerated" className="accent-latao" />
        Conteúdo gerado por IA (ficará sinalizado)
      </label>
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
        {pending ? "Salvando…" : "Adicionar material"}
      </Button>
    </form>
  );
}
