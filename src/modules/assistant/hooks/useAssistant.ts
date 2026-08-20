import { useCallback, useRef, useState } from "react";
import type { AssistantMessage } from "../types";
import { streamChat } from "../services/assistant.service";

function newId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Hilo de conversacion del usuario actual. */
export function useAssistant() {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean || sending) return;

      setError(null);
      setSending(true);

      const replyId = newId();
      setMessages((prev) => [
        ...prev,
        { id: newId(), role: "user", text: clean, createdAt: new Date().toISOString() },
        { id: replyId, role: "assistant", text: "", createdAt: new Date().toISOString(), streaming: true },
      ]);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await streamChat(
          clean,
          (delta) => {
            setMessages((prev) =>
              prev.map((m) => (m.id === replyId ? { ...m, text: m.text + delta } : m)),
            );
          },
          controller.signal,
        );
        setMessages((prev) =>
          prev.map((m) => (m.id === replyId ? { ...m, streaming: false } : m)),
        );
      } catch (err) {
        if (controller.signal.aborted) {
          // Cancelado por el usuario: la burbuja se queda con lo recibido.
          setMessages((prev) =>
            prev.map((m) => (m.id === replyId ? { ...m, streaming: false } : m)),
          );
        } else {
          // La burbuja vacia se retira: dejarla daria la impresion de que el
          // asistente respondio en blanco, y el motivo real va en `error`.
          setMessages((prev) => prev.filter((m) => m.id !== replyId));
          setError(err instanceof Error ? err.message : "No se pudo enviar el mensaje.");
        }
      } finally {
        abortRef.current = null;
        setSending(false);
      }
    },
    [sending],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
  }, []);

  return { messages, sending, error, send, stop, reset };
}
