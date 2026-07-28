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
        attachments:
          payload.attachments && payload.attachments.length > 0
            ? payload.attachments.map((a) => ({
                file_name: a.fileName,
                mime_type: a.mimeType,
                content_base64: a.contentBase64,
              }))
            : null,
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
