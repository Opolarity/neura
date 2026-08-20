import { useCallback, useEffect, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { threadAdapter } from "../adapters/conversations.adapter";
import { getConversationThreadApi } from "../services/crm.service";
import type { Conversation, ConversationMessage } from "../types/crm.types";

const POLL_MS = 15_000;

/**
 * Mensajes de la conversación abierta. Se refresca más seguido que la lista
 * porque es la pantalla donde alguien está esperando una respuesta.
 */
export const useConversationThread = (conversation: Conversation | null) => {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const identity = conversation?.identity ?? null;
  const phoneNumber = conversation?.phoneNumber ?? null;
  const whatsappUserId = conversation?.whatsappUserId ?? null;

  const fetchThread = useCallback(
    async (silent = false) => {
      if (!identity) {
        setMessages([]);
        return;
      }

      if (!silent) setLoading(true);
      try {
        const response = await getConversationThreadApi(phoneNumber, whatsappUserId);
        setMessages(threadAdapter(response));
      } catch (error) {
        console.error(error);
        if (!silent) {
          toast({ title: "Error al cargar la conversación", variant: "destructive" });
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    // identity entra en las dependencias a propósito: al cambiar de
    // conversación hay que recargar aunque el teléfono sea null en las dos.
    [identity, phoneNumber, whatsappUserId]
  );

  useEffect(() => {
    fetchThread();
  }, [fetchThread]);

  useEffect(() => {
    if (!identity) return;
    const timer = window.setInterval(() => fetchThread(true), POLL_MS);
    return () => window.clearInterval(timer);
  }, [identity, fetchThread]);

  return { messages, loading, reload: () => fetchThread(true) };
};
