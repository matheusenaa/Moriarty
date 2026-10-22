import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

/**
 * Armazenamento dos arquivos privados enviados pelo usuário.
 *
 * - **Supabase Storage** (REST) quando `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` estão
 *   definidos. É o modo recomendado em produção: o disco da Vercel é efêmero e somente leitura.
 * - **Disco local** como fallback (desenvolvimento). Os arquivos ficam em `uploads/<userId>/<nome>`
 *   e somem a cada novo deploy.
 *
 * O caminho guardado no banco (`materials.file_path`) é sempre relativo à raiz de uploads
 * (`<userId>/<nome>`), nos dois modos — assim nada precisa mudar no banco ao trocar de storage.
 */

const RAIZ_UPLOADS = "uploads";

export type ModoArmazenamento = "supabase" | "disco";

export type ResultadoSalvar = { ok: boolean; modo: ModoArmazenamento; erro?: string };

function env(nome: string): string {
  return (process.env[nome] ?? "").trim();
}

/** Nome do bucket (padrão "moriarty"). */
export function bucketStorage(): string {
  return env("SUPABASE_STORAGE_BUCKET") || "moriarty";
}

/** true quando o Supabase Storage está configurado e será usado. */
export function storageConfigurado(): boolean {
  return Boolean(env("SUPABASE_URL") && env("SUPABASE_SERVICE_ROLE_KEY"));
}

/** Modo que será usado agora (para exibir avisos na interface). */
export function modoArmazenamento(): ModoArmazenamento {
  return storageConfigurado() ? "supabase" : "disco";
}

export type StatusStorage = {
  modo: ModoArmazenamento;
  bucket: string;
  /** Ref do projeto Supabase usado (diagnóstico). */
  projeto?: string;
  /** null quando não há Supabase configurado; true/false quando o bucket foi testado. */
  bucketOk: boolean | null;
  /** HTTP status da verificação do bucket (null quando não há Supabase configurado). */
  status?: number;
  /** HTTP status da listagem de buckets. */
  statusLista?: number;
  /** Nomes dos buckets visíveis no projeto (só quando o bucket esperado não foi encontrado). */
  buckets?: string[];
  erro?: string;
};

/** Ref do projeto (o "lprclzopokdcmoqcdhjz" da URL). */
export function projetoSupabase(): string {
  const m = baseUrl().match(/https?:\/\/([a-z0-9-]+)\.supabase\./i);
  return m ? m[1] : "desconhecido";
}

/** Testa o bucket configurado (usado no diagnóstico de saúde). */
export async function verificarStorage(): Promise<StatusStorage> {
  const bucket = bucketStorage();
  if (!storageConfigurado()) return { modo: "disco", bucket, bucketOk: null };
  const projeto = projetoSupabase();
  try {
    const res = await fetch(`${baseUrl()}/storage/v1/bucket/${encodeURIComponent(bucket)}`, {
      headers: cabecalhos(),
    });
    if (res.ok) return { modo: "supabase", bucket, projeto, bucketOk: true, status: res.status };

    // O bucket não foi encontrado: lista os buckets do projeto para diagnóstico.
    let buckets: string[] = [];
    let statusLista = 0;
    try {
      const lista = await fetch(`${baseUrl()}/storage/v1/bucket`, { headers: cabecalhos() });
      statusLista = lista.status;
      if (lista.ok) {
        const json = (await lista.json()) as { name?: string }[];
        buckets = json.map((b) => String(b.name ?? "")).filter(Boolean);
      }
    } catch {
      buckets = [];
    }
    return {
      modo: "supabase",
      bucket,
      projeto,
      bucketOk: false,
      status: res.status,
      statusLista,
      buckets,
      erro: `HTTP ${res.status}`,
    };
  } catch (err) {
    return { modo: "supabase", bucket, projeto, bucketOk: false, erro: erroDe(err).slice(0, 120) };
  }
}

function baseUrl(): string {
  return env("SUPABASE_URL").replace(/\/+$/, "");
}

