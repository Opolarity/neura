import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/modules/auth";
import { toast } from "@/shared/hooks/use-toast";
import { toastError } from "@/shared/utils/toastError";
import { conversationsAdapter } from "../adapters/conversations.adapter";
import {
  assignConversationApi,
  getConversationsApi,
  getCrmSituationsApi,
  setConversationSituationApi,
  takeConversationApi,
  type ListParams,
} from "../services/crm.service";
import type {
  Conversation,
  ConversationCounts,
  ConversationFilters,
  ConversationView,
  NetworkCounts,
  Situation,
} from "../types/crm.types";

const EMPTY_FILTERS: ConversationFilters = {
  search: "",
  situationId: null,
  view: "all",
  channel: "all",
};

const EMPTY_NETWORK_COUNTS: NetworkCounts = {
  all: 0,
  whatsapp: 0,
  instagram: 0,
  facebook: 0,
  tiktok: 0,
};

const EMPTY_COUNTS: ConversationCounts = {
  all: 0,
  mine: 0,
  unassigned: 0,
  taken: 0,
  window_closed: 0,
};

// La bandeja no pagina: trae las conversaciones más recientes de la vista. Con
// los filtros a mano, 100 alcanza para trabajar el día.
const PAGE_SIZE = 100;

// Cada cuánto se refresca la lista. Los mensajes entran por el servicio del
// bot y no hay un evento que escuchar del lado del ERP.
const POLL_MS = 30_000;

/** Traduce la vista elegida a los filtros del SP. */
const viewParams = (
  view: ConversationView,
  userId: string | null
): Pick<ListParams, "assignedTo" | "unassigned" | "taken" | "windowOpen"> => {
  switch (view) {
    case "mine":
      return { assignedTo: userId };
    case "unassigned":
      return { unassigned: true };
    case "taken":
      return { taken: true };
    case "window_closed":
      return { windowOpen: false };
    default:
      return {};
  }
};

export const useConversations = () => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [data, setData] = useState<Conversation[]>([]);
  const [counts, setCounts] = useState<ConversationCounts>(EMPTY_COUNTS);
  const [networkCounts, setNetworkCounts] = useState<NetworkCounts>(EMPTY_NETWORK_COUNTS);
  const [situations, setSituations] = useState<Situation[]>([]);
  const [channelId, setChannelId] = useState<number | null>(null);
  // La carga inicial tapa la bandeja; las recargas por filtro solo marcan la
  // lista, como en WhatsApp: el chat abierto no se mueve.
  const [initialLoading, setInitialLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [acting, setActing] = useState(false);
  // Cambiar de filtro rápido dispara varias peticiones: solo vale la última.
  const requestSeq = useRef(0);
  const [filters, setFilters] = useState<ConversationFilters>(EMPTY_FILTERS);
  const { search, situationId, view, channel } = filters;

  // El catálogo de etapas no cambia mientras la pantalla vive.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const rows = await getCrmSituationsApi();
        if (cancelled) return;

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
        toastError(error, "No se pudieron cargar las etapas del CRM");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const fetchData = useCallback(
    async (silent = false) => {
      const seq = ++requestSeq.current;
      if (!silent) setListLoading(true);
      try {
        const response = await getConversationsApi({
          search,
          situationId,
          ...viewParams(view, userId),
          network: channel === "all" ? null : channel,
          page: 1,
          size: PAGE_SIZE,
        });

        if (seq !== requestSeq.current) return;
        const mapped = conversationsAdapter(response);
        setData(mapped.data);
        setCounts(mapped.counts);
        setNetworkCounts(mapped.networkCounts);
        setChannelId(mapped.channelId);
      } catch (error) {
        console.error(error);
        // En el refresco silencioso no se avisa: un corte de red momentáneo no
        // debería llenar la pantalla de toasts cada 30 segundos.
        if (!silent && seq === requestSeq.current) {
          toastError(error, "Error al cargar las conversaciones");
        }
      } finally {
        if (seq === requestSeq.current) {
          setListLoading(false);
          setInitialLoading(false);
        }
      }
    },
    // La pestaña de red filtra en el servidor, igual que la vista: así los
    // contadores de las vistas son los de esa red.
    [search, situationId, view, channel, userId]
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
    (conversation: Conversation, assignee: string | null) => {
      if (!channelId) return Promise.resolve(false);
      return runAction(
        () =>
          assignConversationApi(
            channelId,
            assignee,
            conversation.phoneNumber,
            conversation.whatsappUserId
          ),
        assignee ? "Conversación asignada" : "Conversación sin asignar"
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
  };

  return {
    data,
    counts,
    networkCounts,
    situations,
    // Lo necesitan el compositor y el POS: los SP y las edges piden el canal por id.
    channelId,
    initialLoading,
    listLoading,
    acting,
    filters,
    updateFilters,
    clearFilters: () => updateFilters(EMPTY_FILTERS),
    reload: () => fetchData(true),
    setSituation,
    assign,
    takeControl,
  };
};
