import { supabase } from "@/integrations/supabase/client";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";
import { errorMessageOf, FunctionError } from "@/shared/utils/functionError";
import { getTodayDate } from "@/shared/utils/date";
import { extensionOf, mediaTypeOf } from "../utils/attachments";
import type {
  ConversationChannel,
  OutgoingMedia,
  ConversationsApiResponse,
  ThreadApiResponse,
  CrmWriteResponse,
  BotPauseApi,
  ChannelMetricsResponse,
  ChannelOverTimeResponse,
  ChannelProductsResponse,
  ChannelCostsResponse,
  BoardApiResponse,
} from "../types/crm.types";
import type {
  ChatbotTemplateCreateInput,
  TemplateTestApi,
  ChatbotTemplateCreateResponse,
  ChatbotTemplateDeleteResponse,
  ChatbotTemplateMeta,
  ChatbotTagsListResponse,
  ChatbotTemplatesListResponse,
  ChatbotTemplateUpdateResponse,
} from "../types/chatbotTemplates.types";
import type {
  ChatbotPromptSettingHistoryResponse,
  ChatbotPromptSettingSaveResponse,
  ChatbotPromptSettingsDiscardResponse,
  ChatbotPromptSettingsListResponse,
  ChatbotPromptSettingsPublishResponse,
} from "../types/chatbotBehavior.types";
import type {
  PromptBlockCreateInput,
  PromptBlockHistoryResponse,
  PromptBlockMutationResponse,
  PromptBlocksListResponse,
} from "../types/chatbotConsiderations.types";

// Canal por defecto. Hoy la bandeja comparte número con el chatbot, así que lee
// el mismo canal en el que el bot ya registra todos los mensajes. Los SPs de
// personalizado lo toman por defecto y un NULL los rompe: se manda siempre.
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
  /** false = solo las de ventana vencida. */
  windowOpen?: boolean | null;
  /** Red de los chats; null = todas. */
  network?: ConversationChannel | null;
  page: number;
  size: number;
}

/**
 * El SP devuelve el id del canal en `channel_id`, que es el que piden los SPs
 * de escritura.
 */
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
    p_window_open: params.windowOpen ?? null,
    p_network: params.network ?? null,
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
 * colaborador activo y devuelve `profiles_id`, que es el uuid de auth.
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
  | "not_allowed"
  | "caption_not_allowed"
  | "unsupported_media"
  | "media_too_large"
  | "media_unreachable";

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
 * servicio del bot y no puede llegar al navegador. La function valida el
 * control del lado del servidor; la pantalla bloquea antes solo para no hacer
 * perder el tiempo.
 */
export const sendMessageApi = async (
  channelId: number,
  phoneNumber: number | null,
  whatsappUserId: string | null,
  message: string,
  media: OutgoingMedia | null = null
): Promise<SendMessageResult> => {
  // A diferencia del resto del ERP, aquí el rechazo NO se propaga: la pantalla
  // lo pinta dentro de la conversación, así que se devuelve como resultado.
  try {
    const data = await invokeFunction<SendMessageResult>("crm-send-message", {
      body: {
        channelId,
        phoneNumber,
        whatsappUserId,
        message,
        media,
      },
    });

    return (data ?? {
      success: false,
      error: "No se pudo enviar el mensaje.",
    }) as SendMessageResult;
  } catch (error) {
    // Los rechazos de negocio (409/502/503) traen `reason` y `takenByName` en
    // `error.body`: sin ellos no se distingue "no se pudo enviar" de "la
    // conversación la tomó otro".
    if (error instanceof FunctionError && error.body) {
      return { ...(error.body as SendMessageResult), success: false };
    }

    return {
      success: false,
      error: errorMessageOf(error, "No se pudo enviar el mensaje."),
    };
  }
};

/**
 * Sube el adjunto al bucket `crm` antes de mandarlo: crm-send-message recibe
 * solo la URL y el bot la descarga para reenviarla a Meta.
 *
 * Ruta: outgoing/<canal>/<día Lima>/<uuid>.<ext>. La policy del bucket exige
 * que la primera carpeta sea `outgoing` (personalizado no tiene tenant), y el
 * nombre es un UUID porque el bucket es público. Si el envío se rechaza, la
 * edge function borra el archivo.
 */
