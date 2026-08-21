import { supabase } from "@/integrations/supabase/client";
import type {
  BoardApiResponse,
  ConversationsApiResponse,
  ThreadApiResponse,
  CrmWriteResponse,
  ChannelMetricsResponse,
  ChannelOverTimeResponse,
  ChannelProductsResponse,
  ChannelCostsResponse,
} from "../types/crm.types";

// Canal por defecto. Hoy la bandeja comparte número con el chatbot, así que lee
// el mismo canal en el que el bot ya registra todos los mensajes. Cuando el ERP
// tenga número propio pasará a CRMWA, que ya está sembrado.
export const DEFAULT_CHANNEL_CODE = "CHBOTW";

/**
 * Los SPs del CRM son nuevos y todavía no figuran en los tipos generados de
 * Supabase (`src/integrations/supabase/types.ts`), así que `supabase.rpc` los
 * rechaza en compilación. Se concentra el destipado acá en vez de repartir un
 * cast por llamada: cuando se regeneren los tipos, se borra este bloque y las
 * llamadas quedan igual.
 */
const db = supabase as unknown as {
  rpc: (
    fn: string,
    params?: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

/**
 * Los SPs devuelven `{ success: false, error }` en vez de lanzar, para poder
 * distinguir un rechazo de negocio (otro asesor tiene el chat) de un fallo de
 * infraestructura. Acá se normalizan a excepción para que el hook tenga un solo
 * camino de error.
 */
function unwrap<T extends { success: boolean; error?: string }>(
  data: T | null,
  error: { message: string } | null,
  fallbackMessage: string
): T {
  if (error) throw new Error(error.message);
  if (!data) throw new Error(fallbackMessage);
  if (!data.success) throw new Error(data.error || fallbackMessage);
  return data;
}

export interface ListParams {
  channelCode?: string;
  search?: string | null;
  situationId?: number | null;
  assignedTo?: string | null;
  unassigned?: boolean;
  taken?: boolean | null;
  page: number;
  size: number;
}

export const getConversationsApi = async (
  params: ListParams
): Promise<ConversationsApiResponse> => {
  const { data, error } = await db.rpc("sp_crm_conversations_list", {
    p_channel_code: params.channelCode ?? DEFAULT_CHANNEL_CODE,
    p_search: params.search?.trim() || null,
    p_situation_id: params.situationId ?? null,
    p_assigned_to: params.assignedTo ?? null,
    p_unassigned: params.unassigned ?? false,
    p_taken: params.taken ?? null,
    p_page: params.page,
    p_size: params.size,
  });

  return unwrap(
    data as ConversationsApiResponse | null,
    error,
    "No se pudieron cargar las conversaciones."
  );
};

export const getConversationThreadApi = async (
  phoneNumber: number | null,
  whatsappUserId: string | null,
  channelCode: string = DEFAULT_CHANNEL_CODE
): Promise<ThreadApiResponse> => {
  const { data, error } = await db.rpc("sp_crm_conversation_thread", {
    p_channel_code: channelCode,
    p_phone_number: phoneNumber,
    p_whatsapp_user_id: whatsappUserId,
    p_limit: 200,
    p_before_id: null,
  });

  return unwrap(
    data as ThreadApiResponse | null,
    error,
    "No se pudo cargar la conversación."
  );
};

/**
 * Cambia la etapa. El SP toma el autor de `auth.uid()`, así que la llamada
 * tiene que salir con la sesión del usuario — que es justo lo que hace
 * `supabase.rpc` desde el navegador.
 */
export const setConversationSituationApi = async (
  channelId: number,
  situationId: number,
  phoneNumber: number | null,
  whatsappUserId: string | null,
  message?: string
): Promise<CrmWriteResponse> => {
  const { data, error } = await db.rpc("sp_crm_set_conversation_situation", {
    p_channel_id: channelId,
    p_situation_id: situationId,
    p_phone_number: phoneNumber,
    p_whatsapp_user_id: whatsappUserId,
    p_message: message ?? null,
  });

  return unwrap(
    data as CrmWriteResponse | null,
    error,
    "No se pudo cambiar la etapa."
  );
};

/** `assignedTo = null` desasigna: devuelve la conversación a la bandeja general. */
export const assignConversationApi = async (
  channelId: number,
  assignedTo: string | null,
  phoneNumber: number | null,
  whatsappUserId: string | null
): Promise<CrmWriteResponse> => {
  const { data, error } = await db.rpc("sp_crm_assign_conversation", {
    p_channel_id: channelId,
    p_assigned_to: assignedTo,
    p_phone_number: phoneNumber,
    p_whatsapp_user_id: whatsappUserId,
    p_only_if_unassigned: false,
  });

  return unwrap(
    data as CrmWriteResponse | null,
    error,
    "No se pudo asignar la conversación."
  );
};

/** Tomar el control calla al bot en esa conversación; soltarlo se lo devuelve. */
export const takeConversationApi = async (
  channelId: number,
  phoneNumber: number | null,
  whatsappUserId: string | null,
  release = false
): Promise<CrmWriteResponse> => {
  const { data, error } = await db.rpc("sp_crm_take_conversation", {
    p_channel_id: channelId,
    p_phone_number: phoneNumber,
    p_whatsapp_user_id: whatsappUserId,
    p_release: release,
  });

  return unwrap(
    data as CrmWriteResponse | null,
    error,
    release ? "No se pudo devolver el control." : "No se pudo tomar el control."
  );
};

/** Id del canal, que los SPs de escritura piden por id y no por código. */
export const getChannelIdApi = async (
  code: string = DEFAULT_CHANNEL_CODE
): Promise<number> => {
  const { data, error } = await supabase
    .from("channels")
    .select("id")
    .eq("code", code)
    .single();

  if (error) throw error;
  return data.id as number;
};

/** Etapas del módulo CRM, para el selector. */
export const getCrmSituationsApi = async () => {
  const { data, error } = await supabase
    .from("situations")
    .select("id, name, code, order, statuses(code), modules!inner(code)")
    .eq("modules.code", "CRM")
    .order("order", { ascending: true });

  if (error) throw error;
  return data ?? [];
};

export interface ErpUser {
  id: string;
  name: string;
  role: string;
}

/**
 * Colaboradores del ERP, para el selector de "asignar a otro asesor".
 *
 * Se usa sp_get_users y no una consulta a `accounts`: ese SP ya filtra por
 * colaborador activo y —lo que importa acá— devuelve `profiles_id`, que es el
 * uuid de auth. Consultar `accounts` directo mezcla clientes con colaboradores
 * y devuelve el id de la cuenta, que no sirve como responsable.
 */
export const getErpUsersApi = async (search?: string): Promise<ErpUser[]> => {
  const { data, error } = await db.rpc("sp_get_users", {
    p_person_type: null,
    p_show: null,
    p_role: null,
    p_warehouses: null,
    p_branches: null,
    p_order: null,
    p_search: search?.trim() || null,
    p_page: 1,
    p_size: 100,
  });

  if (error) throw new Error(error.message);

  const rows = (data as { data?: Array<Record<string, unknown>> } | null)?.data ?? [];

  return rows
    .filter((r) => !!r.profiles_id)
    .map((r) => ({
      id: String(r.profiles_id),
      name: [r.name, r.last_name].filter(Boolean).join(" ").trim() || String(r.user_name ?? ""),
      role: String(r.role ?? ""),
    }));
};

/** Columnas del tablero, cada una con sus tarjetas y su total real. */
export const getConversationsBoardApi = async (
  search?: string,
  assignedTo?: string | null,
  channelCode: string = DEFAULT_CHANNEL_CODE
): Promise<BoardApiResponse> => {
  const { data, error } = await db.rpc("sp_crm_conversations_board", {
    p_channel_code: channelCode,
    p_search: search?.trim() || null,
    p_assigned_to: assignedTo ?? null,
    p_limit_column: 40,
  });

  return unwrap(
    data as BoardApiResponse | null,
    error,
    "No se pudo cargar el tablero."
  );
};

// ---------------------------------------------------------------------------
// Enviar
// ---------------------------------------------------------------------------

/**
 * Motivos por los que un envío puede rechazarse. Se distinguen porque cada uno
 * se resuelve de una manera distinta: tomar el control, esperar al cliente, o
 * avisarle a sistemas.
 */
export type SendRejectReason =
  | "no_control"
  | "taken_by_other"
  | "window_closed"
  | "not_configured"
  | "meta_error"
  | "not_found"
  | "no_auth"
  | "no_identity"
  | "not_allowed";

export interface SendMessageResult {
  success: boolean;
  reason?: SendRejectReason;
  error?: string;
  takenByName?: string | null;
  /** El mensaje salió pero no se pudo guardar en el historial. No reenviar. */
  warning?: string;
  wamid?: string | null;
}

/**
 * El envío pasa SIEMPRE por la edge function: el token de Meta vive en el
 * backend y no puede llegar al navegador. La function valida el control del
 * lado del servidor, así que este llamado no es la defensa — la pantalla
 * bloquea antes solo para no hacer perder el tiempo.
 */
export const sendMessageApi = async (
  channelId: number,
  phoneNumber: number | null,
  whatsappUserId: string | null,
  message: string
): Promise<SendMessageResult> => {
  const { data, error } = await supabase.functions.invoke("crm-send-message", {
    body: {
      channelId,
      phoneNumber,
      whatsappUserId,
      message,
    },
  });

  // Con un status fuera de 2xx, invoke deja data en null y mete la respuesta
  // dentro del error. Los rechazos de negocio viajan así (409/502/503), y sin
  // leer ese cuerpo se perdería el motivo y solo quedaría un "Edge Function
  // returned a non-2xx status code" que no le dice nada a nadie.
  if (error) {
    const context = (error as { context?: Response }).context;

    if (context && typeof context.json === "function") {
      try {
        const body = (await context.json()) as SendMessageResult;
        if (body?.error) return { ...body, success: false };
      } catch {
        // Cuerpo no-JSON: cae al mensaje genérico de abajo.
      }
    }

    return { success: false, error: error.message || "No se pudo enviar el mensaje." };
  }

  return (data ?? { success: false, error: "No se pudo enviar el mensaje." }) as SendMessageResult;
};

// ---------------------------------------------------------------------------
// Rendimiento por canal
// ---------------------------------------------------------------------------

/** KPIs de los tres canales, con su comparativa contra el periodo anterior. */
export const getChannelMetricsApi = async (
  startDate: string,
  endDate: string
): Promise<ChannelMetricsResponse> => {
  const { data, error } = await db.rpc("sp_crm_channel_metrics", {
    p_start_date: startDate,
    p_end_date: endDate,
  });

  return unwrap(
    data as ChannelMetricsResponse | null,
    error,
    "No se pudieron cargar las metricas por canal."
  );
};

/** Serie para el grafico de evolucion. */
export const getChannelOverTimeApi = async (
  startDate: string,
  endDate: string,
  granularity: "day" | "week" | "month"
): Promise<ChannelOverTimeResponse> => {
  const { data, error } = await db.rpc("sp_crm_channel_over_time", {
    p_start_date: startDate,
    p_end_date: endDate,
    p_granularity: granularity,
  });

  return unwrap(
    data as ChannelOverTimeResponse | null,
    error,
    "No se pudo cargar la evolucion por canal."
  );
};

/** Top de productos. Sin code, trae el top de cada canal. */
export const getChannelTopProductsApi = async (
  startDate: string,
  endDate: string,
  code: string | null,
  limit = 8
): Promise<ChannelProductsResponse> => {
  const { data, error } = await db.rpc("sp_crm_channel_top_products", {
    p_start_date: startDate,
    p_end_date: endDate,
    p_code: code,
    p_limit: limit,
  });

  return unwrap(
    data as ChannelProductsResponse | null,
    error,
    "No se pudieron cargar los productos del canal."
  );
};

/** Costos por canal cruzados con los ingresos del mismo periodo. */
export const getChannelCostsApi = async (
  startDate: string,
  endDate: string
): Promise<ChannelCostsResponse> => {
  const { data, error } = await db.rpc("sp_crm_channel_costs", {
    p_start_date: startDate,
    p_end_date: endDate,
  });

  return unwrap(
    data as ChannelCostsResponse | null,
    error,
    "No se pudieron cargar los costos por canal."
  );
};
