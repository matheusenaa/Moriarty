"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  GraduationCap,
  Loader2,
  MessageCircle,
  Minimize2,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/Button";

type ActionKind = "create_session" | "schedule_review" | "create_goal";
type ActionView = {
  id: string;
  kind: ActionKind;
  payload: Record<string, unknown>;
  status: "pendente" | "aplicado" | "descartado" | "falhou";
  result: string;
};
type AgentMessage = {
  id: string;
  role: "user" | "assistant";
  body: string;
  created_at: string;
  actions: ActionView[];
};
type QuestionDraft = {
  draftId: string;
  subjectId: string;
  statement: string;
  type: "multipla" | "certo_errado";
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: number;
};

const AVATAR = "/agent/moriarty-avatar.jpg";

function describeAction(action: ActionView): string {
  const p = action.payload;
  if (action.kind === "create_session") {
    const date = String(p.date ?? "");
    const start = Number(p.startMinute ?? 0);
    const h = String(Math.floor(start / 60)).padStart(2, "0");
    const m = String(start % 60).padStart(2, "0");
    return `Criar sessão de ${Number(p.plannedMinutes ?? 0)} min em ${date} às ${h}:${m} — ${String(p.subjectName ?? "Matéria")} (${String(p.kind ?? "estudo")})`;
  }
  if (action.kind === "schedule_review") {
    return `Agendar revisão “${String(p.title ?? "")}” para ${String(p.dueDate ?? "")}${p.subjectName ? ` — ${String(p.subjectName)}` : ""}`;
  }
  return `Criar objetivo “${String(p.title ?? "")}”${p.examDate ? ` (prova em ${String(p.examDate)})` : ""}`;
}

function bubbleText(text: string) {
  return text.split("\n").map((line, i) => (
    <span key={i}>
      {line}
      {i < text.split("\n").length - 1 ? <br /> : null}
    </span>
  ));
}

