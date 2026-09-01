import { useCallback, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import {
  SupportServiceError,
  type SupportAttachment,
  type SupportErrorCode,
  type SupportRequestDetail,
} from "../types/Support.types";
import {
  createSupportRequestMessage,
  getSupportRequest,
} from "../services/SupportRequests.service";
import { adaptSupportRequestDetail } from "../adapters/supportRequest.adapter";
import { toastError } from "@/shared/utils/toastError";

interface SupportDetailErrorState {
  message: string;
  code: SupportErrorCode;
}

/**
 * Detalle bajo demanda: solo se pide cuando el usuario abre una solicitud del
 * listado (trae la descripción con sus imágenes, que pesa).
 */
export function useSupportRequestDetail() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SupportRequestDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState<SupportDetailErrorState | null>(null);
  const [sending, setSending] = useState(false);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setErrorState(null);
    try {
      const response = await getSupportRequest(id);
      if (!response?.data) {
        throw new SupportServiceError(
          "La solicitud ya no está disponible.",
          "not_found",
        );
      }
      setDetail(adaptSupportRequestDetail(response.data));
    } catch (error) {
      console.error("Error loading support request detail:", error);
      const err = error as SupportServiceError;
      setDetail(null);
      // Sin toast: el error se muestra dentro del modal y es reintentable
      setErrorState({
        message: err?.message || "No se pudo cargar la solicitud",
        code: err?.code ?? "unknown",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const open = useCallback(
    (id: string) => {
      setSelectedId(id);
      setDetail(null);
      load(id);
    },
    [load],
  );

  const close = useCallback(() => {
    setSelectedId(null);
    setDetail(null);
    setErrorState(null);
  }, []);

  /**
   * Añade un mensaje al hilo, con sus adjuntos si los hay. Devuelve true si se
   * envió, para que la caja de respuesta sepa si puede limpiar texto y archivos
   * (en error se conserva todo lo que se había preparado).
   * Tras enviar se recarga el detalle: la API de creación no trae el hilo.
   */
  const sendMessage = useCallback(
    async (content: string, attachments?: SupportAttachment[]): Promise<boolean> => {
      if (!selectedId) return false;

      setSending(true);
      try {
        await createSupportRequestMessage(selectedId, content, attachments);
        await load(selectedId);
        return true;
      } catch (error) {
        console.error("Error sending support request message:", error);
        const err = error as SupportServiceError;
        // Escritura: sí lleva toast (igual que la creación de solicitudes)
        toastError(error, err?.message || "No se pudo enviar el mensaje");
        return false;
      } finally {
        setSending(false);
      }
    },
    [load, selectedId],
  );

  const retry = useCallback(() => {
    if (selectedId) load(selectedId);
  }, [load, selectedId]);

  return {
    isOpen: selectedId !== null,
    detail,
    loading,
    errorState,
    sending,
    open,
    close,
    retry,
    sendMessage,
  };
}
