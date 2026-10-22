import { headers } from "next/headers";

/**
 * IP do cliente (para rate limiting). Só funciona durante uma requisição —
 * fora dela devolve "desconhecido".
 */
export async function ipDoRequisicao(): Promise<string> {
  try {
    const h = await headers();
    const fwd = h.get("x-forwarded-for");
    if (fwd) {
      const primeiro = fwd.split(",")[0]?.trim();
      if (primeiro) return primeiro;
    }
    const real = h.get("x-real-ip");
    if (real?.trim()) return real.trim();
    return "desconhecido";
  } catch {
    return "desconhecido";
  }
}

/** Identificador do bucket de IP (prefixo para não colidir com e-mails). */
export function identificadorIp(ip: string): string {
  return `ip:${ip}`;
}
