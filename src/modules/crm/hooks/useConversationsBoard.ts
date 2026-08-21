import { useCallback, useEffect, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import {
  getChannelIdApi,
  getConversationsBoardApi,
  setConversationSituationApi,
} from "../services/crm.service";
import { boardAdapter } from "../adapters/conversations.adapter";
import type { BoardCard, BoardColumn } from "../types/crm.types";

const POLL_MS = 45_000;

export const useConversationsBoard = () => {
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [channelId, setChannelId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [onlyMine, setOnlyMine] = useState<string | null>(null);

  useEffect(() => {
    getChannelIdApi()
      .then(setChannelId)
      .catch(() =>
        toast({ title: "No se pudo cargar el canal", variant: "destructive" })
      );
  }, []);

  const fetchBoard = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const response = await getConversationsBoardApi(search, onlyMine);
        setColumns(boardAdapter(response));
      } catch (error) {
        console.error(error);
        if (!silent) {
          toast({ title: "Error al cargar el tablero", variant: "destructive" });
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [search, onlyMine]
  );

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  useEffect(() => {
    const timer = window.setInterval(() => fetchBoard(true), POLL_MS);
    return () => window.clearInterval(timer);
  }, [fetchBoard]);

  /**
   * Mueve una tarjeta de columna. Aplica el cambio en pantalla ANTES de que el
   * backend conteste: al soltar, la tarjeta tiene que quedarse donde la
   * dejaron. Si el SP falla, se recarga el tablero y la tarjeta vuelve sola a
   * su columna — pero avisando, no en silencio.
   */
  const moveCard = useCallback(
    async (card: BoardCard, toSituationId: number | null, fromSituationId: number | null) => {
      if (!channelId || toSituationId === null || toSituationId === fromSituationId) return;

      setColumns((prev) =>
        prev.map((col) => {
          if (col.situationId === fromSituationId) {
            return {
              ...col,
              total: Math.max(0, col.total - 1),
              cards: col.cards.filter((c) => c.identity !== card.identity),
            };
          }
          if (col.situationId === toSituationId) {
            return { ...col, total: col.total + 1, cards: [card, ...col.cards] };
          }
          return col;
        })
      );

      try {
        await setConversationSituationApi(
          channelId,
          toSituationId,
          card.phoneNumber,
          card.whatsappUserId
        );
        // Se recarga igual: el total de una columna recortada solo lo sabe el
        // backend, y el movimiento pudo destapar una tarjeta que no entraba.
        fetchBoard(true);
      } catch (error) {
        console.error(error);
        toast({
          title: error instanceof Error ? error.message : "No se pudo mover el chat",
          variant: "destructive",
        });
        fetchBoard(true);
      }
    },
    [channelId, fetchBoard]
  );

  return {
    columns,
    loading,
    search,
    onlyMine,
    setSearch,
    setOnlyMine,
    reload: () => fetchBoard(),
    moveCard,
  };
};
