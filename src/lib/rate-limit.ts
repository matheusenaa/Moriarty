import { execute, nowIso, queryOne } from "@/lib/db";

/**
 * Rate limiting das rotas de auth (login, cadastro, recuperação de senha).
 *
 * Como funciona:
 * - um "bucket" por chave (ex.: `login:aluno@exemplo.com`, `ip:203.0.113.7`);
 * - cada tentativa falha incrementa `hits`; a janela reinicia quando expira;
 * - o login bem-sucedido limpa o bucket da conta.
 *
 * O estado fica no Postgres (tabela `auth_rate_limits`, migração 0005) para
 * valer entre instâncias do serverless. Se a migração ainda não foi aplicada,
 * o limitador **degrada com segurança**: libera a operação e avisa no log
 * (nunca derruba o app).
 */

export type TipoBucket = "login" | "cadastro" | "recuperacao";

export type ResultadoLimite = {
  bloqueado: boolean;
  restantes: number;
  /** true quando a tabela de rate limit ainda não existe (modo degradado). */
  degradado: boolean;
};

const JANELA_PADRAO = { login: 15 * 60, cadastro: 60 * 60, recuperacao: 60 * 60 };

function ehTabelaAusente(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "42P01";
}

function emMinutos(segundos: number): number {
  return Math.max(1, Math.ceil(segundos / 60));
}

/** Chave do bucket (sem dados pessoais além do identificador já usado no login). */
export function chaveBucket(tipo: TipoBucket, identificador: string): string {
  return `${tipo}:${identificador.trim().toLowerCase()}`;
}

/** Instantâneo ISO de quando a janela atual termina. */
export function fimDaJanela(janelaSegundos: number, agora = Date.now()): string {
  return new Date(agora + janelaSegundos * 1000).toISOString();
}

/** True quando a janela iniciada em `windowStartedAt` já venceu. */
export function janelaExpirada(
  windowStartedAt: string,
  janelaSegundos: number,
  agora = Date.now(),
): boolean {
  const inicio = Date.parse(windowStartedAt);
  if (Number.isNaN(inicio)) return true;
  return inicio + janelaSegundos * 1000 <= agora;
}

function segundosDaJanela(tipo: TipoBucket): number {
  return JANELA_PADRAO[tipo];
}

/** Verifica o estado atual do bucket sem incrementar. */
export async function checarLimite(
  tipo: TipoBucket,
  identificador: string,
  limite: number,
  janelaSegundos = segundosDaJanela(tipo),
): Promise<ResultadoLimite> {
  const bucket = chaveBucket(tipo, identificador);
  try {
    const row = await queryOne<{ hits: number; window_started_at: string }>(
      "select hits, window_started_at from auth_rate_limits where bucket = $1",
      [bucket],
    );
    if (!row) return { bloqueado: false, restantes: limite, degradado: false };
    if (janelaExpirada(row.window_started_at, janelaSegundos)) {
      return { bloqueado: false, restantes: limite, degradado: false };
    }
    return {
      bloqueado: row.hits >= limite,
      restantes: Math.max(0, limite - row.hits),
      degradado: false,
    };
  } catch (err) {
    if (ehTabelaAusente(err)) {
      console.warn(
        "[rate-limit] tabela auth_rate_limits ausente (migração 0005 não aplicada): liberando operação.",
      );
      return { bloqueado: false, restantes: limite, degradado: true };
    }
    throw err;
  }
}

/** Registra uma tentativa (falha). Incrementa o contador ou reinicia a janela. */
export async function registrarTentativa(
  tipo: TipoBucket,
  identificador: string,
  janelaSegundos = segundosDaJanela(tipo),
): Promise<void> {
  const bucket = chaveBucket(tipo, identificador);
  const agora = nowIso();
  // Instante a partir do qual a janela atual é considerada vencida.
  const vencimento = new Date(Date.now() - janelaSegundos * 1000).toISOString();
  try {
    await execute(
      `insert into auth_rate_limits (bucket, hits, window_started_at, updated_at)
       values ($1, 1, $2, $3)
       on conflict (bucket) do update set
         hits = case
           when auth_rate_limits.window_started_at <= $4 then 1
           else auth_rate_limits.hits + 1
         end,
         window_started_at = case
           when auth_rate_limits.window_started_at <= $4 then $3
           else auth_rate_limits.window_started_at
         end,
         updated_at = $3`,
      [bucket, agora, agora, vencimento],
    );
  } catch (err) {
    if (ehTabelaAusente(err)) return; // modo degradado: sem contagem, sem quebrar o fluxo
    throw err;
  }
}

/** Limpa o bucket (usado após um login bem-sucedido). */
export async function limparBucket(tipo: TipoBucket, identificador: string): Promise<void> {
  try {
    await execute("delete from auth_rate_limits where bucket = $1", [chaveBucket(tipo, identificador)]);
  } catch (err) {
    if (ehTabelaAusente(err)) return;
    throw err;
  }
}

/** Limpa buckets antigos (janelas vencidas há mais de 24 h). Rodar periodicamente (opcional). */
export async function limparJanelasVencidas(): Promise<number> {
  const limite = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  try {
    return await execute("delete from auth_rate_limits where window_started_at <= $1", [limite]);
  } catch (err) {
    if (ehTabelaAusente(err)) return 0;
    throw err;
  }
}

/** Mensagem padrão para o usuário quando o limite é atingido. */
export function mensagemLimite(tipo: TipoBucket): string {
  const minutos = emMinutos(segundosDaJanela(tipo));
  if (minutos >= 60) {
    const horas = Math.round(minutos / 60);
    return `Muitas tentativas. Aguarde ${horas} ${horas === 1 ? "hora" : "horas"} e tente novamente.`;
  }
  return `Muitas tentativas. Aguarde ${minutos} minutos e tente novamente.`;
}