function cabecalhos(mime?: string): Record<string, string> {
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  const headers: Record<string, string> = { apikey: key, Authorization: `Bearer ${key}` };
  if (mime) headers["Content-Type"] = mime;
  return headers;
}

/** Converte o caminho relativo (`<userId>/<nome>`) na chave do objeto no bucket. */
export function chaveObjeto(caminhoRelativo: string): string {
  const partes = caminhoRelativo
    .split("/")
    .filter(Boolean)
    .map((p) => encodeURIComponent(p));
  return `${RAIZ_UPLOADS}/${partes.join("/")}`;
}

/** Valida o caminho relativo (defesa contra travessia de diretório). */
export function caminhoSeguro(caminhoRelativo: string): boolean {
  if (!caminhoRelativo) return false;
  const normalizado = path.normalize(caminhoRelativo);
  if (normalizado.startsWith("..") || path.isAbsolute(normalizado)) return false;
  return normalizado.replace(/\\/g, "/").split("/").every((p) => p && p !== "." && p !== "..");
}

function urlObjeto(caminhoRelativo: string): string {
  return `${baseUrl()}/storage/v1/object/${encodeURIComponent(bucketStorage())}/${chaveObjeto(caminhoRelativo)}`;
}

/** Raiz dos uploads no disco (padrão `<cwd>/uploads`). */
function raizDisco(): string {
  return env("UPLOADS_DIR") || path.join(process.cwd(), RAIZ_UPLOADS);
}

function caminhoDisco(caminhoRelativo: string): string {
  return path.join(raizDisco(), caminhoRelativo);
}

/** Salva o arquivo e devolve o modo usado. */
export async function salvarArquivo(
  caminhoRelativo: string,
  buffer: Buffer,
  mime: string,
): Promise<ResultadoSalvar> {
  if (!caminhoSeguro(caminhoRelativo)) {
    return { ok: false, modo: modoArmazenamento(), erro: "Caminho de arquivo inválido." };
  }
  if (storageConfigurado()) {
    try {
      const res = await fetch(urlObjeto(caminhoRelativo), {
        method: "POST",
        headers: cabecalhos(mime),
        body: new Uint8Array(buffer),
      });
      if (!res.ok) {
        const texto = await res.text().catch(() => "");
        return {
          ok: false,
          modo: "supabase",
          erro: `Supabase Storage respondeu ${res.status}. ${texto.slice(0, 200)}`.trim(),
        };
      }
      return { ok: true, modo: "supabase" };
    } catch (err) {
      return { ok: false, modo: "supabase", erro: erroDe(err) };
    }
  }
  try {
    const destino = caminhoDisco(caminhoRelativo);
    await mkdir(path.dirname(destino), { recursive: true });
    await writeFile(destino, buffer);
    return { ok: true, modo: "disco" };
  } catch (err) {
    return { ok: false, modo: "disco", erro: erroDe(err) };
  }
}

/** Lê o arquivo (null se não existir). */
export async function lerArquivo(caminhoRelativo: string): Promise<Buffer | null> {
  if (!caminhoSeguro(caminhoRelativo)) return null;
  if (storageConfigurado()) {
    try {
      const res = await fetch(urlObjeto(caminhoRelativo), { headers: cabecalhos() });
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    } catch {
      return null;
    }
  }
  try {
    return await readFile(caminhoDisco(caminhoRelativo));
  } catch {
    return null;
  }
}

/** Remove o arquivo (best effort). */
export async function removerArquivo(caminhoRelativo: string): Promise<boolean> {
  if (!caminhoSeguro(caminhoRelativo)) return false;
  if (storageConfigurado()) {
    try {
      const res = await fetch(urlObjeto(caminhoRelativo), {
        method: "DELETE",
        headers: cabecalhos(),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
  try {
    await unlink(caminhoDisco(caminhoRelativo));
    return true;
  } catch {
    return false;
  }
}

function erroDe(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "erro desconhecido";
}
