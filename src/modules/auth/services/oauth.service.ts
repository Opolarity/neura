import { supabase } from "@/integrations/supabase/client";
import type {
  OAuthAuthorizationDetails,
  OAuthRedirect,
} from "@supabase/supabase-js";

// Consentimiento OAuth 2.1 de Supabase Auth. Lo usa el MCP de ventas: Claude
// manda al usuario a /oauth/consent?authorization_id=… y aquí se aprueba o
// rechaza. Requiere GOTRUE_OAUTH_SERVER_ENABLED en el stack y la edge
// function oauth-consent (GOTRUE_OAUTH_SERVER_AUTHORIZATION_PATH).

export type AuthorizationResult =
  | { kind: "consent"; details: OAuthAuthorizationDetails }
  | { kind: "redirect"; redirectUrl: string };

export async function getAuthorizationDetails(
  authorizationId: string
): Promise<AuthorizationResult> {
  const { data, error } =
    await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
  if (error) throw error;

  // Si el usuario ya había dado consentimiento, Auth devuelve directamente
  // la URL de vuelta al cliente.
  if ("redirect_url" in data) {
    return { kind: "redirect", redirectUrl: (data as OAuthRedirect).redirect_url };
  }
  return { kind: "consent", details: data as OAuthAuthorizationDetails };
}

export async function approveAuthorization(authorizationId: string): Promise<string> {
  const { data, error } = await supabase.auth.oauth.approveAuthorization(
    authorizationId,
    { skipBrowserRedirect: true }
  );
  if (error) throw error;
  return data.redirect_url;
}

export async function denyAuthorization(authorizationId: string): Promise<string> {
  const { data, error } = await supabase.auth.oauth.denyAuthorization(
    authorizationId,
    { skipBrowserRedirect: true }
  );
  if (error) throw error;
  return data.redirect_url;
}
