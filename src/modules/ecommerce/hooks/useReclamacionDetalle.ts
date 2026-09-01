import { useCallback, useEffect, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import {
  createComplaintNoteApi,
  getComplaintDetailApi,
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
 * cambio de estado. El detalle y las notas llegan en una sola llamada
 * (`get-complaint-detail`), que es como las necesita la pantalla.
 */
export const useReclamacionDetalle = (id: number | null) => {
  const [reclamacion, setReclamacion] = useState<ComplaintDetail | null>(null);
  const [notes, setNotes] = useState<ComplaintNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingNote, setSavingNote] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

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
      console.error("Error al cargar la reclamación:", error);
      setReclamacion(null);
      toast({
        title: "Error al cargar la reclamación",
        description: (error as Error)?.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id == null) {
      setLoading(false);
      return;
    }
    load(id);
  }, [id, load]);

  /**
   * Agrega una nota. Con `notifyCustomer` la nota se le envía por correo al
   * reclamante y el reclamo pasa a respondido; el backend solo la guarda si el
   * correo salió, así que basta con recargar para ver el estado real.
   */
  const addNote = async (message: string, notifyCustomer = false) => {
    if (id == null) return false;

    setSavingNote(true);
    try {
      await createComplaintNoteApi({
        complaint_id: id,
        message,
        notify_customer: notifyCustomer,
      });

      toast({
        title: notifyCustomer ? "Respuesta enviada al reclamante" : "Nota agregada",
      });

      await load(id);
      return true;
    } catch (error) {
      console.error("Error al guardar la nota:", error);
      toast({
        title: notifyCustomer ? "No se pudo enviar la respuesta" : "No se pudo guardar la nota",
        description: (error as Error)?.message,
        variant: "destructive",
      });
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
      await updateComplaintStatusApi(id, status);
      toast({ title: "Estado actualizado" });
      await load(id);
    } catch (error) {
      console.error("Error al cambiar el estado:", error);
      setReclamacion((current) => (current ? { ...current, status: previous } : current));
      toast({
        title: "No se pudo cambiar el estado",
        description: (error as Error)?.message,
        variant: "destructive",
      });
    } finally {
      setSavingStatus(false);
    }
  };

  return {
    reclamacion,
    notes,
    loading,
    savingNote,
    savingStatus,
    addNote,
    changeStatus,
  };
};