export const uploadAttachmentApi = async (
  channelId: number,
  file: File
): Promise<OutgoingMedia> => {
  const storagePath = `outgoing/${channelId}/${getTodayDate()}/${crypto.randomUUID()}.${extensionOf(file)}`;
  const mimeType = file.type || "application/octet-stream";

  const { error } = await supabase.storage
    .from("crm")
    .upload(storagePath, file, { contentType: mimeType, upsert: false });
  if (error) throw new Error(`No se pudo subir el archivo: ${error.message}`);

  const {
    data: { publicUrl },
  } = supabase.storage.from("crm").getPublicUrl(storagePath);

  return {
    type: mediaTypeOf(file),
    url: publicUrl,
    storagePath,
    mimeType,
    fileName: file.name,
    sizeBytes: file.size,
  };
};

// ---------------------------------------------------------------------------
// Pausa del bot
// ---------------------------------------------------------------------------

/**
 * Estado, pausa y reactivación del bot en una conversación. Todo pasa por
 * crm-bot-pause, que valida el permiso (crm_conversations.take) y habla con el
 * servicio del chatbot; el navegador nunca ve su secreto.
 */
const botPauseCall = async (
  action: "status" | "pause" | "resume",
  channelId: number,
  phoneNumber: number | null,
  whatsappUserId: string | null,
  until?: string | null
): Promise<BotPauseApi> => {
  const data = await invokeFunction<{ success: boolean; data: BotPauseApi }>("crm-bot-pause", {
    body: {
      action,
      channelId,
      phoneNumber,
      whatsappUserId,
      ...(action === "pause" ? { until: until ?? null } : {}),
    },
  });
  return data.data;
};

export const getBotPauseApi = (channelId: number, phoneNumber: number | null, whatsappUserId: string | null) =>
  botPauseCall("status", channelId, phoneNumber, whatsappUserId);

/** `until` = ISO con zona, o null para "hasta que lo reactive". */
export const pauseBotApi = (
  channelId: number,
  phoneNumber: number | null,
  whatsappUserId: string | null,
  until: string | null
) => botPauseCall("pause", channelId, phoneNumber, whatsappUserId, until);

export const resumeBotApi = (channelId: number, phoneNumber: number | null, whatsappUserId: string | null) =>
  botPauseCall("resume", channelId, phoneNumber, whatsappUserId);

// ---------------------------------------------------------------------------
// Rendimiento y costos por canal
// ---------------------------------------------------------------------------

/** KPIs de los tres canales, con su comparativa contra el período anterior. */
export const getChannelMetricsApi = async (
  startDate: string,
  endDate: string
): Promise<ChannelMetricsResponse> => {
  const { data, error } = await db.rpc("sp_crm_channel_metrics", {
    p_start_date: startDate,
    p_end_date: endDate,
  });

  return unwrap(data as ChannelMetricsResponse | null, error, "No se pudieron cargar las métricas por canal.");
};

/** Serie para el gráfico de evolución. */
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

  return unwrap(data as ChannelOverTimeResponse | null, error, "No se pudo cargar la evolución por canal.");
};

/** Top de productos. Sin canal, trae el top de cada uno. */
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

  return unwrap(data as ChannelProductsResponse | null, error, "No se pudieron cargar los productos del canal.");
};

/** Costos por canal cruzados con los ingresos del mismo período. */
export const getChannelCostsApi = async (
  startDate: string,
  endDate: string
): Promise<ChannelCostsResponse> => {
  const { data, error } = await db.rpc("sp_crm_channel_costs", {
    p_start_date: startDate,
    p_end_date: endDate,
  });

  return unwrap(data as ChannelCostsResponse | null, error, "No se pudieron cargar los costos por canal.");
};

// ---------------------------------------------------------------------------
// Chatbot: plantillas y comportamiento (solo personalizado)
// ---------------------------------------------------------------------------

/** T-902: plantillas de texto del chatbot. Solo admin (lo exige el SP). */
export const getChatbotTemplatesApi = async (): Promise<ChatbotTemplatesListResponse> => {
  const { data, error } = await db.rpc("sp_crm_chatbot_templates_list");

  return unwrap(
    data as ChatbotTemplatesListResponse | null,
    error,
    "No se pudieron cargar las plantillas del chatbot."
  );
};

/**
 * Guarda el texto de una plantilla. `expectedUpdatedAt` evita pisar lo que
 * otro admin guardó mientras el editor estaba abierto. `meta` (etiqueta
 * principal y extras, T-917) no va en las especiales.
 */
