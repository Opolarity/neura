import { useCallback, useEffect, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { toastError } from "@/shared/utils/toastError";
import {
  createComplaintNoteApi,
  getComplaintDetailApi,
  getComplaintNotesApi,
  updateComplaintStatusApi,
} from "../services/reclamaciones.service";
import {
  reclamacionDetalleAdapter,
  reclamacionNotasAdapter,
} from "../adapters/Reclamaciones.adapter";
import type {
  ComplaintDetail,
  ComplaintNote,
  ComplaintStatus,
} from "../types/reclamaciones.types";

/**
 * Detalle de un reclamo: datos, notas internas, respuesta al reclamante y
 * cambio de estado.
 *
 * El detalle y las notas se piden juntos solo en la carga inicial. Después van
 * por separado a propósito: las notas cambian solas (se agrega una, alguien más
 * responde) mientras el reclamo no, así que refrescar el hilo no tiene por qué
 * repintar la pantalla entera. Lo mismo al agregar una nota o al cambiar el
 * estado: el backend devuelve lo que cambió y se actualiza en sitio.
 */
export const useReclamacionDetalle = (id: number | null) => {
  const [reclamacion, setReclamacion] = useState<ComplaintDetail | null>(null);
  const [notes, setNotes] = useState<ComplaintNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  /** Carga inicial: reclamo + hilo en una sola llamada. */
  const load = useCallback(async (complaintId: number) => {
    setLoading(true);
    try {
      const response = await getComplaintDetailApi(complaintId);

      if (!response?.success || !response.data) {
        throw new Error(response?.error ?? "No se encontró la reclamación");
      }

      setReclamacion(reclamacionDetalleAdapter(response.data));
      setNotes(reclamacionNotasAdapter(response.notes));
    } catch (error) {
      setReclamacion(null);
      toastError(error, "Error al cargar la reclamación");
    } finally {
      setLoading(false);
    }
  }, []);

  /** Solo el hilo de notas. No toca el reclamo ni el loader de la página. */
  const loadNotes = useCallback(async (complaintId: number) => {
    setLoadingNotes(true);
    try {
      const response = await getComplaintNotesApi(complaintId);

      if (!response?.success) {
        throw new Error(response?.error ?? "No se pudieron obtener las notas");
      }

      setNotes(reclamacionNotasAdapter(response.notes));
    } catch (error) {
      toastError(error, "Error al cargar las notas");
    } finally {
      setLoadingNotes(false);
    }
  }, []);

  useEffect(() => {
    if (id == null) {
      setLoading(false);
      return;
    }
    load(id);
  }, [id, load]);

  const refreshNotes = useCallback(() => {
    if (id == null) return;
    loadNotes(id);
  }, [id, loadNotes]);

  /**
   * Agrega una nota. Con `notifyCustomer` la nota se le envía por correo al
   * reclamante y el reclamo pasa a respondido; el backend solo la guarda si el
   * correo salió, y devuelve cómo quedó el reclamo para reflejarlo sin recargar
   * el detalle.
   */
  const addNote = async (message: string, notifyCustomer = false) => {
    if (id == null) return false;

    setSavingNote(true);
    try {
      const response = await createComplaintNoteApi({
        complaint_id: id,
        message,
        notify_customer: notifyCustomer,
      });

      toast({
        title: notifyCustomer ? "Respuesta enviada al reclamante" : "Nota agregada",
        variant: "success",
      });

      if (response?.complaint) {
        const { status, answered_at } = response.complaint;
        setReclamacion((current) =>
          current ? { ...current, status, answeredAt: answered_at } : current,
        );
      }

      await loadNotes(id);
      return true;
    } catch (error) {
      toastError(
        error,
        notifyCustomer ? "No se pudo enviar la respuesta" : "No se pudo guardar la nota",
      );
      return false;
    } finally {
      setSavingNote(false);
    }
  };

  const changeStatus = async (status: ComplaintStatus) => {
    if (id == null || !reclamacion) return;

    const previous = reclamacion.status;
    // Optimista: el selector responde al instante y se revierte si el backend
    // rechaza el cambio.
    setReclamacion({ ...reclamacion, status });
    setSavingStatus(true);

    try {
      const response = await updateComplaintStatusApi(id, status);
      toast({ title: "Estado actualizado", variant: "success" });

      // answered_at lo sella el backend la primera vez que pasa a respondido.
      if (response?.complaint) {
        const { status: newStatus, answered_at } = response.complaint;
        setReclamacion((current) =>
          current ? { ...current, status: newStatus, answeredAt: answered_at } : current,
        );
      }
    } catch (error) {
      setReclamacion((current) => (current ? { ...current, status: previous } : current));
      toastError(error, "No se pudo cambiar el estado");
    } finally {
      setSavingStatus(false);
    }
  };

  return {
    reclamacion,
    notes,
    loading,
    loadingNotes,
    savingNote,
    savingStatus,
    addNote,
    changeStatus,
    refreshNotes,
  };
};
