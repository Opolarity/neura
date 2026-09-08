import { supabase } from "@/integrations/supabase/client";
import type { SSOTokenResponse } from "../types/sso.types";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";

export const generateSSOToken = async (
  channel_id: number,
): Promise<SSOTokenResponse> => {
  const data = await invokeFunction<SSOTokenResponse>(
    "generate-sso-token",
    {
      method: "POST",
      body: { channel_id },
    },
  );

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