export const updateChatbotTemplateApi = async (
  id: number,
  content: string,
  expectedUpdatedAt: string,
  meta?: ChatbotTemplateMeta
): Promise<ChatbotTemplateUpdateResponse> => {
  const { data, error } = await db.rpc("sp_crm_chatbot_template_update", {
    p_id: id,
    p_content: content,
    p_expected_updated_at: expectedUpdatedAt,
    ...(meta ? { p_topic: meta.topic, p_tags: meta.tags } : {}),
  });

  return unwrap(
    data as ChatbotTemplateUpdateResponse | null,
    error,
    "No se pudo guardar la plantilla."
  );
};

/** T-917: las etiquetas de las plantillas, con cuántas plantillas usan cada una. */
export const getChatbotTagsApi = async (): Promise<ChatbotTagsListResponse> => {
  const { data, error } = await db.rpc("sp_crm_chatbot_tags_list");

  return unwrap(
    data as ChatbotTagsListResponse | null,
    error,
    "No se pudieron cargar las etiquetas del chatbot."
  );
};

/** T-917: crea una plantilla nueva. El bot la agrega solo al índice de su prompt. */
export const createChatbotTemplateApi = async (
  input: ChatbotTemplateCreateInput
): Promise<ChatbotTemplateCreateResponse> => {
  const { data, error } = await db.rpc("sp_crm_chatbot_template_create", {
    p_name: input.name,
    p_content: input.content,
    p_topic: input.topic,
    p_tags: input.tags,
    // Nacen activas: el modo observación de T-921 se quitó del ERP (30/10/2026).
    p_en_observacion: false,
  });

  return unwrap(
    data as ChatbotTemplateCreateResponse | null,
    error,
    "No se pudo crear la plantilla."
  );
};

/** T-922: si Jev puede mandarla sola, sin el modelo (las bloqueadas las rechaza el SP). */
export const setChatbotTemplateSaleSolaApi = async (id: number, saleSola: boolean): Promise<ChatbotTemplateUpdateResponse> => {
  const { data, error } = await db.rpc("sp_crm_chatbot_template_set_sale_sola", { p_id: id, p_sale_sola: saleSola });

  return unwrap(
    data as ChatbotTemplateUpdateResponse | null,
    error,
    "No se pudo cambiar si Jev manda la plantilla sola."
  );
};

/** Elimina una plantilla. T-922: cualquiera que no esté bloqueada (las bloqueadas las rechaza el SP). */
export const deleteChatbotTemplateApi = async (id: number): Promise<ChatbotTemplateDeleteResponse> => {
  const { data, error } = await db.rpc("sp_crm_chatbot_template_delete", { p_id: id });

  return unwrap(
    data as ChatbotTemplateDeleteResponse | null,
    error,
    "No se pudo eliminar la plantilla."
  );
};

/** T-921: "Probar antes de guardar". La prueba la hace el servicio del bot (Jev) vía crm-chatbot-template-test. */
export const testChatbotTemplateApi = async (input: {
  examples: string[];
  draft: { name: string; text: string; topic: string; tags: string[] };
  editing: string | null;
}): Promise<TemplateTestApi> => {
  const data = await invokeFunction<{ success: boolean; data: TemplateTestApi }>("crm-chatbot-template-test", {
    body: { action: "test", ...input },
  });
  return data.data;
};

// ---------------------------------------------------------------------------
// Comportamiento del chatbot: ajustes del prompt que edita el cliente
// (chatbot_prompt_settings). Solo admin (lo exigen los SP). El bot lee solo lo
// publicado; lo que se guarda acá queda como borrador hasta publicar.
// ---------------------------------------------------------------------------

export const getChatbotPromptSettingsApi = async (): Promise<ChatbotPromptSettingsListResponse> => {
  const { data, error } = await db.rpc("sp_crm_chatbot_prompt_settings_list");
  return unwrap(
    data as ChatbotPromptSettingsListResponse | null,
    error,
    "No se pudo cargar el comportamiento del chatbot."
  );
};

/** Guarda el borrador de un ajuste. `expectedUpdatedAt` evita pisar lo que otro admin guardó. */
export const saveChatbotPromptSettingDraftApi = async (
  code: string,
  value: string,
  expectedUpdatedAt: string
): Promise<ChatbotPromptSettingSaveResponse> => {
  const { data, error } = await db.rpc("sp_crm_chatbot_prompt_setting_save_draft", {
    p_setting_code: code,
    p_value: value,
    p_expected_updated_at: expectedUpdatedAt,
  });
  return unwrap(data as ChatbotPromptSettingSaveResponse | null, error, "No se pudo guardar el borrador.");
};

