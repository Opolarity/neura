import { supabase } from "@/integrations/supabase/client";
import type { OAuthGrant } from "@supabase/supabase-js";

// Grants OAuth del usuario logueado: una fila por cada app (Claude, ChatGPT…)
// que autorizo el MCP de Neura en /oauth/consent. Solo existen si el stack
// tiene GOTRUE_OAUTH_SERVER_ENABLED (el mismo requisito que la pantalla de
// consentimiento, ver modules/auth/services/oauth.service.ts).

export async function listGrants(): Promise<OAuthGrant[]> {
  const { data, error } = await supabase.auth.oauth.listGrants();
  if (error) throw error;
  return data ?? [];
}

/**
 * Revoca el acceso de una app: Auth marca el consentimiento como revocado y
 * corta sus sesiones y refresh tokens, asi que la app deja de responder con
 * datos del ERP en su siguiente pregunta.
 */
export async function revokeGrant(clientId: string): Promise<void> {
  const { error } = await supabase.auth.oauth.revokeGrant({ clientId });
  if (error) throw error;
}