export function AgentWidget({
  configured,
  provider,
  limit,
  initialRemaining,
  subjects,
}: {
  configured: boolean;
  provider: string;
  limit: number;
  initialRemaining: number;
  subjects: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"chat" | "questions">("chat");
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [remaining, setRemaining] = useState(initialRemaining);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(3);
  const [difficulty, setDifficulty] = useState(3);
  const [generating, setGenerating] = useState(false);
  const [drafts, setDrafts] = useState<QuestionDraft[]>([]);
  const [savedDrafts, setSavedDrafts] = useState<Record<string, boolean>>({});
  const [busyDraft, setBusyDraft] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!open || loadedRef.current) return;
    loadedRef.current = true;
    setLoadingHistory(true);
    fetch("/api/agent/chat")
      .then(async (res) => {
        const data = (await res.json()) as {
          messages?: AgentMessage[];
          usage?: { remaining: number };
          error?: string;
        };
        if (!res.ok) throw new Error(data.error ?? "Falha ao carregar o histórico.");
        setMessages(Array.isArray(data.messages) ? data.messages : []);
        if (data.usage) setRemaining(data.usage.remaining);
        setLoaded(true);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Falha ao carregar o histórico.");
        setLoaded(true);
      })
      .finally(() => setLoadingHistory(false));
  }, [open]);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending, open, tab]);

  function openWidget() {
    setOpen(true);
    setNotice("");
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending || !configured || remaining <= 0) return;
    const tempId = `temp-${Date.now()}`;
    const optimistic: AgentMessage = {
      id: tempId,
      role: "user",
      body: text,
      created_at: new Date().toISOString(),
      actions: [],
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    setError("");
    setNotice("");
    setSending(true);
    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = (await res.json()) as {
        message?: AgentMessage;
        remaining?: number;
        error?: string;
      };
      if (!res.ok || !data.message) throw new Error(data.error ?? "O tutor não respondeu.");
      setMessages((prev) => [...prev, data.message as AgentMessage]);
      if (typeof data.remaining === "number") setRemaining(data.remaining);
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(text);
      setError(err instanceof Error ? err.message : "Falha ao enviar.");
    } finally {
      setSending(false);
    }
  }

  async function decideAction(action: ActionView, decision: "apply" | "dismiss") {
    if (busyAction) return;
    setBusyAction(action.id);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/agent/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId: action.id, decision }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        status?: string;
        message?: string;
        assistantMessage?: AgentMessage;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Não foi possível concluir a ação.");
      const nextStatus = decision === "apply" ? "aplicado" : "descartado";
      setMessages((prev) =>
        prev.map((m) => ({
          ...m,
          actions: m.actions.map((a) =>
            a.id === action.id
              ? { ...a, status: nextStatus as ActionView["status"], result: data.message ?? "" }
              : a,
          ),
        })),
      );
      if (data.assistantMessage) {
        setMessages((prev) => [...prev, data.assistantMessage as AgentMessage]);
      }
      setNotice(data.message ?? (decision === "apply" ? "Ação aplicada." : "Sugestão descartada."));
      if (decision === "apply") router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao concluir a ação.");
    } finally {
      setBusyAction("");
    }
  }

  async function generateDrafts() {
    if (!subjectId || generating || !configured || remaining <= 0) return;
    setGenerating(true);
    setError("");
    setNotice("");
    setDrafts([]);
    setSavedDrafts({});
    try {
      const res = await fetch("/api/agent/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, topic, count, difficulty }),
      });
      const data = (await res.json()) as {
        questions?: Omit<QuestionDraft, "draftId" | "subjectId">[];
        remaining?: number;
        error?: string;
      };
      if (!res.ok || !data.questions) throw new Error(data.error ?? "Não foi possível gerar questões.");
      setDrafts(
        data.questions.map((q, i) => ({
          ...q,
          draftId: `draft-${Date.now()}-${i}`,
          subjectId,
        })),
      );
      if (typeof data.remaining === "number") setRemaining(data.remaining);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao gerar questões.");
    } finally {
      setGenerating(false);
    }
  }

  async function saveDraft(draft: QuestionDraft) {
    if (busyDraft) return;
    setBusyDraft(draft.draftId);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/agent/questions/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: draft.subjectId,
          statement: draft.statement,
          type: draft.type,
          options: draft.options,
          correctIndex: draft.correctIndex,
          explanation: draft.explanation,
          difficulty: draft.difficulty,
        }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Não foi possível salvar.");
      setSavedDrafts((prev) => ({ ...prev, [draft.draftId]: true }));
      setNotice(data.message ?? "Questão salva.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar questão.");
    } finally {
      setBusyDraft("");
    }
  }

  const noSubjects = subjects.length === 0;

  if (!open) {
    return (
      <button
        type="button"
        onClick={openWidget}
        aria-label="Abrir Tutor Moriarty"
        className="group fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-latao/40 bg-grafite/95 p-1.5 pr-3 shadow-xl shadow-black/40 backdrop-blur transition-transform hover:scale-[1.02]"
      >
        <span className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={AVATAR} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-grafite",
              configured ? "bg-petroleo-claro" : "bg-cinza-escuro",
            )}
          />
        </span>
        <span className="text-left">
          <span className="block text-xs font-semibold text-pergaminho">Tutor Moriarty</span>
          <span className="block text-[10px] text-cinza">{configured ? "online" : "IA não configurada"}</span>
        </span>
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Tutor Moriarty"
      className="fixed bottom-3 right-3 z-50 flex h-[min(82vh,620px)] w-[min(94vw,400px)] flex-col overflow-hidden cartao p-0 shadow-2xl shadow-black/50"
    >
      <header className="flex items-center gap-3 border-b border-latao/15 bg-grafite/80 px-3 py-2.5">
        <span className="relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={AVATAR} alt="Moriarty" width={38} height={38} className="h-9 w-9 rounded-full object-cover" />
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-grafite",
              configured ? "bg-petroleo-claro" : "bg-cinza-escuro",
            )}
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-pergaminho">Tutor Moriarty</p>
          <p className="truncate text-[11px] text-cinza">
            {configured ? `${provider} · ${remaining}/${limit} hoje` : "Configure AI_PROVIDER e AI_API_KEY"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Minimizar tutor"
          className="rounded-md p-1.5 text-cinza hover:bg-white/5 hover:text-pergaminho"
        >
          <Minimize2 size={17} />
        </button>
      </header>

      <div className="flex border-b border-white/10 text-xs">
        <button
          type="button"
          onClick={() => setTab("chat")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 px-3 py-2",
            tab === "chat" ? "border-b-2 border-latao text-pergaminho" : "text-cinza hover:text-pergaminho",
          )}
        >
          <MessageCircle size={14} /> Conversar
        </button>
        <button
          type="button"
          onClick={() => setTab("questions")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 px-3 py-2",
            tab === "questions" ? "border-b-2 border-latao text-pergaminho" : "text-cinza hover:text-pergaminho",
          )}
        >
          <GraduationCap size={14} /> Questões
        </button>
      </div>

      {!configured ? (
        <div className="border-b border-latao/15 bg-latao/5 px-3 py-2 text-[11px] text-cinza">
          <p className="font-medium text-latao">Tutor offline</p>
          <p className="mt-0.5">
            Defina <code className="text-pergaminho">AI_PROVIDER=gemini</code> e{" "}
            <code className="text-pergaminho">AI_API_KEY</code> no servidor e reinicie. O restante do Moriarty
            continua funcionando sem IA.
          </p>
        </div>
      ) : null}

      {tab === "chat" ? (
        <>
          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {loadingHistory ? (
              <p className="flex items-center gap-2 text-xs text-cinza">
                <Loader2 size={14} className="animate-spin" /> Carregando histórico…
              </p>
            ) : null}
            {!loadingHistory && loaded && messages.length === 0 ? (
              <div className="rounded-md border border-white/10 p-3 text-xs text-cinza">
                <p className="text-sm text-pergaminho">Pergunte o que quiser sobre seus estudos.</p>
                <p className="mt-1">
                  Eu vejo seu objetivo, matérias, sessões, revisões e materiais — só os seus. Quando eu propuser
                  uma ação, você confirma antes de qualquer alteração.
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {["O que estudar hoje?", "Como funciona a revisão espaçada?", "Monte uma sessão para amanhã"].map(
                    (q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setInput(q)}
                        className="rounded-full border border-latao/30 px-2 py-1 text-[11px] text-pergaminho hover:bg-latao/10"
                      >
                        {q}
                      </button>
                    ),
                  )}
                </div>
              </div>
            ) : null}

            {messages.map((m) => (
              <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[88%] rounded-lg px-3 py-2 text-[13px] leading-relaxed",
                    m.role === "user"
                      ? "bg-latao/20 text-pergaminho"
                      : "border border-white/10 bg-white/[0.03] text-pergaminho",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{bubbleText(m.body)}</p>
                  {m.actions.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {m.actions.map((a) => (
                        <div key={a.id} className="rounded-md border border-latao/25 bg-carvao/50 p-2">
                          <p className="text-[11px] text-pergaminho">{describeAction(a)}</p>
                          {a.status === "pendente" ? (
                            <div className="mt-2 flex gap-2">
                              <Button
                                variant="primario"
                                className="px-2 py-1 text-[11px]"
                                disabled={busyAction === a.id}
                                onClick={() => decideAction(a, "apply")}
                              >
                                {busyAction === a.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                Confirmar
                              </Button>
                              <Button
                                variant="fantasma"
                                className="px-2 py-1 text-[11px]"
                                disabled={busyAction === a.id}
                                onClick={() => decideAction(a, "dismiss")}
                              >
                                <X size={12} /> Descartar
                              </Button>
                            </div>
                          ) : (
                            <p className="mt-1 text-[10px] text-cinza">
                              {a.status === "aplicado"
                                ? "Aplicado"
                                : a.status === "descartado"
                                  ? "Descartado"
                                  : "Falhou"}
                              {a.result ? ` · ${a.result}` : ""}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}

            {sending ? (
              <p className="flex items-center gap-2 text-xs text-cinza">
                <Loader2 size={14} className="animate-spin" /> Moriarty está pensando…
              </p>
            ) : null}
            <div ref={endRef} />
          </div>

          {error ? (
            <p role="alert" className="mx-3 mb-1 flex items-start gap-1.5 text-[11px] text-alerta-claro">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {error}
            </p>
          ) : null}
          {notice ? (
            <p role="status" className="mx-3 mb-1 text-[11px] text-petroleo-claro">
              {notice}
            </p>
          ) : null}

          <div className="border-t border-white/10 p-2">
            <div className="flex items-end gap-2">
              <label htmlFor="agent-input" className="sr-only">
                Mensagem para o tutor
              </label>
              <textarea
                id="agent-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage();
                  }
                }}
                rows={2}
                maxLength={2000}
                disabled={!configured || remaining <= 0 || sending}
                placeholder={
                  remaining <= 0
                    ? "Limite diário atingido. Volte amanhã."
                    : configured
                      ? "Pergunte sobre seu plano, revisões, materiais…"
                      : "IA não configurada no servidor."
                }
                className="max-h-28 min-h-[42px] flex-1 resize-none rounded-md border border-latao/20 bg-carvao/70 px-2.5 py-2 text-[13px] text-pergaminho placeholder:text-cinza-escuro disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={!configured || remaining <= 0 || sending || input.trim().length === 0}
                aria-label="Enviar mensagem"
                className="mb-0.5 rounded-md bg-latao p-2 text-carvao hover:bg-latao-claro disabled:cursor-not-allowed disabled:bg-cinza-escuro disabled:text-pergaminho/60"
              >
                {sending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
              </button>
            </div>
            <p className="mt-1 text-[10px] text-cinza-escuro">
              IA opcional · pode errar · confira sempre fontes oficiais.
            </p>
          </div>
        </>
      ) : (
        <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
          <div className="rounded-md border border-white/10 p-3">
            <p className="flex items-center gap-1.5 text-sm font-medium text-pergaminho">
              <Sparkles size={15} className="text-latao" /> Gerar questões
            </p>
            <p className="mt-1 text-[11px] text-cinza">
              A IA cria rascunhos autorais. Nada entra no seu banco sem você revisar e salvar.
            </p>
            {noSubjects ? (
              <p className="mt-2 text-xs text-cinza">
                Cadastre uma matéria antes em{" "}
                <Link href="/materias" className="text-latao underline">
                  Matérias
                </Link>
                .
              </p>
            ) : (
              <div className="mt-2 space-y-2">
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  aria-label="Matéria"
                  className="w-full rounded-md border border-latao/20 bg-carvao/70 px-2 py-1.5 text-xs"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  maxLength={160}
                  placeholder="Tópico (opcional): ex. controle de constitucionalidade"
                  className="w-full rounded-md border border-latao/20 bg-carvao/70 px-2 py-1.5 text-xs placeholder:text-cinza-escuro"
                />
                <div className="flex gap-2">
                  <select
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    aria-label="Quantidade de questões"
                    className="flex-1 rounded-md border border-latao/20 bg-carvao/70 px-2 py-1.5 text-xs"
                  >
                    <option value={1}>1 questão</option>
                    <option value={3}>3 questões</option>
                    <option value={5}>5 questões</option>
                  </select>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(Number(e.target.value))}
                    aria-label="Dificuldade"
                    className="flex-1 rounded-md border border-latao/20 bg-carvao/70 px-2 py-1.5 text-xs"
                  >
                    <option value={1}>Nível 1</option>
                    <option value={2}>Nível 2</option>
                    <option value={3}>Nível 3</option>
                    <option value={4}>Nível 4</option>
                    <option value={5}>Nível 5</option>
                  </select>
                </div>
                <Button
                  variant="primario"
                  className="w-full"
                  disabled={!configured || remaining <= 0 || generating || !subjectId}
                  onClick={() => void generateDrafts()}
                >
                  {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {generating ? "Gerando…" : "Gerar rascunhos"}
                </Button>
              </div>
            )}
          </div>

          {error ? (
            <p role="alert" className="flex items-start gap-1.5 text-[11px] text-alerta-claro">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {error}
            </p>
          ) : null}
          {notice ? (
            <p role="status" className="text-[11px] text-petroleo-claro">
              {notice}
            </p>
          ) : null}

          {drafts.map((d) => (
            <div key={d.draftId} className="rounded-md border border-white/10 p-3 text-xs">
              <p className="text-[13px] text-pergaminho">{d.statement}</p>
              <ol className="mt-1 list-inside list-decimal space-y-0.5 text-cinza">
                {d.options.map((o, i) => (
                  <li key={i} className={i === d.correctIndex ? "text-petroleo-claro" : undefined}>
                    {o}
                    {i === d.correctIndex ? " ✓" : ""}
                  </li>
                ))}
              </ol>
              {d.explanation ? (
                <p className="mt-1 text-[11px] text-cinza">
                  <span className="text-pergaminho">Explicação:</span> {d.explanation}
                </p>
              ) : null}
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-[10px] text-cinza-escuro">
                  {d.type === "certo_errado" ? "Certo/Errado" : "Múltipla escolha"} · nível {d.difficulty}
                </span>
                {savedDrafts[d.draftId] ? (
                  <span className="flex items-center gap-1 text-[11px] text-petroleo-claro">
                    <Check size={12} /> Salva
                  </span>
                ) : (
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDrafts((prev) => prev.filter((x) => x.draftId !== d.draftId))}
                      className="rounded-md px-2 py-1 text-[11px] text-cinza hover:bg-white/5 hover:text-pergaminho"
                    >
                      <Trash2 size={12} className="inline" /> Descartar
                    </button>
                    <Button
                      variant="primario"
                      className="px-2 py-1 text-[11px]"
                      disabled={busyDraft === d.draftId}
                      onClick={() => void saveDraft(d)}
                    >
                      {busyDraft === d.draftId ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Check size={12} />
                      )}
                      Salvar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {drafts.length > 0 ? (
            <p className="text-[10px] text-cinza-escuro">
              Revise enunciado, alternativas e gabarito antes de salvar. Questões de IA não são oficiais.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
