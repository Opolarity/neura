import type { PaginationState } from "@/shared/components/pagination/Pagination";
import type {
  Conversation,
  ConversationApiRow,
  ConversationMessage,
  ConversationsApiResponse,
  MessageApiRow,
  Situation,
  SituationApi,
  ThreadApiResponse,
} from "../types/crm.types";

const situationAdapter = (s: SituationApi | null): Situation | null =>
  s
    ? { id: s.id, name: s.name, code: s.code, statusCode: s.status_code, order: s.order }
    : null;

/**
 * Nombre visible de la conversación, en orden de preferencia:
 * el nombre que el cliente dio, su username de WhatsApp, y como último recurso
 * la identidad cruda. Nunca queda vacío — una fila sin título en la bandeja es
 * inservible.
 */
const displayName = (row: ConversationApiRow): string => {
  const full = [row.customer?.name, row.customer?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (full) return full;
  if (row.whatsapp_username) return `@${row.whatsapp_username}`;
  if (row.phone_number) return `+${row.phone_number}`;
  return row.identity;
};

const conversationAdapter = (row: ConversationApiRow): Conversation => ({
  identity: row.identity,
  phoneNumber: row.phone_number,
  whatsappUserId: row.whatsapp_user_id,
  displayName: displayName(row),
  // Un mensaje de imagen llega como texto con la URL adentro; se recorta acá
  // para que la lista no muestre una URL larguísima como último mensaje.
  lastMessage: (row.last_message ?? "").replace(/\s+/g, " ").trim(),
  lastMessageAt: row.last_message_at,
  lastMessageFrom: row.last_message_from,
  windowOpen: row.window_open,
  windowExpiresAt: row.window_expires_at,
  situation: situationAdapter(row.situation),
  assignedTo: row.assigned_to,
  assignedToName: row.assigned_to_name,
  takenBy: row.taken_by,
  takenByName: row.taken_by_name,
  documentNumber: row.customer?.document_number ?? null,
  botAnswers: row.bot_answers,
});

export const conversationsAdapter = (
  response: ConversationsApiResponse
): { data: Conversation[]; pagination: PaginationState } => ({
  data: (response.data ?? []).map(conversationAdapter),
  pagination: {
    p_page: response.page?.page ?? 1,
    p_size: response.page?.size ?? 20,
    total: response.page?.total ?? 0,
  },
});

const messageAdapter = (row: MessageApiRow): ConversationMessage => ({
  id: row.id,
  author: row.user,
  message: row.message ?? "",
  createdAt: row.created_at,
  deliveryStatus: row.delivery?.status ?? null,
  deliveryErrorCode: row.delivery?.error_code ?? null,
});

export const threadAdapter = (response: ThreadApiResponse): ConversationMessage[] =>
  (response.messages ?? []).map(messageAdapter);
