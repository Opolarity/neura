import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SupportServiceError,
  type SupportAttachment,
  type SupportErrorCode,
  type SupportMessage,
  type SupportRequestDetail,
} from "../types/Support.types";
import {
  createSupportRequestMessage,
  getSupportRequest,
  markSupportRequestRead,
} from "../services/SupportRequests.service";
import {
  adaptSupportMessage,
  adaptSupportRequestDetail,
} from "../adapters/supportRequest.adapter";
import { toastError } from "@/shared/utils/toastError";

interface SupportDetailErrorState {
  message: string;
  code: SupportErrorCode;
}

/** Cada cuánto se mira si soporte respondió, con el panel abierto y visible. */
const POLL_INTERVAL_MS = 20_000;

/**
 * Errores con los que el servidor seguro NO guardó el mensaje: la edge function
 * los devuelve antes de escribir, o la API externa lo rechazó. Cualquier otro
 * (red, timeout, 5xx, código desconocido) es ambiguo: pudo haberse guardado.
 */
const DEFINITIVE_ERRORS = new Set<string>([
  "bad_request",
  "rate_limited",
  "not_found",
  "client_not_found",
  "company_document",
  "invalid_api_key",
  "unauthorized",
  "not_configured",
  "server_config",
]);

/**
 * Mensaje propio que todavía no tiene id del servidor. Vive en el bucket de su
 * solicitud: un envío que termina después de cambiar de solicitud nunca se
 * pinta en otra.
 */
interface PendingMessage {
  localId: string;
  requestId: string;
  content: string;
  attachments?: SupportAttachment[];
  files: { name: string; previewUrl: string | null }[];
  createdAt: string;
  /**
   * sending: POST en curso (o en cola) · sent: el POST respondió OK pero sin el
   * mensaje, se espera verlo en el próximo detalle · failed: no se envió.
   */
  status: "sending" | "sent" | "failed";
  failureKind: "definitive" | "ambiguous" | null;
  verifying: boolean;
  /** Ids del hilo que ya existían al enviar: ninguno de ellos puede ser este. */
  knownIds: Set<string>;
  /** `seq` del último detalle pedido cuando el POST respondió (status sent). */
  sentSeq: number;
}

type PendingBuckets = Record<string, PendingMessage[]>;

/** Mensaje que devolvió el POST y que el detalle todavía puede no traer. */
interface ConfirmedMessage {
  message: SupportMessage;
  /** Solo un detalle pedido DESPUÉS de este seq lo trae con seguridad. */
  afterSeq: number;
}

const byCreatedAt = (a: SupportMessage, b: SupportMessage) =>
  a.createdAt.localeCompare(b.createdAt);

/**
 * El auto-refresco devuelve casi siempre lo mismo: sin cambios no se toca el
 * estado, así no se re-pinta la descripción (que puede traer imágenes) ni se
 * mueve el hilo. La descripción se compara aparte por tamaño.
 */
const sameDetail = (a: SupportRequestDetail | null, b: SupportRequestDetail) => {
  if (!a || a.id !== b.id) return false;
  if (a.descriptionHtml !== b.descriptionHtml) return false;
  return (
    JSON.stringify({ ...a, descriptionHtml: null }) ===
    JSON.stringify({ ...b, descriptionHtml: null })
  );
};

let localCounter = 0;
const nextLocalId = () => `local-${Date.now()}-${++localCounter}`;

/**
 * Detalle bajo demanda: solo se pide cuando el usuario abre una solicitud del
 * listado (trae la descripción con sus imágenes, que pesa).
 *
 * El hilo funciona como un chat: lo que se envía aparece al instante como
 * pendiente, la recarga posterior es silenciosa (sin skeleton) y, con el panel
 * abierto, se mira cada 20 s si soporte respondió.
 */
interface UseSupportRequestDetailOptions {
  /** Se marcó como leída en el servidor (T-993): el listado y el menú se actualizan. */
  onMarkedRead?: (id: string) => void;
}

