import { supabase } from "@/integrations/supabase/client";
import type {
  AssistantAuthStart,
  AssistantConnection,
  AssistantProvider,
} from "../types";
import {
  adaptAuthStart,
  adaptConnection,
} from "../adapters/assistant.adapters";

// Unico punto del ERP que habla con el gateway. Ninguna page ni hook llama a
// fetch directamente (misma regla que los modulos que usan Supabase).
//
// DEPENDENCIA EXTERNA: este modulo depende de un servicio que NO vive en este
// repo (el gateway, en el VPS) y de que ese servicio pueda validar el JWT de
// Supabase de este proyecto. Si se rota el secreto JWT o cambian los claims, el
// chat deja de funcionar y nada aqui lo delata.
const GATEWAY_URL = (import.meta.env.VITE_ASSISTANT_GATEWAY_URL ?? "").replace(
  /\/+$/,
  "",
);

function assertConfigured(): string {
  if (!GATEWAY_URL) {
    throw new Error(
      "El asistente no está configurado: falta VITE_ASSISTANT_GATEWAY_URL.",
    );
  }
  return GATEWAY_URL;
}

// El gateway autentica con el mismo access token de Supabase que usa el ERP: no
// hay una segunda credencial que gestionar ni que caducar por separado.
async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
  return { Authorization: `Bearer ${token}` };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const base = assertConfigured();
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(await authHeaders()),
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    // El gateway devuelve {detail} para los errores esperables (cuenta sin
    // conectar, limite de uso agotado, credencial invalida). Se propaga tal
    // cual para que la UI muestre algo accionable en vez de "Error 500".
    let detail = `El asistente respondió ${res.status}.`;
    try {
      const body = await res.json();
      if (body?.detail) detail = String(body.detail);
    } catch {
      /* respuesta sin cuerpo JSON: se queda el mensaje generico */
    }
    throw new Error(detail);
  }

  return (await res.json()) as T;
}

export async function getConnection(): Promise<AssistantConnection> {
  return adaptConnection(await request<unknown>("/v1/status"));
}

export async function startAuth(
  provider: AssistantProvider,
): Promise<AssistantAuthStart> {
  return adaptAuthStart(
    await request<unknown>("/v1/admin/auth/start", {
      method: "POST",
      body: JSON.stringify({ provider }),
    }),
  );
}

/** Solo Claude: devuelve el codigo que el proveedor le dio al admin. */
export async function submitAuthCode(
  authId: string,
  code: string,
): Promise<void> {
  await request("/v1/admin/auth/code", {
    method: "POST",
    body: JSON.stringify({ auth_id: authId, code }),
  });
}

/**
 * Solo Codex: no hay codigo que devolver, pero la conexion NO queda registrada
 * hasta que el gateway comprueba que el proceso de login termino bien. Sin esta
 * llamada el admin aprueba en el navegador y la pantalla sigue diciendo
 * "sin conectar".
 */
export async function confirmAuth(
  provider: AssistantProvider,
): Promise<void> {
  await request("/v1/admin/auth/confirm", {
    method: "POST",
    body: JSON.stringify({ provider }),
  });
}

export async function disconnect(): Promise<void> {
  await request("/v1/admin/auth/logout", { method: "POST" });
}

/**
 * Envia un mensaje y va entregando el texto por trozos segun llega.
 *
 * No se usa EventSource: no admite cabeceras, y el token de Supabase tiene que
 * viajar en Authorization (meterlo en la URL lo dejaria escrito en los logs del
 * proxy). Con fetch + ReadableStream se consigue el mismo streaming.
 */
export async function streamChat(
  text: string,
  onChunk: (delta: string, newBlock: boolean) => void,
  signal?: AbortSignal,
): Promise<void> {
  const base = assertConfigured();
  const res = await fetch(`${base}/v1/chat`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(await authHeaders()),
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok || !res.body) {
    let detail = `El asistente respondió ${res.status}.`;
    try {
      const body = await res.json();
      if (body?.detail) detail = String(body.detail);
    } catch {
      /* sin cuerpo JSON */
    }
    throw new Error(detail);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Marco SSE: los eventos se separan por linea en blanco. Se procesa solo lo
    // que ya esta completo y el resto se queda en el buffer para la vuelta
    // siguiente, porque un chunk de red puede cortar un evento por la mitad.
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      for (const line of event.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const parsed = JSON.parse(payload);
          if (parsed?.error) throw new Error(String(parsed.error));
          if (typeof parsed?.delta === "string") {
            onChunk(parsed.delta, parsed.new_block === true);
          }
        } catch (err) {
          if (err instanceof Error && err.message) throw err;
        }
      }
    }
  }
}