/** Todos los borradores pasan a lo publicado juntos: o se publican todos, o ninguno. */
export const publishChatbotPromptSettingsApi = async (): Promise<ChatbotPromptSettingsPublishResponse> => {
  const { data, error } = await db.rpc("sp_crm_chatbot_prompt_settings_publish");
  return unwrap(data as ChatbotPromptSettingsPublishResponse | null, error, "No se pudo publicar.");
};

export const discardChatbotPromptSettingsApi = async (): Promise<ChatbotPromptSettingsDiscardResponse> => {
  const { data, error } = await db.rpc("sp_crm_chatbot_prompt_settings_discard", {});
  return unwrap(data as ChatbotPromptSettingsDiscardResponse | null, error, "No se pudieron descartar los cambios.");
};

/** Lo que se publicó de un ajuste, del más nuevo al más viejo (audit_log). */
export const getChatbotPromptSettingHistoryApi = async (code: string): Promise<ChatbotPromptSettingHistoryResponse> => {
  const { data, error } = await db.rpc("sp_crm_chatbot_prompt_setting_history", { p_setting_code: code });
  return unwrap(data as ChatbotPromptSettingHistoryResponse | null, error, "No se pudo cargar el historial.");
};

// ---------------------------------------------------------------------------
// Consideraciones: el prompt del bot en párrafos (chatbot_prompt_blocks). Solo
// admin. Lo que se guarda el bot lo usa en menos de un minuto.
// ---------------------------------------------------------------------------

export const getPromptBlocksApi = async (): Promise<PromptBlocksListResponse> => {
  const { data, error } = await db.rpc("sp_crm_chatbot_prompt_blocks_list");
  return unwrap(data as PromptBlocksListResponse | null, error, "No se pudieron cargar las consideraciones del chatbot.");
};

export const savePromptBlockApi = async (
  id: number,
  content: string,
  expectedUpdatedAt: string,
  meta?: { title?: string; tags?: string[] }
): Promise<PromptBlockMutationResponse> => {
  const { data, error } = await db.rpc("sp_crm_chatbot_prompt_block_save", {
    p_id: id,
    p_content: content,
    p_expected_updated_at: expectedUpdatedAt,
    ...(meta?.title !== undefined ? { p_title: meta.title } : {}),
    ...(meta?.tags !== undefined ? { p_tags: meta.tags } : {}),
  });
  return unwrap(data as PromptBlockMutationResponse | null, error, "No se pudo guardar.");
};

export const createPromptBlockApi = async (input: PromptBlockCreateInput): Promise<PromptBlockMutationResponse> => {
  const { data, error } = await db.rpc("sp_crm_chatbot_prompt_block_create", {
    p_heading_key: input.headingKey,
    p_title: input.title,
    p_content: input.content,
    p_tags: input.tags,
  });
  return unwrap(data as PromptBlockMutationResponse | null, error, "No se pudo agregar.");
};

export const setPromptBlockActiveApi = async (id: number, active: boolean): Promise<PromptBlockMutationResponse> => {
  const { data, error } = await db.rpc("sp_crm_chatbot_prompt_block_set_active", { p_id: id, p_active: active });
  return unwrap(data as PromptBlockMutationResponse | null, error, "No se pudo cambiar.");
};

export const restorePromptBlockApi = async (id: number): Promise<PromptBlockMutationResponse> => {
  const { data, error } = await db.rpc("sp_crm_chatbot_prompt_block_restore", { p_id: id });
  return unwrap(data as PromptBlockMutationResponse | null, error, "No se pudo volver al texto del equipo.");
};

export const deletePromptBlockApi = async (id: number): Promise<PromptBlockMutationResponse> => {
  const { data, error } = await db.rpc("sp_crm_chatbot_prompt_block_delete", { p_id: id });
  return unwrap(data as PromptBlockMutationResponse | null, error, "No se pudo borrar.");
};

export const getPromptBlockHistoryApi = async (id: number): Promise<PromptBlockHistoryResponse> => {
  const { data, error } = await db.rpc("sp_crm_chatbot_prompt_block_history", { p_id: id });
  return unwrap(data as PromptBlockHistoryResponse | null, error, "No se pudo cargar el historial.");
};
