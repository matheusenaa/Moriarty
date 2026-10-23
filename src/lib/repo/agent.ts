import { execute, nowIso, query, queryOne, uid, withTransaction } from "../db";
import type { AgentActionKind, ProposedAction } from "../agent";

export type AgentMessageRow = {
  id: string;
  role: "user" | "assistant";
  body: string;
  created_at: string;
};

export type AgentActionRow = {
  id: string;
  message_id: string;
  kind: AgentActionKind;
  payload_json: string;
  status: "pendente" | "aplicado" | "descartado" | "falhou";
  result: string;
  created_at: string;
  decided_at: string | null;
};

export type AgentActionView = Omit<AgentActionRow, "payload_json" | "message_id"> & {
  payload: unknown;
};

export type AgentMessageView = AgentMessageRow & { actions: AgentActionView[] };

function parsePayload(json: string): unknown {
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

function toActionView(row: AgentActionRow): AgentActionView {
  return {
    id: row.id,
    kind: row.kind,
    payload: parsePayload(row.payload_json),
    status: row.status,
    result: row.result,
    created_at: row.created_at,
    decided_at: row.decided_at,
  };
}

/** Histórico recente em ordem cronológica, com as ações propostas. */
export async function listAgentMessages(userId: string, limit = 40): Promise<AgentMessageView[]> {
  const messages = await query<AgentMessageRow>(
    `SELECT id, role, body, created_at FROM (
       SELECT id, role, body, created_at FROM agent_messages
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
     ) recent ORDER BY created_at ASC`,
    [userId, Math.min(Math.max(limit, 1), 100)],
  );
  if (messages.length === 0) return [];
  const placeholders = messages.map((_, i) => `$${i + 2}`).join(",");
  const actions = await query<AgentActionRow>(
    `SELECT * FROM agent_actions WHERE user_id = $1 AND message_id IN (${placeholders}) ORDER BY created_at ASC`,
    [userId, ...messages.map((m) => m.id)],
  );
  const byMessage = new Map<string, AgentActionView[]>();
  for (const a of actions) {
    const list = byMessage.get(a.message_id) ?? [];
    list.push(toActionView(a));
    byMessage.set(a.message_id, list);
  }
  return messages.map((m) => ({ ...m, actions: byMessage.get(m.id) ?? [] }));
}

/** Salva a pergunta do usuário, a resposta do tutor e as ações propostas na mesma transação. */
export async function saveAgentTurn(
  userId: string,
  userBody: string,
  assistantBody: string,
  actions: ProposedAction[],
): Promise<{ userMessage: AgentMessageRow; assistantMessage: AgentMessageView }> {
  const now = nowIso();
  const userIdMsg = uid();
  const assistantId = uid();
  await withTransaction(async (client) => {
    await client.query(
      "INSERT INTO agent_messages (id, user_id, role, body, created_at) VALUES ($1, $2, 'user', $3, $4)",
      [userIdMsg, userId, userBody, now],
    );
    await client.query(
      "INSERT INTO agent_messages (id, user_id, role, body, created_at) VALUES ($1, $2, 'assistant', $3, $4)",
      [assistantId, userId, assistantBody, now],
    );
    for (const action of actions.slice(0, 3)) {
      await client.query(
        "INSERT INTO agent_actions (id, user_id, message_id, kind, payload_json, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
        [uid(), userId, assistantId, action.kind, JSON.stringify(action.payload), now],
      );
    }
  });
  const saved = await queryOne<AgentMessageRow>(
    "SELECT id, role, body, created_at FROM agent_messages WHERE id = $1 AND user_id = $2",
    [assistantId, userId],
  );
  const actionRows = await query<AgentActionRow>(
    "SELECT * FROM agent_actions WHERE message_id = $1 AND user_id = $2 ORDER BY created_at ASC",
    [assistantId, userId],
  );
  return {
    userMessage: { id: userIdMsg, role: "user", body: userBody, created_at: now },
    assistantMessage: {
      ...(saved ?? { id: assistantId, role: "assistant", body: assistantBody, created_at: now }),
      actions: actionRows.map(toActionView),
    },
  };
}

/** Registra uma resposta do tutor sem ação (resultado de confirmação, por exemplo). */
export async function saveAssistantMessage(userId: string, body: string): Promise<AgentMessageRow> {
  const id = uid();
  const now = nowIso();
  await execute(
    "INSERT INTO agent_messages (id, user_id, role, body, created_at) VALUES ($1, $2, 'assistant', $3, $4)",
    [id, userId, body, now],
  );
  return { id, role: "assistant", body, created_at: now };
}

export function getAgentAction(userId: string, actionId: string): Promise<AgentActionRow | null> {
  return queryOne<AgentActionRow>("SELECT * FROM agent_actions WHERE id = $1 AND user_id = $2", [actionId, userId]);
}

export function listAgentActions(userId: string, limit = 20): Promise<AgentActionRow[]> {
  return query<AgentActionRow>(
    `SELECT * FROM agent_actions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [userId, Math.min(Math.max(limit, 1), 100)],
  );
}

/** Reserva a ação para execução (evita clique duplo e corrida entre abas). */
export async function claimAgentAction(userId: string, actionId: string): Promise<AgentActionRow | null> {
  return queryOne<AgentActionRow>(
    `UPDATE agent_actions SET status = 'aplicado', decided_at = $1
      WHERE id = $2 AND user_id = $3 AND status = 'pendente'
      RETURNING *`,
    [nowIso(), actionId, userId],
  );
}

export async function finishAgentAction(
  userId: string,
  actionId: string,
  status: "aplicado" | "descartado" | "falhou",
  result: string,
): Promise<void> {
  await execute(
    "UPDATE agent_actions SET status = $1, result = $2, decided_at = $3 WHERE id = $4 AND user_id = $5",
    [status, result.slice(0, 1000), nowIso(), actionId, userId],
  );
}

export async function discardAgentAction(userId: string, actionId: string): Promise<boolean> {
  const updated = await execute(
    "UPDATE agent_actions SET status = 'descartado', decided_at = $1 WHERE id = $2 AND user_id = $3 AND status = 'pendente'",
    [nowIso(), actionId, userId],
  );
  return updated > 0;
}

function tableMissing(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "42P01";
}

export type AiUsage = { used: number; limit: number; remaining: number; degraded: boolean };

export async function getAiUsage(userId: string, day: string, limit: number): Promise<AiUsage> {
  const effective = limit > 0 ? limit : 20;
  try {
    const row = await queryOne<{ calls: number }>("SELECT calls FROM ai_usage WHERE user_id = $1 AND day = $2", [
      userId,
      day,
    ]);
    const used = Number(row?.calls ?? 0);
    return { used, limit: effective, remaining: Math.max(0, effective - used), degraded: false };
  } catch (err) {
    if (tableMissing(err)) {
      console.warn("[ai] tabela ai_usage ausente (migração 0009 não aplicada): cota não contabilizada.");
      return { used: 0, limit: effective, remaining: effective, degraded: true };
    }
    throw err;
  }
}

/** Consome 1 chamada de IA do dia. Retorna allowed=false quando a cota acabou. */
export async function consumeAiQuota(userId: string, day: string, limit: number): Promise<AiUsage & { allowed: boolean }> {
  const effective = limit > 0 ? limit : 20;
  try {
    const row = await queryOne<{ calls: number }>(
      `INSERT INTO ai_usage (user_id, day, calls) VALUES ($1, $2, 1)
       ON CONFLICT (user_id, day) DO UPDATE SET calls = ai_usage.calls + 1
         WHERE ai_usage.calls < $3
       RETURNING calls`,
      [userId, day, effective],
    );
    if (row) {
      const used = Number(row.calls);
      return { used, limit: effective, remaining: Math.max(0, effective - used), degraded: false, allowed: true };
    }
    const current = await getAiUsage(userId, day, effective);
    return { ...current, allowed: false };
  } catch (err) {
    if (tableMissing(err)) {
      console.warn("[ai] tabela ai_usage ausente (migração 0009 não aplicada): cota não contabilizada.");
      return { used: 0, limit: effective, remaining: effective, degraded: true, allowed: true };
    }
    throw err;
  }
}

export function aiDailyLimit(): number {
  const n = Number(process.env.AI_DAILY_LIMIT || 20);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 20;
}
