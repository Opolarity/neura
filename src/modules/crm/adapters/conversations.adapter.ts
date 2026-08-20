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
 * Título de la conversación. El orden lo define qué tan identificable es el
 * dato para quien atiende:
 *
 *   1. El nombre, si el bot llegó a pedirle los datos para un pedido.
 *   2. El celular, si no dio sus datos pero su número es visible.
 *   3. El username de WhatsApp, para los clientes que ocultan su número.
 *   4. La identidad cruda (el BSUID), solo si no hay nada de lo anterior.
 *
 * El celular va ANTES que el username a propósito: un número sirve para buscar
 * al cliente en el ERP o llamarlo, un handle de WhatsApp no.
 *
 * El caso 4 no debería darse: con la identidad resuelta sobre todo el hilo,
 * ninguna de las 243 conversaciones actuales cae ahí. Se deja igual porque una
 * fila sin título en la bandeja sería inservible.
 */
const displayName = (row: ConversationApiRow): string => {
  const full = [row.customer?.name, row.customer?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  // Los nombres los escribe el cliente por WhatsApp, así que llegan en
  // cualquier combinación de mayúsculas y minúsculas. Se normalizan para que
  // la lista no mezcle "MANUEL JOAQUIN" con "Danitza Milena".
  if (full) return full.toUpperCase();
  if (row.phone_number) return `+${row.phone_number}`;
  if (row.whatsapp_username) return `@${row.whatsapp_username}`;
  return row.identity;
};

/**
 * Lo que va debajo del título: los identificadores que el título NO usó.
 * Repetir el celular abajo cuando el título YA es el celular no aporta nada y
 * ocupa la línea que podría llevar el documento.
 */
const subtitle = (row: ConversationApiRow): string => {
  const hasName = !!(row.customer?.name || row.customer?.last_name);
  const parts: string[] = [];

  if (hasName && row.phone_number) parts.push(`+${row.phone_number}`);
  if (row.customer?.document_number) parts.push(row.customer.document_number);
  if (!hasName && row.phone_number && row.whatsapp_username)
    parts.push(`@${row.whatsapp_username}`);

  return parts.join(" · ");
};

const conversationAdapter = (row: ConversationApiRow): Conversation => ({
  identity: row.identity,
  phoneNumber: row.phone_number,
  whatsappUserId: row.whatsapp_user_id,
  displayName: displayName(row),
  subtitle: subtitle(row),
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
