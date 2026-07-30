import { useCallback, useState } from "react";
import {
  SupportServiceError,
  type SupportErrorCode,
  type SupportRequestDetail,
} from "../types/Support.types";
import { getSupportRequest } from "../services/SupportRequests.service";
import { adaptSupportRequestDetail } from "../adapters/supportRequest.adapter";

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

  const retry = useCallback(() => {
    if (selectedId) load(selectedId);
  }, [load, selectedId]);

  return {
    isOpen: selectedId !== null,
    detail,
    loading,
    errorState,
    open,
    close,
    retry,
  };
}
