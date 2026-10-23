export type UserStatus = "ocupado" | "estudando" | "revisando" | "disponivel";

export const USER_STATUSES: readonly UserStatus[] = [
  "ocupado",
  "estudando",
  "revisando",
  "disponivel",
];

export const STATUS_LABEL: Record<UserStatus, string> = {
  ocupado: "Ocupado",
  estudando: "Estudando",
  revisando: "Revisando",
  disponivel: "Disponível",
};

export const STATUS_EMOJI: Record<UserStatus, string> = {
  ocupado: "🔴",
  estudando: "📚",
  revisando: "🔁",
  disponivel: "🟢",
};

export const STATUS_TONE: Record<UserStatus, "alerta" | "latiao" | "petroleo" | "neutro"> = {
  ocupado: "alerta",
  estudando: "latiao",
  revisando: "petroleo",
  disponivel: "neutro",
};

export function normalizarStatus(value: unknown): UserStatus {
  const status = String(value ?? "");
  return (USER_STATUSES as readonly string[]).includes(status) ? (status as UserStatus) : "disponivel";
}
