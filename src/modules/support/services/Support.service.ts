import { supabase } from "@/integrations/supabase/client";
import type { SupportRequestPayload } from "../types/Support.types";

export const createSupportRequest = async (payload: SupportRequestPayload) => {
  const { data, error } = await supabase.functions.invoke(
    "create-support-request",
    {
      method: "POST",
      body: {
        title: payload.title,
        description: payload.description || null,
        request_type: payload.requestType,
        reporter_name: payload.reporterName,
      },
    },
  );

  if (error) {
    console.error("Error invoking create-support-request:", error);
    throw new Error("No se pudo enviar la solicitud de soporte");
  }
  if (data?.error) throw new Error(data.error);

  return data;
};
