import { buildEndpoint } from "@/shared/utils/query";
import type { POSSessionDetailApiResponse } from "../types/POSDetail.types";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";

export const getPOSSessionDetail = async (
  sessionId: number
): Promise<POSSessionDetailApiResponse> => {
  const endpoint = buildEndpoint("get-pos-session-detail", { session_id: sessionId });

  const data = await invokeFunction(endpoint, {
    method: "GET",
  });

  return data;
};
