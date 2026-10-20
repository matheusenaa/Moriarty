"use client";

import { useState, useTransition } from "react";
import { exportDataAction } from "@/actions/profile";
import { Button } from "@/components/Button";

export function ExportButton() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function exportar() {
    startTransition(async () => {
      setError("");
      const result = await exportDataAction();
      if (!result.ok || !result.data) {
        setError(result.error ?? "Não foi possível exportar.");
        return;
      }
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `moriarty-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="mt-2">
      <Button variant="primario" onClick={exportar} disabled={pending}>
        {pending ? "Gerando…" : "Exportar meus dados (JSON)"}
      </Button>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-alerta-claro">
          {error}
        </p>
      ) : null}
    </div>
  );
}
