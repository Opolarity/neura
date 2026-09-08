import { invokeFunction } from "@/integrations/supabase/invokeFunction";
import type { SupportRequestPayload } from "../types/Support.types";

export const createSupportRequest = async (payload: SupportRequestPayload) =>
  invokeFunction("create-support-request", {
    method: "POST",
    networkMessage:
      "No se pudo conectar con el servicio de soporte. Revisa tu conexión e intenta nuevamente.",
    body: {
      title: payload.title,
      description: payload.description || null,
      request_type: payload.requestType,
      reporter_name: payload.reporterName,
      // Página desde la que se envía: la API externa la guarda y con ella se
      // puede filtrar el listado por origen.
      origin_url: payload.originUrl ?? window.location.href,
      attachments:
        payload.attachments && payload.attachments.length > 0
          ? payload.attachments.map((a) => ({
              file_name: a.fileName,
              mime_type: a.mimeType,
              content_base64: a.contentBase64,
            }))
          : null,
    },
  });
