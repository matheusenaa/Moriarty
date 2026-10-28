"use client";

import { useState, useEffect, useCallback } from "react";
import {
  startTimerAction,
  pauseTimerAction,
  resumeTimerAction,
  completeTimerAction,
  manualActivityAction,
} from "@/actions/planning";
import { Button } from "@/components/Button";
import { Input } from "@/components/FormControls";

function persistTimerState(
  timerId: string | null,
  status: "running" | "paused" | "completed",
  accumulatedSeconds: number
) {
  if (typeof window !== "undefined") {
    const state = { timerId, status, accumulatedSeconds };
    localStorage.setItem("moriarty_timer_state", JSON.stringify(state));
  }
}

function loadTimerStateFromStorage() {
  if (typeof window === "undefined") return null;
  try {
    const serialized = localStorage.getItem("moriarty_timer_state");
    if (!serialized) return null;
    return JSON.parse(serialized);
  } catch (e) {
    return null;
  }
}

export function TimerDisplay({
  initialSubjectId,
}: {
  initialSubjectId?: string;
}) {
  const [timerId, setTimerId] = useState<string | null>(null);
  const [status, setStatus] = useState<"running" | "paused" | "completed">("running");
  const [accumulatedSeconds, setAccumulatedSeconds] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [notes, setNotes] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formStatus, setFormStatus] = useState<"concluida" | "parcial" | "adiada" | "cancelada">("concluida");
  const [actualMinutes, setActualMinutes] = useState(0);
  const [reviewTitles, setReviewTitles] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useState(false);

  const [minute, setMinute] = useState(0);
  const [second, setSecond] = useState(0);

  // Restore timer state from localStorage on mount
  useEffect(() => {
    const stored = loadTimerStateFromStorage();
    if (stored) {
      setTimerId(stored.timerId);
      setStatus(stored.status);
      setAccumulatedSeconds(stored.accumulatedSeconds);
      // Also recalculate elapsed based on accumulated + time since session started
      // For now, just use the stored accumulated value
    }
  }, []);

  useEffect(() => {
    persistTimerState(timerId, status, accumulatedSeconds);
  }, [timerId, status, accumulatedSeconds]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    if (status === "running" && isRunning) {
      timeoutId = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
        setAccumulatedSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timeoutId) clearInterval(timeoutId);
    };
  }, [status, isRunning]);

  useEffect(() => {
    if (status === "running" && isRunning) {
      const mins = Math.floor(elapsedSeconds / 60);
      const secs = elapsedSeconds % 60;
      setMinute(mins);
      setSecond(secs);
    }
  }, [elapsedSeconds, status]);

  const startTimer = useCallback(async () => {
    setFormOpen(true);
    setFormStatus("concluida");
    setActualMinutes(0);
    setReviewTitles("");
    setNotes("");
  }, [status]);

  const handleStart = useCallback(async () => {
    setIsRunning(true);
    setFormOpen(false);
    setMessage("");
  }, []);

  // When pausing, send accumulated seconds to server and persist locally
  const handlePause = useCallback(async () => {
    if (!timerId) return;
    const { ok, error, message: msg } = await pauseTimerAction({
      timerId,
      notes,
    });
    if (ok) {
      // Update local state with what the server has
      setStatus("paused");
      setIsRunning(false);
      // The server stores accumulated_seconds, but we don't get it back in the response
      // So we keep the local value; on next mount it will be re-synced
      setMessage(msg ?? "Sessão pausada.");
    } else {
      setMessage(error ?? "Erro ao pausar.");
    }
  }, [timerId, notes, pauseTimerAction]);

  // When resuming, the server keeps the accumulated_seconds, so we maintain it
  const handleResume = useCallback(async () => {
    if (!timerId) return;
    const { ok, error, message: msg } = await resumeTimerAction({
      timerId,
    });
    if (ok) {
      setStatus("running");
      setIsRunning(true);
      setMessage(msg ?? "Sessão retomada.");
    } else {
      setMessage(error ?? "Erro ao retomar.");
    }
  }, [timerId, resumeTimerAction]);

  const handleComplete = useCallback(async () => {
    if (!timerId) return;
    setFormOpen(true);
  }, [timerId, handleComplete]);

  const handleFinalize = useCallback(async () => {
    if (!timerId) return;
    const { ok, error, message: msg } = await completeTimerAction({
      timerId,
      status: formStatus,
      actualMinutes,
      notes,
    });
    if (ok) {
      setStatus("completed");
      setIsRunning(false);
      setTimerId(null);
      // Clear localStorage on finalization
      if (typeof window !== "undefined") {
        localStorage.removeItem("moriarty_timer_state");
      }
      setMessage(msg ?? "Sessão finalizada.");
      setFormOpen(false);
    } else {
      setMessage(error ?? "Erro ao finalizar.");
    }
  }, [timerId, formStatus, actualMinutes, notes, completeTimerAction]);

  const handleManual = useCallback(async () => {
    if (!timerId) return;
    await manualActivityAction({
      subjectId: timerId ? null : initialSubjectId ?? undefined,
      topicId: null,
      activityType: "estudo",
      date: new Date().toISOString().slice(0, 10),
      durationMinutes: Math.round(accumulatedSeconds / 60),
      notes,
    });
    setMessage("Atividade manual registrada.");
    setFormOpen(false);
  }, [timerId, accumulatedSeconds, notes, manualActivityAction]);

  return (
    <div className="rounded-md border border-latao/30 bg-carvao/80 p-4">
      <div className="flex items-center justify-between gap-2 mb-4">
        <span className="text-sm text-cinza">
          {initialSubjectId ? "Estudando" : "Sessão nova"}
        </span>
        {timerId && (
          <div className="flex gap-2">
            {status === "running" && (
              <Button
                variant="fantasma"
                onClick={handlePause}
                disabled={pending}
              >
                Pausar
              </Button>
            )}
            {status === "paused" && (
              <Button
                variant="primario"
                onClick={handleResume}
                disabled={pending}
              >
                Retomar
              </Button>
            )}
          </div>
        )}
      </div>

      {formOpen ? (
        <div className="mt-3">
          <p className="text-xs text-cinza mb-2">Finalizar sessão</p>
          <div className="mb-2">
            <label className="block text-xs text-cinza">Status</label>
            <div className="mt-1 flex gap-2">
              <label key="concluida" className="flex items-center gap-1 text-xs">
                <input
                  type="radio"
                  name="timer-status"
                  checked={formStatus === "concluida"}
                  onChange={() => setFormStatus("concluida")}
                  className="accent-latao"
                />
                Concluída
              </label>
              <label key="parcial" className="flex items-center gap-1 text-xs">
                <input
                  type="radio"
                  name="timer-status"
                  checked={formStatus === "parcial"}
                  onChange={() => setFormStatus("parcial")}
                  className="accent-latao"
                />
                Parcial
              </label>
            </div>
          </div>
          <div className="mb-2">
            <label className="block text-xs text-cinza">Minutos efetivos</label>
            <Input
              type="number"
              min={0}
              max={600}
              value={actualMinutes}
              onChange={(e) => setActualMinutes(Number(e.target.value))}
              className="mb-2 w-full rounded-md border border-latao/20 bg-carvao/70 px-2 py-1 text-sm"
            />
          </div>
          <div className="mb-2">
            <label className="block text-xs text-cinza">Tópicos para revisar (opcional)</label>
            <textarea
              rows={2}
              value={reviewTitles}
              onChange={(e) => setReviewTitles(e.target.value)}
              className="mb-2 w-full rounded-md border border-latao/20 bg-carvao/70 px-2 py-1 text-xs"
              placeholder="Art. 5º da CF\nCrase e regência"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="fantasma"
              onClick={() => setFormOpen(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button
              variant="primario"
              onClick={handleFinalize}
              disabled={pending}
            >
              {pending ? "Salvando…" : "Finalizar"}
            </Button>
          </div>
        </div>
      ) : (
        <div>
          {timerId ? (
            <div className="mb-3">
              <p className="font-medium text-pergaminho">
                {status === "running" ? "Cronômetro ativo" : status === "paused" ? "Pausado" : "Concluído"}
              </p>
              <p className="font-titulo text-2xl text-latao">
                {String(Math.floor(accumulatedSeconds / 60)).padStart(2, "0")}:{
                  String(accumulatedSeconds % 60).padStart(2, "0")
                }
              </p>
              {status === "running" && (
                <p className="text-xs text-cinza">Pressionar para pausar</p>
              )}
            </div>
          ) : (
            <Button
              variant="primario"
              onClick={startTimer}
              disabled={pending}
            >
              {pending ? "Iniciando…" : "Iniciar cronômetro"}
            </Button>
          )}
          {message ? (
            <span className="text-xs text-petroleo-claro mt-1">{message}</span>
          ) : null}
        </div>
      )}
    </div>
  );
}