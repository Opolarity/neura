// Contratos de "Conecta tu IA".
//
// El ERP ya no ejecuta ninguna IA: cada usuario agrega el MCP de Neura
// (MCP_URL) como conector en SU Claude o SU ChatGPT y lo autoriza en
// /oauth/consent. Lo unico que el ERP ve de esa conexion es el grant OAuth que
// Supabase Auth guarda para el usuario.

/** App a la que se conecta el MCP. */
export type AiApp = "claude" | "chatgpt";

export interface AiConnection {
  /** Id del cliente OAuth en Supabase Auth: es lo que pide revokeGrant. */
  clientId: string;
  app: AiApp;
  /** Nombre con el que el cliente se registro (lo pone Claude/ChatGPT). */
  name: string;
  grantedAt: string;
}
