// Contratos de la pantalla Asistente IA.
//
// El ERP no habla con Anthropic ni con OpenAI: habla con el gateway
// (VITE_ASSISTANT_GATEWAY_URL), que es quien ejecuta el CLI correspondiente en
// un contenedor efimero. Estos tipos describen ESA frontera, no la de ningun
// proveedor de IA.

/** CLI que ejecuta el gateway. La cuenta conectada es una sola, de la empresa. */
export type AssistantProvider = "claude" | "codex";

export const PROVIDER_LABEL: Record<AssistantProvider, string> = {
  claude: "Claude",
  codex: "ChatGPT",
};

/** Estado de la conexion de la empresa. Es global, no por usuario. */
export interface AssistantConnection {
  connected: boolean;
  provider: AssistantProvider | null;
  /** Nombre de quien la conecto, para que el resto sepa a quien reclamar. */
  connectedBy: string | null;
  connectedAt: string | null;
}

export type AssistantRole = "user" | "assistant";

export interface AssistantMessage {
  id: string;
  role: AssistantRole;
  text: string;
  createdAt: string;
  /** Solo en curso: el mensaje se esta transmitiendo por SSE. */
  streaming?: boolean;
}

/**
 * Arranque del login. Claude imprime solo una URL y espera que le devolvamos el
 * codigo; Codex imprime URL + codigo corto y resuelve el solo por polling. De
 * ahi que `code` sea opcional y que `needsCode` diga si hay que pedirlo.
 */
export interface AssistantAuthStart {
  authId: string;
  url: string;
  code: string | null;
  needsCode: boolean;
}
