"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

type Point = { label: string; value: number; planned?: number; detail?: string };

export function StudyChart({ kind, data }: { kind: "minutes" | "accuracy" | "trend"; data: Point[] }) {
  const ariaLabel =
    kind === "minutes"
      ? "Gráfico de minutos planejados e realizados por dia"
      : kind === "accuracy"
        ? "Gráfico de percentual de acertos por matéria"
        : "Gráfico de evolução de acertos em simulados";

  if (data.length === 0) {
    return <p className="mt-3 text-sm text-cinza">Sem dados no período.</p>;
  }

  return (
    <div className="mt-3 h-72" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        {kind === "trend" ? (
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: -12 }}>
            <CartesianGrid stroke="rgba(236,228,213,0.08)" />
            <XAxis dataKey="label" stroke="#a89f91" fontSize={11} tickLine={false} />
            <YAxis domain={[0, 100]} stroke="#a89f91" fontSize={11} tickLine={false} unit="%" />
            <Tooltip
              contentStyle={{ background: "#1b1815", border: "1px solid rgba(201,162,39,0.3)", borderRadius: 8 }}
              labelStyle={{ color: "#ece4d5" }}
              formatter={(v) => [`${String(v)}%`, "Aproveitamento"]}
            />
            <Line type="monotone" dataKey="value" stroke="#c9a227" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        ) : (
          <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: -12 }}>
            <CartesianGrid stroke="rgba(236,228,213,0.08)" />
            <XAxis dataKey="label" stroke="#a89f91" fontSize={11} tickLine={false} />
            <YAxis stroke="#a89f91" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "#1b1815", border: "1px solid rgba(201,162,39,0.3)", borderRadius: 8 }}
              labelStyle={{ color: "#ece4d5" }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {kind === "minutes" ? (
              <>
                <Bar dataKey="planned" name="Planejado (min)" fill="#6f675c" radius={[3, 3, 0, 0]} />
                <Bar dataKey="value" name="Realizado (min)" fill="#c9a227" radius={[3, 3, 0, 0]} />
              </>
            ) : (
              <Bar dataKey="value" name="Acerto (%)" fill="#2f6f62" radius={[3, 3, 0, 0]} />
            )}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
