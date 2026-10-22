/**
 * Testes do rate limiting das rotas de auth.
 *
 * A parte pura (chave do bucket, expiração da janela, mensagens) roda sem banco.
 * A parte com banco (contagem real, bloqueio, limpeza) fica em `security.test.ts`,
 * que exige Postgres.
 */
import { describe, expect, it } from "vitest";
import {
  chaveBucket,
  fimDaJanela,
  janelaExpirada,
  mensagemLimite,
} from "@/lib/rate-limit";
import { identificadorIp } from "@/lib/request";

describe("rate limit — parte pura", () => {
  it("monta a chave do bucket normalizando o identificador", () => {
    expect(chaveBucket("login", "Aluno@Exemplo.COM")).toBe("login:aluno@exemplo.com");
    expect(chaveBucket("recuperacao", identificadorIp("203.0.113.7"))).toBe("recuperacao:ip:203.0.113.7");
  });

  it("distingue buckets de e-mail e de IP", () => {
    expect(chaveBucket("login", "aluno@exemplo.com")).not.toBe(chaveBucket("login", identificadorIp("aluno@exemplo.com")));
  });

  it("calcula o fim da janela", () => {
    const inicio = Date.parse("2026-10-22T10:00:00.000Z");
    expect(fimDaJanela(900, inicio)).toBe("2026-10-22T10:15:00.000Z");
  });

  it("detecta janela expirada comparando datas ISO", () => {
    const agora = Date.parse("2026-10-22T10:00:00.000Z");
    // janela de 15 min: iniciada às 09:00 já venceu
    expect(janelaExpirada("2026-10-22T09:00:00.000Z", 900, agora)).toBe(true);
    expect(janelaExpirada("2026-10-22T09:45:00.000Z", 900, agora)).toBe(true);
    // iniciada às 09:46 ainda está dentro da janela
    expect(janelaExpirada("2026-10-22T09:46:00.000Z", 900, agora)).toBe(false);
    expect(janelaExpirada("2026-10-22T10:00:00.000Z", 900, agora)).toBe(false);
    // data inválida é tratada como vencida
    expect(janelaExpirada("data-invalida", 900, agora)).toBe(true);
  });

  it("usa mensagens coerentes por janela", () => {
    expect(mensagemLimite("login")).toMatch(/15 minutos/);
    expect(mensagemLimite("recuperacao")).toMatch(/1 hora/);
    expect(mensagemLimite("cadastro")).toMatch(/1 hora/);
  });

  it("a mensagem não revela se a conta existe", () => {
    const msg = mensagemLimite("login");
    expect(msg).not.toMatch(/e-mail|cadastrado|senha/i);
  });
});
