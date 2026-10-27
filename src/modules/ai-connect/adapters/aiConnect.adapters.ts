import type { OAuthGrant } from "@supabase/supabase-js";
import type { AiApp, AiConnection } from "../types";

// La app se reconoce por el nombre con el que se registro el cliente OAuth
// (registro dinamico: lo elige Claude o ChatGPT, no nosotros). Si algun dia
// cambian el nombre, la conexion sigue apareciendo, solo que como "otro".
function detectApp(name: string): AiApp {
  if (/claude/i.test(name)) return "claude";
  if (/chatgpt|openai/i.test(name)) return "chatgpt";
  return "other";
}

export function adaptConnection(grant: OAuthGrant): AiConnection {
  const name = grant.client.name?.trim() || "Aplicación";
  return {
    clientId: grant.client.id,
    app: detectApp(name),
    name,
    grantedAt: grant.granted_at,
  };
}
