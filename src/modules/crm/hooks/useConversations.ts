import { useCallback, useEffect, useState } from "react";
import type { PaginationState } from "@/shared/components/pagination/Pagination";
import { toast } from "@/shared/hooks/use-toast";
import { conversationsAdapter } from "../adapters/conversations.adapter";
import {
  assignConversationApi,
  getChannelIdApi,
  getConversationsApi,
  getCrmSituationsApi,
  setConversationSituationApi,
  takeConversationApi,
} from "../services/crm.service";
import type { Conversation, ConversationFilters, Situation } from "../types/crm.types";
import { toastError } from "@/shared/utils/toastError";

const EMPTY_FILTERS: ConversationFilters = {
  search: "",
  situationId: null,
  assignedTo: null,
  unassigned: false,
  taken: null,
};

// Cada cuánto se refresca la lista. La bandeja no usa realtime todavía: con el
// número compartido con el bot, los mensajes entran por n8n y no hay un evento
// que escuchar del lado del ERP. 30 s alcanza para trabajar y no castiga a la
// base, que hoy resuelve el listado en ~17 ms.
const POLL_MS = 30_000;

export const useConversations = () => {
  const [data, setData] = useState<Conversation[]>([]);
  const [situations, setSituations] = useState<Situation[]>([]);
  const [channelId, setChannelId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [filters, setFilters] = useState<ConversationFilters>(EMPTY_FILTERS);
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });

  // El canal y el catálogo de etapas no cambian mientras la pantalla vive.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [id, rows] = await Promise.all([getChannelIdApi(), getCrmSituationsApi()]);
        if (cancelled) return;

        setChannelId(id);
        setSituations(
          (rows as Array<Record<string, unknown>>).map((r) => ({
            id: r.id as number,
            name: r.name as string,
            code: r.code as string,
            statusCode: (r.statuses as { code?: string } | null)?.code ?? "",
            order: (r.order as number | null) ?? null,
          }))
        );
      } catch (error) {
        console.error(error);
        toastError(error, "No se pudo cargar la configuración del CRM");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const fetchData = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const response = await getConversationsApi({
          search: filters.search,
          situationId: filters.situationId,
          assignedTo: filters.assignedTo,
          unassigned: filters.unassigned,
          taken: filters.taken,
          page: pagination.p_page,
          size: pagination.p_size,
        });

        const { data: mapped, pagination: pag } = conversationsAdapter(response);
        setData(mapped);
        setPagination(pag);
      } catch (error) {
        console.error(error);
        // En el refresco silencioso no se avisa: un corte de red momentáneo no
        // debería llenar la pantalla de toasts cada 30 segundos.
        if (!silent) {
          toastError(error, "Error al cargar las conversaciones");
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [filters, pagination.p_page, pagination.p_size]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const timer = window.setInterval(() => fetchData(true), POLL_MS);
    return () => window.clearInterval(timer);
  }, [fetchData]);

  /** Envuelve las acciones: bloquea, avisa y refresca sin parpadeo. */
  const runAction = useCallback(
    async (action: () => Promise<unknown>, successTitle: string) => {
      setActing(true);
      try {
        await action();
        toast({ title: successTitle });
        await fetchData(true);
        return true;
      } catch (error) {
        console.error(error);
        toastError(error, "No se pudo completar la acción");
        return false;
      } finally {
        setActing(false);
      }
    },
    [fetchData]
  );

  const setSituation = useCallback(
    (conversation: Conversation, situationId: number, message?: string) => {
      if (!channelId) return Promise.resolve(false);
      return runAction(
        () =>
          setConversationSituationApi(
            channelId,
            situationId,
            conversation.phoneNumber,
            conversation.whatsappUserId,
            message
          ),
        "Etapa actualizada"
      );
    },
    [channelId, runAction]
  );

  const assign = useCallback(
    (conversation: Conversation, userId: string | null) => {
      if (!channelId) return Promise.resolve(false);
      return runAction(
        () =>
          assignConversationApi(
            channelId,
            userId,
            conversation.phoneNumber,
            conversation.whatsappUserId
          ),
        userId ? "Conversación asignada" : "Conversación sin asignar"
      );
    },
    [channelId, runAction]
  );

  const takeControl = useCallback(
    (conversation: Conversation, release = false) => {
      if (!channelId) return Promise.resolve(false);
      return runAction(
        () =>
          takeConversationApi(
            channelId,
            conversation.phoneNumber,
            conversation.whatsappUserId,
            release
          ),
        // Soltar devuelve el control al asesor asignado, y solo al bot si no hay
        // nadie asignado: el mensaje no puede prometer una de las dos cosas.
        release ? "Soltaste el control" : "Tomaste el control"
      );
    },
    [channelId, runAction]
  );

  const updateFilters = (partial: Partial<ConversationFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
    setPagination((prev) => ({ ...prev, p_page: 1 }));
  };

  return {
    data,
    situations,
    // Lo necesita el compositor: la edge function de envío pide el canal por id.
    channelId,
    loading,
    acting,
    filters,
    pagination,
    updateFilters,
    clearFilters: () => updateFilters(EMPTY_FILTERS),
    handlePageChange: (page: number) =>
      setPagination((prev) => ({ ...prev, p_page: page })),
    handlePageSizeChange: (size: number) =>
      setPagination((prev) => ({ ...prev, p_size: size, p_page: 1 })),
    reload: () => fetchData(),
    setSituation,
    assign,
    takeControl,
  };
};
