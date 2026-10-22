/**
 * Testes do envio de e-mail (Resend) — sem rede: o fetch é mockado.
 *
 * Regras cobertas:
 * - sem RESEND_API_KEY o envio falha de forma controlada (nunca lança);
 * - com a chave, o payload enviado ao Resend está correto (remetente, destino,
 *   assunto, HTML e versão texto);
 * - erro da API vira { ok: false, erro } com a mensagem do Resend;
 * - o link de recuperação aponta para /recuperar?token=... e o HTML traz a
 *   identidade visual do Moriarty.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  emailConfigurado,
  enviarEmail,
  htmlRecuperacaoSenha,
  linkRecuperacao,
  remetentePadrao,
  urlBase,
} from "@/lib/email";

const chaveOriginal = process.env.RESEND_API_KEY;
const fromOriginal = process.env.EMAIL_FROM;
const urlOriginal = process.env.APP_URL;

beforeEach(() => {
  process.env.RESEND_API_KEY = "re_teste";
  delete process.env.EMAIL_FROM;
  process.env.APP_URL = "https://moriarty-alpha.vercel.app/";
});

afterEach(() => {
  process.env.RESEND_API_KEY = chaveOriginal ?? "";
  if (fromOriginal === undefined) delete process.env.EMAIL_FROM;
  else process.env.EMAIL_FROM = fromOriginal;
  if (urlOriginal === undefined) delete process.env.APP_URL;
  else process.env.APP_URL = urlOriginal;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("configuração de e-mail", () => {
  it("detecta a chave configurada", () => {
    expect(emailConfigurado()).toBe(true);
    process.env.RESEND_API_KEY = "";
    expect(emailConfigurado()).toBe(false);
  });

  it("usa o remetente e a base configurados, sem barra final", () => {
    expect(remetentePadrao()).toBe("Moriarty <onboarding@resend.dev>");
    expect(urlBase()).toBe("https://moriarty-alpha.vercel.app");
    process.env.EMAIL_FROM = "Moriarty <conta@exemplo.com.br>";
    expect(remetentePadrao()).toBe("Moriarty <conta@exemplo.com.br>");
  });
});

describe("enviarEmail", () => {
  it("envia o payload correto para a API do Resend", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ id: "abc-123" }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await enviarEmail({
      para: "aluno@exemplo.com",
      assunto: "Recuperação de senha — Moriarty",
      html: "<p>olá</p>",
      texto: "olá",
    });

    expect(resultado).toEqual({ ok: true, id: "abc-123" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer re_teste");
    const corpo = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(corpo.to).toEqual(["aluno@exemplo.com"]);
    expect(corpo.subject).toBe("Recuperação de senha — Moriarty");
    expect(corpo.html).toBe("<p>olá</p>");
    expect(corpo.text).toBe("olá");
  });

  it("não lança quando a chave não existe", async () => {
    process.env.RESEND_API_KEY = "";
    const resultado = await enviarEmail({ para: "a@b.com", assunto: "x", html: "y" });
    expect(resultado.ok).toBe(false);
    expect(resultado.ok === false && resultado.erro).toMatch(/RESEND_API_KEY/);
  });

  it("converte erro da API em mensagem legível", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 422,
        text: async () => JSON.stringify({ message: "Domain is not verified" }),
      })),
    );
    const resultado = await enviarEmail({ para: "a@b.com", assunto: "x", html: "y" });
    expect(resultado.ok).toBe(false);
    expect(resultado.ok === false && resultado.erro).toMatch(/Domain is not verified/);
  });

  it("não quebra quando a rede falha", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNREFUSED");
      }),
    );
    const resultado = await enviarEmail({ para: "a@b.com", assunto: "x", html: "y" });
    expect(resultado.ok).toBe(false);
    expect(resultado.ok === false && resultado.erro).toMatch(/ECONNREFUSED/);
  });
});

describe("link de recuperação", () => {
  it("aponta para a página de recuperação com o token", () => {
    expect(linkRecuperacao("abc 123/x")).toBe(
      "https://moriarty-alpha.vercel.app/recuperar?token=abc%20123%2Fx",
    );
  });

  it("gera HTML com o link, o botão e a identidade do app", () => {
    const html = htmlRecuperacaoSenha("https://exemplo.com/recuperar?token=xyz");
    expect(html).toContain("https://exemplo.com/recuperar?token=xyz");
    expect(html).toContain("Redefinir minha senha");
    expect(html).toContain("Moriarty");
    expect(html).toContain("30 minutos");
    expect(html).toMatch(/não oficiais/);
  });
});
