import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/utils";
import type { POSSessionDetailApiResponse } from "../types/POSDetail.types";

export const getPOSSessionDetail = async (
  sessionId: number
): Promise<POSSessionDetailApiResponse> => {
  const endpoint = buildEndpoint("get-pos-session-detail", { session_id: sessionId });

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) {
    console.error("Invoke error:", error);
    throw error;
  }

  return data;
};
