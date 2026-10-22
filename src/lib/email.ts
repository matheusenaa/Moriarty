/**
 * Envio de e-mail (Resend) — somente no servidor.
 *
 * Variáveis de ambiente:
 * - RESEND_API_KEY: chave da API do Resend (obrigatória para habilitar o envio);
 * - EMAIL_FROM: remetente (padrão: "Moriarty <onboarding@resend.dev>");
 * - APP_URL: base pública do app (usada nos links dos e-mails).
 *
 * Sem RESEND_API_KEY o app continua funcionando: quem chama decide o fallback
 * (nunca lança exceção por falta de e-mail).
 */

export type ResultadoEnvio = { ok: true; id: string } | { ok: false; erro: string };

const ENDPOINT_RESEND = "https://api.resend.com/emails";

export function emailConfigurado(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function remetentePadrao(): string {
  return process.env.EMAIL_FROM?.trim() || "Moriarty <onboarding@resend.dev>";
}

export function urlBase(): string {
  return (process.env.APP_URL?.trim() || "https://moriarty-alpha.vercel.app").replace(/\/+$/, "");
}

/** Envia um e-mail. Nunca lança: devolve { ok: false, erro } em caso de falha. */
export async function enviarEmail({
  para,
  assunto,
  html,
  texto,
}: {
  para: string;
  assunto: string;
  html: string;
  texto?: string;
}): Promise<ResultadoEnvio> {
  const chave = process.env.RESEND_API_KEY?.trim();
  if (!chave) return { ok: false, erro: "RESEND_API_KEY não configurada" };

  try {
    const res = await fetch(ENDPOINT_RESEND, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${chave}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: remetentePadrao(),
        to: [para],
        subject: assunto,
        html,
        text: texto ?? html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      }),
    });

    const corpo = await res.text();
    if (!res.ok) {
      let detalhe = corpo.slice(0, 300);
      try {
        const json = JSON.parse(corpo) as { message?: string; name?: string };
        detalhe = json.message ?? json.name ?? detalhe;
      } catch {
        /* resposta não-JSON: mantém o corpo bruto */
      }
      return { ok: false, erro: `Resend respondeu ${res.status}: ${detalhe}` };
    }

    let id = "";
    try {
      id = (JSON.parse(corpo) as { id?: string }).id ?? "";
    } catch {
      /* id é opcional */
    }
    return { ok: true, id };
  } catch (err) {
    return { ok: false, erro: err instanceof Error ? err.message : "erro desconhecido" };
  }
}

/** Monta o link de recuperação de senha. */
export function linkRecuperacao(token: string): string {
  return `${urlBase()}/recuperar?token=${encodeURIComponent(token)}`;
}

/** E-mail com a identidade visual do Moriarty (HTML inline, sem CSS externo). */
export function htmlRecuperacaoSenha(link: string): string {
  return `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;background:#12100e;color:#ece4d5;font-family:Georgia,'Times New Roman',serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#12100e;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#1b1815;border:1px solid #3a2e24;border-radius:10px;overflow:hidden;">
            <tr>
              <td style="background:#1b1815;padding:24px 28px;border-bottom:2px solid #c9a227;">
                <p style="margin:0;font-size:12px;letter-spacing:4px;text-transform:uppercase;color:#c9a227;">Moriarty</p>
                <h1 style="margin:6px 0 0;font-size:22px;color:#ece4d5;">Recuperação de acesso</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#ece4d5;">
                  Recebemos um pedido para redefinir a senha da sua conta no Moriarty.
                </p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#a89f91;">
                  Clique no botão abaixo para escolher uma nova senha. O link vale por <strong style="color:#ece4d5;">30 minutos</strong> e só pode ser usado uma vez.
                </p>
                <p style="margin:0 0 28px;">
                  <a href="${link}" style="display:inline-block;background:#c9a227;color:#12100e;font-weight:bold;text-decoration:none;padding:13px 22px;border-radius:6px;font-family:Arial,Helvetica,sans-serif;font-size:15px;">
                    Redefinir minha senha
                  </a>
                </p>
                <p style="margin:0 0 10px;font-size:12px;line-height:1.6;color:#6f675c;">
                  Se o botão não funcionar, copie e cole este endereço no navegador:
                </p>
                <p style="margin:0 0 24px;font-size:12px;line-height:1.5;color:#a89f91;word-break:break-all;">
                  ${link}
                </p>
                <p style="margin:0;font-size:12px;line-height:1.6;color:#6f675c;">
                  Você não pediu essa alteração? Ignore este e-mail — sua senha continua a mesma.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;background:#12100e;border-top:1px solid #3a2e24;">
                <p style="margin:0;font-size:11px;color:#6f675c;">
                  Moriarty — plataforma de estudos para concursos. Material autoral, questões de treino não oficiais.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
