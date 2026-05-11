import { useState } from "react";
import { uploadMedio, deleteMedio } from "../services/medios.service";
import type { Medio } from "../types/medios.types";
import { toast } from "sonner";

export const useMedios = () => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (files: File[]) => {
    setUploading(true);
    try {
      for (const file of files) {
        await uploadMedio(file);
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
      toast.success("Medio eliminado");
    } catch (err) {
      toast.error("Error al eliminar el medio");
      console.error(err);
    }
  };

  return { uploading, handleUpload, handleDelete };
};
