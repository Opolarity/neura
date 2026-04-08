import { supabase } from "@/integrations/supabase/client";
import type { SSOTokenResponse } from "../types/sso.types";

export const generateSSOToken = async (
  channel_id: number,
): Promise<SSOTokenResponse> => {
  const { data, error } = await supabase.functions.invoke<SSOTokenResponse>(
    "generate-sso-token",
    {
      method: "POST",
      body: { channel_id },
    },
  );

  if (error) {
    throw new Error(error.message || "Error al generar token SSO");
  }

  if (!data?.token) {
    throw new Error("No se recibió el token SSO");
  }

  return data;
};

export const getChannels = async (): Promise<
  { id: number; name: string, url: string }[]
> => {
  const {data, error} = await supabase.from("channels").select("id, name, url")

  if (error) throw error;

  return data ?? [];
};
