import { supabase } from "@/integrations/supabase/client";
import { MovementRequestPayload, MovementRequestApiResponse } from "../types/MovementRequests.types";

export const createMovementRequestApi = async (
  payload: MovementRequestPayload
): Promise<MovementRequestApiResponse> => {
  const { data, error } = await supabase.functions.invoke(
    "create-stock-movements-request",
    {
      method: "POST",
      body: payload,
    }
  );

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
};
