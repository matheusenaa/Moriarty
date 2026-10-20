"use client";

import { useState, useTransition } from "react";
import { buildQuizAction, startQuizAction } from "@/actions/questions";
import { Button } from "@/components/Button";
import { Field, Input, Select } from "@/components/FormControls";

export function QuizBuilder({ subjects, totalQuestions }: { subjects: { id: string; name: string }[]; totalQuestions: number }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState("pratica");

  function submit(formData: FormData) {
    startTransition(async () => {
      setError("");
      setMessage("");
      const result = await buildQuizAction({ ok: true }, formData);
      if (!result.ok) {
        setError(result.error ?? "Erro ao criar simulado.");
        return;
      }
      const quizId = result.data?.quizId as string | undefined;
      if (!quizId) {
        setError("Não foi possível identificar o simulado criado.");
        return;
      }
      const startFd = new FormData();
      startFd.set("id", quizId);
      await startQuizAction(startFd);
    });
  }

  return (
    <form action={submit} className="mt-3">
      <Field id="title" label="Título">
        <Input id="title" name="title" required defaultValue="Simulado — " />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="mode" label="Modo">
          <Select id="mode" name="mode" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="pratica">Prática (comentários no resultado)</option>
            <option value="simulado">Simulado (gabarito só ao final)</option>
          </Select>
        </Field>
        <Field id="subjectId" label="Filtrar por matéria">
          <Select id="subjectId" name="subjectId" defaultValue="">
            <option value="">Todas as matérias</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="count" label="Quantidade de questões">
          <Input
            id="count"
            name="count"
            type="number"
            min={1}
            max={Math.max(1, totalQuestions)}
            defaultValue={Math.min(10, totalQuestions)}
            required
          />
        </Field>
        <Field id="timeLimitMinutes" label="Tempo limite (min, 0 = sem limite)">
          <Input id="timeLimitMinutes" name="timeLimitMinutes" type="number" min={0} max={480} defaultValue={0} />
        </Field>
      </div>
      <label className="mb-3 flex items-center gap-2 text-sm">
        <input type="checkbox" name="shuffle" defaultChecked className="accent-latao" />
        Embaralhar questões e alternativas
      </label>
      {message ? (
        <p role="status" className="mb-2 text-sm text-petroleo-claro">
          {message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mb-2 text-sm text-alerta-claro">
          {error}
        </p>
      ) : null}
      <Button type="submit" variant="primario" disabled={pending}>
        {pending ? "Montando…" : "Criar e iniciar"}
      </Button>
    </form>
  );
}
