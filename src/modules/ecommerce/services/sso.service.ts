import { supabase } from "@/integrations/supabase/client";
import type { SSOTokenResponse } from "../types/sso.types";

export const generateSSOToken = async (): Promise<SSOTokenResponse> => {
  const { data, error } = await supabase.functions.invoke<SSOTokenResponse>(
    "generate-sso-token",
    { method: "POST" }
  );

  if (error) {
    throw new Error(error.message || "Error al generar token SSO");
  }

  if (!data?.token) {
    throw new Error("No se recibió el token SSO");
  }

  return data;
};
