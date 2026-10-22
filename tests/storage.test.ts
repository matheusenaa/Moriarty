/**
 * Testes do adaptador de armazenamento de arquivos (Supabase Storage / disco local).
 * Rodam offline: o fetch é simulado com mock.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  bucketStorage,
  chaveObjeto,
  caminhoSeguro,
  lerArquivo,
  modoArmazenamento,
  removerArquivo,
  salvarArquivo,
  storageConfigurado,
} from "@/lib/storage";

const envOriginal = { ...process.env };

beforeEach(() => {
  process.env.SUPABASE_URL = "https://proj.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "chave-secreta";
  process.env.SUPABASE_STORAGE_BUCKET = "moriarty";
  delete process.env.UPLOADS_DIR;
});

afterEach(() => {
  process.env = { ...envOriginal };
  vi.restoreAllMocks();
});

describe("storage — configuração", () => {
  it("usa o bucket padrão quando nada é informado", () => {
    delete process.env.SUPABASE_STORAGE_BUCKET;
    expect(bucketStorage()).toBe("moriarty");
  });

  it("detecta se o Supabase Storage está configurado", () => {
    expect(storageConfigurado()).toBe(true);
    expect(modoArmazenamento()).toBe("supabase");
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(storageConfigurado()).toBe(false);
    expect(modoArmazenamento()).toBe("disco");
  });

  it("monta a chave do objeto com o prefixo uploads/", () => {
    expect(chaveObjeto("abc-123/arquivo.pdf")).toBe("uploads/abc-123/arquivo.pdf");
  });

  it("bloqueia travessia de diretório", () => {
    expect(caminhoSeguro("abc/arquivo.pdf")).toBe(true);
    expect(caminhoSeguro("../segredo")).toBe(false);
    expect(caminhoSeguro("abc/../../segredo")).toBe(false);
    expect(caminhoSeguro("/etc/passwd")).toBe(false);
    expect(caminhoSeguro("")).toBe(false);
  });
});

describe("storage — Supabase Storage", () => {
  it("envia o arquivo para a API de objetos com a service role key", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await salvarArquivo("u1/arquivo.pdf", Buffer.from("conteudo"), "application/pdf");

    expect(resultado).toEqual({ ok: true, modo: "supabase" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://proj.supabase.co/storage/v1/object/moriarty/uploads/u1/arquivo.pdf");
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer chave-secreta");
    expect(headers["Content-Type"]).toBe("application/pdf");
  });

  it("relata o erro quando o bucket recusa o arquivo", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("bucket not found", { status: 404 })),
    );
    const resultado = await salvarArquivo("u1/arquivo.pdf", Buffer.from("x"), "application/pdf");
    expect(resultado.ok).toBe(false);
    expect(resultado.modo).toBe("supabase");
    expect(resultado.erro).toContain("404");
  });

  it("lê o arquivo e devolve null quando não existe", async () => {
    const fetchMock = vi.fn(async () => new Response("conteudo", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const buffer = await lerArquivo("u1/arquivo.pdf");
    expect(buffer?.toString()).toBe("conteudo");

    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 404 })));
    expect(await lerArquivo("u1/arquivo.pdf")).toBeNull();
  });

  it("remove o arquivo", async () => {
    const fetchMock = vi.fn(async () => new Response("", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await removerArquivo("u1/arquivo.pdf")).toBe(true);
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.method).toBe("DELETE");
  });
});

describe("storage — fallback em disco", () => {
  it("grava e lê o arquivo localmente", async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const tmp = `${process.env.TEMP ?? "."}\\moriarty-storage-teste`;
    process.env.UPLOADS_DIR = tmp;

    const salvo = await salvarArquivo("u1/arquivo.txt", Buffer.from("olá"), "text/plain");
    expect(salvo).toEqual({ ok: true, modo: "disco" });

    const buffer = await lerArquivo("u1/arquivo.txt");
    expect(buffer?.toString()).toBe("olá");

    expect(await removerArquivo("u1/arquivo.txt")).toBe(true);
    expect(await lerArquivo("u1/arquivo.txt")).toBeNull();
  });
});
