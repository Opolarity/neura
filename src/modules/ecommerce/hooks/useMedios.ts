import { useState, useEffect, useCallback } from "react";
import { getMedios, uploadMedio, deleteMedio } from "../services/medios.service";
import type { Medio } from "../types/medios.types";
import { toast } from "sonner";

export const useMedios = () => {
  const [medios, setMedios] = useState<Medio[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchMedios = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMedios();
      setMedios(data);
    } catch (err) {
      toast.error("Error al cargar los medios");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedios();
  }, [fetchMedios]);

  const handleUpload = async (files: File[]) => {
    setUploading(true);
    try {
      for (const file of files) {
        const newMedio = await uploadMedio(file);
        setMedios((prev) => [newMedio, ...prev]);
      }
      toast.success(`${files.length} archivo(s) subido(s) correctamente`);
    } catch (err) {
      toast.error("Error al subir archivo(s)");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (medio: Medio) => {
    try {
      await deleteMedio(medio);
      setMedios((prev) => prev.filter((m) => m.id !== medio.id));
      toast.success("Medio eliminado");
    } catch (err) {
      toast.error("Error al eliminar el medio");
      console.error(err);
    }
  };

  return { medios, loading, uploading, handleUpload, handleDelete, refetch: fetchMedios };
};
