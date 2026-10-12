import { useEffect, useState } from "react";
import type { OAuthAuthorizationDetails } from "@supabase/supabase-js";
import {
  approveAuthorization,
  denyAuthorization,
  getAuthorizationDetails,
} from "../services/oauth.service";

type Status = "loading" | "ready" | "submitting" | "redirecting" | "error";

// La solicitud ya no se puede usar: Auth la asocia al primer usuario que lee su
// detalle y no la cambia; si después entra otra cuenta (o caducó), responde 404.
const STALE_REQUEST =
  "Esta solicitud de acceso caducó o quedó vinculada a otra cuenta. Vuelve a conectar Neura desde ChatGPT o Claude.";

function errorMessage(e: unknown, fallback: string): string {
  const err = e as { status?: number; code?: string; message?: string };
  if (err?.status === 404 || err?.code === "oauth_authorization_not_found") return STALE_REQUEST;
  return err?.message || fallback;
}

// Orquesta la pantalla /oauth/consent: lee la solicitud, y al aprobar o
// rechazar manda el navegador a la URL de vuelta que entrega Auth.
// `enabled` debe esperar a que el usuario confirme su cuenta: leer el detalle
// asocia la solicitud a la sesión activa.
export function useOAuthConsent(authorizationId: string | null, enabled: boolean) {
  const [status, setStatus] = useState<Status>("loading");
  const [details, setDetails] = useState<OAuthAuthorizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (!authorizationId) {
      setError("Falta el identificador de la solicitud de acceso.");
      setStatus("error");
      return;
    }

    let cancelled = false;
    getAuthorizationDetails(authorizationId)
      .then((result) => {
        if (cancelled) return;
        if (result.kind === "redirect") {
          setStatus("redirecting");
          window.location.assign(result.redirectUrl);
          return;
        }
        setDetails(result.details);
        setStatus("ready");
      })
      .catch((e) => {
        if (cancelled) return;
        setError(errorMessage(e, "No se pudo leer la solicitud de acceso."));
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [authorizationId, enabled]);

  const decide = async (approve: boolean) => {
    if (!authorizationId) return;
    setStatus("submitting");
    try {
      const redirectUrl = approve
        ? await approveAuthorization(authorizationId)
        : await denyAuthorization(authorizationId);
      setStatus("redirecting");
      window.location.assign(redirectUrl);
    } catch (e) {
      setError(errorMessage(e, "No se pudo completar la solicitud."));
      setStatus("error");
    }
  };

  return {
    status,
    details,
    error,
    approve: () => decide(true),
    deny: () => decide(false),
  };
}