export function useSupportRequestDetail({ onMarkedRead }: UseSupportRequestDetailOptions = {}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SupportRequestDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState<SupportDetailErrorState | null>(null);
  /** Falló una recarga silenciosa: se conserva lo que había y se avisa discreto. */
  const [refreshError, setRefreshError] = useState(false);
  const [confirmed, setConfirmed] = useState<ConfirmedMessage[]>([]);
  const [pendingByRequest, setPendingByRequest] = useState<PendingBuckets>({});

  // Espejos para leer lo último desde código asíncrono sin closures viejas.
  const selectedIdRef = useRef<string | null>(null);
  const pendingRef = useRef<PendingBuckets>({});
  const confirmedRef = useRef<ConfirmedMessage[]>([]);
  /** Ids conocidos del hilo de cada solicitud (detalle + confirmados del POST). */
  const knownIdsRef = useRef<Record<string, Set<string>>>({});
  /**
   * Ids del hilo que ya se atribuyeron a un envío propio (por el POST o por una
   * conciliación anterior): ningún otro pendiente puede reclamarlos.
   */
  const claimedIdsRef = useRef<Record<string, Set<string>>>({});

  // Control de peticiones de detalle: una sola en vuelo, y una respuesta vieja
  // nunca pisa a una más nueva.
  const seqRef = useRef(0);
  const lastAppliedSeqRef = useRef(0);
  const inFlightRef = useRef<{ id: string; seq: number } | null>(null);
  /** Quien pidió recargar mientras otra petición estaba en vuelo. */
  const waitersRef = useRef<((ok: boolean) => void)[]>([]);

  // Envíos en serie por solicitud: se guardan en el orden en que se escriben.
  const queuesRef = useRef<Record<string, Promise<void>>>({});
  const activeSendsRef = useRef(0);
  const [activeSends, setActiveSends] = useState(0);

  const commitPending = useCallback((fn: (prev: PendingBuckets) => PendingBuckets) => {
    const next = fn(pendingRef.current);
    if (next === pendingRef.current) return;
    pendingRef.current = next;
    setPendingByRequest(next);
  }, []);

  const commitConfirmed = useCallback(
    (fn: (prev: ConfirmedMessage[]) => ConfirmedMessage[]) => {
      const next = fn(confirmedRef.current);
      if (next === confirmedRef.current) return;
      confirmedRef.current = next;
      setConfirmed(next);
    },
    [],
  );

  const updatePending = useCallback(
    (requestId: string, localId: string, patch: Partial<PendingMessage>) => {
      commitPending((prev) => {
        const list = prev[requestId];
        if (!list?.some((p) => p.localId === localId)) return prev;
        return {
          ...prev,
          [requestId]: list.map((p) => (p.localId === localId ? { ...p, ...patch } : p)),
        };
      });
    },
    [commitPending],
  );

  const removePending = useCallback(
    (requestId: string, localId: string) => {
      commitPending((prev) => {
        const list = prev[requestId];
        if (!list?.some((p) => p.localId === localId)) return prev;
        return { ...prev, [requestId]: list.filter((p) => p.localId !== localId) };
      });
    },
    [commitPending],
  );

  const rememberIds = useCallback(
    (bucket: "known" | "claimed", requestId: string, ids: Iterable<string>) => {
      const store = bucket === "known" ? knownIdsRef.current : claimedIdsRef.current;
      const set = store[requestId] ?? new Set<string>();
      for (const id of ids) set.add(id);
      store[requestId] = set;
    },
    [],
  );

  /**
   * Resuelve los pendientes que el servidor ya tiene. Un pendiente se empareja
   * con el primer mensaje propio del hilo con el mismo texto y la misma
   * cantidad de adjuntos que NO existía cuando se envió y que no reclamó otro
   * pendiente. Sin idempotencia en el backend esto reduce el riesgo de
   * duplicados, no lo elimina: ver el PR.
   */
  const reconcile = useCallback(
    (requestId: string, messages: SupportMessage[], seq: number) => {
      commitPending((prev) => {
        const list = prev[requestId];
        if (!list || list.length === 0) return prev;

        const claimed = new Set<string>(claimedIdsRef.current[requestId] ?? []);
        const own = messages.filter((m) => m.origin === "external");

        const next = list.filter((p) => {
          if (p.status === "sending") return true;
          if (p.status === "failed" && p.failureKind !== "ambiguous") return true;
          // Un detalle pedido antes de que el POST respondiera puede no traerlo
          if (p.status === "sent" && seq <= p.sentSeq) return true;

          const match = own.find(
            (m) =>
              !p.knownIds.has(m.id) &&
              !claimed.has(m.id) &&
              m.content === p.content &&
              (p.status === "sent" || m.attachments.length === p.files.length),
          );
          if (match) {
            claimed.add(match.id);
            return false;
          }
          // El servidor confirmó el envío y este detalle es posterior: ya está
          // en el hilo aunque el emparejamiento no lo encuentre (p.ej. la API
          // descartó un adjunto). Mejor eso que un "Enviando…" eterno.
          return p.status !== "sent";
        });

        rememberIds("claimed", requestId, claimed);
        return next.length === list.length ? prev : { ...prev, [requestId]: next };
      });
    },
    [commitPending, rememberIds],
  );

  const applyDetail = useCallback(
    (adapted: SupportRequestDetail, seq: number) => {
      rememberIds("known", adapted.id, adapted.messages.map((m) => m.id));
      setDetail((prev) => (sameDetail(prev, adapted) ? prev : adapted));

      const serverIds = new Set(adapted.messages.map((m) => m.id));
      commitConfirmed((prev) => {
        const next = prev.filter(
          (c) => !serverIds.has(c.message.id) && c.afterSeq >= seq,
        );
        return next.length === prev.length ? prev : next;
      });

      reconcile(adapted.id, adapted.messages, seq);
    },
    [commitConfirmed, reconcile, rememberIds],
  );

  /**
   * Pide el detalle. `silent` no toca el skeleton ni el error de pantalla: es
   * para las recargas con el panel ya pintado (tras enviar, auto-refresco). Si
   * ya hay una petición en vuelo, se encola UNA más para cuando termine (la que
   * está en vuelo puede ser anterior a un envío). Resuelve true si la petición
   * que cubre esta llamada trajo el detalle.
   */
  const fetchDetail = useCallback(
    (id: string, silent: boolean): Promise<boolean> => {
      if (inFlightRef.current?.id === id) {
        return new Promise<boolean>((resolve) => waitersRef.current.push(resolve));
      }

      const seq = ++seqRef.current;
      inFlightRef.current = { id, seq };
      if (!silent) {
        setLoading(true);
        setErrorState(null);
      }

      const run = async (): Promise<boolean> => {
        try {
          const response = await getSupportRequest(id);
          if (!response?.data) {
            throw new SupportServiceError("La solicitud ya no está disponible.", "not_found");
          }
          if (id !== selectedIdRef.current || seq <= lastAppliedSeqRef.current) return false;
          lastAppliedSeqRef.current = seq;
          applyDetail(adaptSupportRequestDetail(response.data), seq);
          setRefreshError(false);
          return true;
        } catch (error) {
          console.error("Error loading support request detail:", error);
          if (id !== selectedIdRef.current) return false;
          if (silent) {
            // Se conserva lo que ya se veía: un corte de red no vacía el chat
            setRefreshError(true);
          } else {
            const err = error as SupportServiceError;
            setDetail(null);
            // Sin toast: el error se muestra dentro del modal y es reintentable
            setErrorState({
              message: err?.message || "No se pudo cargar la solicitud",
              code: err?.code ?? "unknown",
            });
          }
          return false;
        } finally {
          if (inFlightRef.current?.seq === seq) {
            inFlightRef.current = null;
            if (!silent) setLoading(false);
            const waiters = waitersRef.current;
            waitersRef.current = [];
            if (waiters.length > 0 && id === selectedIdRef.current) {
              void fetchDetail(id, true).then((ok) => waiters.forEach((w) => w(ok)));
            } else {
              waiters.forEach((w) => w(false));
            }
          }
        }
      };

      return run();
    },
    [applyDetail],
  );

  const resetThread = useCallback(() => {
    inFlightRef.current = null;
    const waiters = waitersRef.current;
    waitersRef.current = [];
    waiters.forEach((w) => w(false));
    commitConfirmed(() => []);
    setRefreshError(false);
  }, [commitConfirmed]);

  const open = useCallback(
    (id: string) => {
      // Doble clic en la misma fila mientras carga: no se pide dos veces
      if (selectedIdRef.current === id && inFlightRef.current?.id === id) return;
      selectedIdRef.current = id;
      resetThread();
      setSelectedId(id);
      setDetail(null);
      void fetchDetail(id, false);
    },
    [fetchDetail, resetThread],
  );

  const close = useCallback(() => {
    // Los pendientes NO se borran: un fallido sigue ahí (con Reintentar) si se
    // vuelve a abrir la solicitud mientras la página esté montada.
    selectedIdRef.current = null;
    resetThread();
    setSelectedId(null);
    setDetail(null);
    setErrorState(null);
    setLoading(false);
  }, [resetThread]);

  const runSend = useCallback(
    async (requestId: string, localId: string) => {
      const pending = pendingRef.current[requestId]?.find((p) => p.localId === localId);
      if (!pending) return; // descartado mientras esperaba en la cola

      // Lo que ya existe ANTES de este POST nunca puede ser este mensaje
      updatePending(requestId, localId, {
        status: "sending",
        failureKind: null,
        verifying: false,
        knownIds: new Set(knownIdsRef.current[requestId] ?? []),
      });

      try {
        const response = await createSupportRequestMessage(
          requestId,
          pending.content,
          pending.attachments,
        );

        const created = response?.data?.id ? adaptSupportMessage(response.data) : null;
        if (created) {
          rememberIds("known", requestId, [created.id]);
          rememberIds("claimed", requestId, [created.id]);
          // En el mismo render: sale el pendiente y entra el mensaje real
          if (requestId === selectedIdRef.current) {
            commitConfirmed((prev) => [
              ...prev.filter((c) => c.message.id !== created.id),
              { message: created, afterSeq: seqRef.current },
            ]);
          }
          removePending(requestId, localId);
        } else {
          updatePending(requestId, localId, { status: "sent", sentSeq: seqRef.current });
        }

        // La API de creación no trae el hilo: se recarga, sin skeleton
        if (requestId === selectedIdRef.current) void fetchDetail(requestId, true);
      } catch (error) {
        console.error("Error sending support request message:", error);
        const err = error as SupportServiceError;
        const code = typeof err?.code === "string" ? err.code : "";
        updatePending(requestId, localId, {
          status: "failed",
          failureKind: DEFINITIVE_ERRORS.has(code) ? "definitive" : "ambiguous",
        });
        // Escritura: sí lleva toast (igual que la creación de solicitudes)
        toastError(error, err?.message || "No se pudo enviar el mensaje");
      }
    },
    [commitConfirmed, fetchDetail, rememberIds, removePending, updatePending],
  );

  const enqueue = useCallback(
    (requestId: string, localId: string) => {
      activeSendsRef.current += 1;
      setActiveSends(activeSendsRef.current);
      const previous = queuesRef.current[requestId] ?? Promise.resolve();
      const next = previous
        .then(() => runSend(requestId, localId))
        .finally(() => {
          activeSendsRef.current -= 1;
          setActiveSends(activeSendsRef.current);
        });
      queuesRef.current[requestId] = next;
    },
    [runSend],
  );

  /**
   * Añade un mensaje al hilo, con sus adjuntos si los hay. Aparece al instante
   * como pendiente y se envía en cola; nunca se reintenta solo (la API corta en
   * 20 mensajes por hora por solicitud). Devuelve true si quedó encolado.
   */
  const sendMessage = useCallback(
    (content: string, attachments?: SupportAttachment[]): boolean => {
      const requestId = selectedIdRef.current;
      if (!requestId || !content.trim()) return false;

      const localId = nextLocalId();
      const pending: PendingMessage = {
        localId,
        requestId,
        content: content.trim(),
        attachments,
        files: (attachments ?? []).map((a) => ({
          name: a.fileName,
          previewUrl: a.mimeType.startsWith("image/")
            ? `data:${a.mimeType};base64,${a.contentBase64}`
            : null,
        })),
        createdAt: new Date().toISOString(),
        status: "sending",
        failureKind: null,
        verifying: false,
        knownIds: new Set(knownIdsRef.current[requestId] ?? []),
        sentSeq: 0,
      };

      commitPending((prev) => ({
        ...prev,
        [requestId]: [...(prev[requestId] ?? []), pending],
      }));
      enqueue(requestId, localId);
      return true;
    },
    [commitPending, enqueue],
  );

  /**
   * Reintento manual. Si el fallo fue ambiguo, antes se mira el hilo: si el
   * mensaje ya está, se da por enviado sin volver a mandarlo.
   */
  const retryMessage = useCallback(
    async (localId: string) => {
      const requestId = selectedIdRef.current;
      if (!requestId) return;
      const pending = pendingRef.current[requestId]?.find((p) => p.localId === localId);
      if (!pending || pending.status !== "failed" || pending.verifying) return;

      if (pending.failureKind === "ambiguous") {
        updatePending(requestId, localId, { verifying: true });
        const ok = await fetchDetail(requestId, true);
        const still = pendingRef.current[requestId]?.find((p) => p.localId === localId);
        if (!still) return; // ya estaba en el hilo: conciliado
        updatePending(requestId, localId, { verifying: false });
        if (!ok) {
          // Sin poder mirar el hilo no se reenvía: podría duplicarse
          toastError(
            null,
            "No se pudo comprobar si el mensaje ya llegó. Revisa tu conexión e intenta de nuevo.",
          );
          return;
        }
      }

      enqueue(requestId, localId);
    },
    [enqueue, fetchDetail, updatePending],
  );

  const discardMessage = useCallback(
    (localId: string) => {
      const requestId = selectedIdRef.current;
      if (requestId) removePending(requestId, localId);
    },
    [removePending],
  );

  const retry = useCallback(() => {
    if (selectedId) void fetchDetail(selectedId, false);
  }, [fetchDetail, selectedId]);

  // Auto-refresco: solo con el panel abierto y visible, con el detalle ya
  // cargado y sin envíos en curso (cada envío ya pide su propia recarga).
  useEffect(() => {
    if (!selectedId) return;

    const tick = () => {
      if (document.visibilityState !== "visible") return;
      if (activeSendsRef.current > 0 || inFlightRef.current) return;
      if (selectedIdRef.current !== selectedId) return;
      void fetchDetail(selectedId, true);
    };

    const interval = window.setInterval(tick, POLL_INTERVAL_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchDetail, selectedId]);

  // T-993: marcar como leída. Solo con la pestaña visible y solo cuando cambia
  // el último mensaje que se tiene a la vista: ni una llamada por cada poll ni
  // por recargas en segundo plano. Un fallo es silencioso (la marca se
  // reintenta al próximo cambio o al volver a abrir).
  const markedRef = useRef<Record<string, string>>({});
  const onMarkedReadRef = useRef(onMarkedRead);
  onMarkedReadRef.current = onMarkedRead;
  const [pageVisible, setPageVisible] = useState(
    () => typeof document === "undefined" || document.visibilityState === "visible",
  );

  useEffect(() => {
    const onVisibility = () => setPageVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const detailId = detail?.id ?? null;
  const lastMessageId = detail?.lastMessage?.id ?? null;
  const lastMessageAt = detail?.lastMessage?.createdAt ?? null;

  useEffect(() => {
    if (!pageVisible || !detailId || !lastMessageId) return;
    if (selectedIdRef.current !== detailId) return;
    if (markedRef.current[detailId] === lastMessageId) return;
    markedRef.current[detailId] = lastMessageId;

    markSupportRequestRead(detailId, lastMessageId, lastMessageAt)
      .then(() => onMarkedReadRef.current?.(detailId))
      .catch((error) => {
        console.error("Error marking support request as read:", error);
        // Se olvida para que el próximo cambio o la próxima apertura lo reintente
        if (markedRef.current[detailId] === lastMessageId) delete markedRef.current[detailId];
      });
  }, [pageVisible, detailId, lastMessageId, lastMessageAt]);

  /**
   * Hilo que ve la UI: detalle + confirmados del POST que el detalle aún no
   * trae (deduplicado por id) + pendientes de ESTA solicitud al final.
   */
  const messages = useMemo<SupportMessage[]>(() => {
    if (!detail) return [];
    const server = detail.messages;
    const serverIds = new Set(server.map((m) => m.id));
    const extra = confirmed
      .map((c) => c.message)
      .filter((m) => !serverIds.has(m.id));
    const thread = extra.length > 0 ? [...server, ...extra].sort(byCreatedAt) : server;

    const pending = pendingByRequest[detail.id] ?? [];
    if (pending.length === 0) return thread;

    // Mismo nombre que los mensajes propios ya enviados, para que se agrupen
    const ownName =
      [...thread].reverse().find((m) => m.origin === "external")?.authorName ?? null;

    return [
      ...thread,
      ...pending.map<SupportMessage>((p) => ({
        id: p.localId,
        origin: "external",
        authorName: ownName,
        event: null,
        content: p.content,
        createdAt: p.createdAt,
        attachments: [],
        delivery: {
          localId: p.localId,
          status: p.status === "failed" ? "failed" : "sending",
          failureKind: p.failureKind,
          verifying: p.verifying,
          files: p.files,
        },
      })),
    ];
  }, [confirmed, detail, pendingByRequest]);

  return {
    isOpen: selectedId !== null,
    detail,
    messages,
    loading,
    errorState,
    refreshError,
    sending: activeSends > 0,
    open,
    close,
    retry,
    sendMessage,
    retryMessage,
    discardMessage,
  };
}
