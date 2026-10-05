import { useEffect, useState } from "react";
import type { OAuthAuthorizationDetails } from "@supabase/supabase-js";
import {
  approveAuthorization,
  denyAuthorization,
  getAuthorizationDetails,
} from "../services/oauth.service";

type Status = "loading" | "ready" | "submitting" | "redirecting" | "error";

// Orquesta la pantalla /oauth/consent: lee la solicitud, y al aprobar o
// rechazar manda el navegador a la URL de vuelta que entrega Auth.
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
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message || "No se pudo leer la solicitud de acceso.");
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
      setError((e as Error).message || "No se pudo completar la solicitud.");
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
