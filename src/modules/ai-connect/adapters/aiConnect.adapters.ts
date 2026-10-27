import type { OAuthGrant } from "@supabase/supabase-js";
import type { AiApp, AiConnection } from "../types";

// La app se reconoce por el nombre con el que se registro el cliente OAuth
// (registro dinamico: lo elige Claude o ChatGPT, no nosotros). Un cliente que
// no es ninguno de los dos no se muestra: la tarjeta solo ofrece esas dos.
function detectApp(name: string): AiApp | null {
  if (/claude/i.test(name)) return "claude";
  if (/chatgpt|openai/i.test(name)) return "chatgpt";
  return null;
}

export function adaptConnections(grants: OAuthGrant[]): AiConnection[] {
  return grants.flatMap((grant) => {
    const name = grant.client.name?.trim() || "Aplicación";
    const app = detectApp(name);
    return app
      ? [{ clientId: grant.client.id, app, name, grantedAt: grant.granted_at }]
      : [];
  });
}
