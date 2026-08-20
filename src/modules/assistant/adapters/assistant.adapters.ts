import type {
  AssistantAuthStart,
  AssistantConnection,
  AssistantProvider,
} from "../types";

// Capa anticorrupcion: el gateway responde en snake_case y puede cambiar de
// forma sin que cambie la UI. Todo lo que entra al modulo pasa por aqui.

function asProvider(value: unknown): AssistantProvider | null {
  return value === "claude" || value === "codex" ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

export function adaptConnection(raw: unknown): AssistantConnection {
  const data = (raw ?? {}) as Record<string, unknown>;
  const provider = asProvider(data.provider ?? data.proveedor);

  return {
    // Se exige provider ademas del flag: "conectado sin proveedor" es un estado
    // incoherente que dejaria la pantalla ofreciendo chatear contra nada.
    connected: Boolean(data.connected ?? data.conectado) && provider !== null,
    provider,
    connectedBy: asString(data.connected_by ?? data.conectado_por),
    connectedAt: asString(data.connected_at ?? data.fecha),
  };
}

export function adaptAuthStart(raw: unknown): AssistantAuthStart {
  const data = (raw ?? {}) as Record<string, unknown>;
  const authId = asString(data.auth_id ?? data.authId);
  const url = asString(data.url);

  if (!authId || !url) {
    throw new Error("El gateway no devolvió el enlace de conexión.");
  }

  const code = asString(data.code);

  return {
    authId,
    url,
    code,
    // Claude no imprime codigo: lo pide. Codex lo imprime y se resuelve solo.
    // Si el gateway ya manda un needs_code explicito, manda ese.
    needsCode:
      typeof data.needs_code === "boolean" ? data.needs_code : code === null,
  };
}
