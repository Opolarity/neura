import { useState } from "react";
import { uploadMedio, deleteMedio } from "../services/medios.service";
import type { Medio } from "../types/medios.types";
import { toast } from "@/shared/hooks/use-toast";

export const useMedios = () => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (files: File[]) => {
    setUploading(true);
    try {
      for (const file of files) {
        await uploadMedio(file);
      }
      toast({ title: `${files.length} archivo(s) subido(s) correctamente`, variant: "success" });
    } catch (err) {
      toast({ title: "Error al subir archivo(s)", variant: "destructive" });
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (medio: Medio) => {
    try {
      await deleteMedio(medio);
      toast({ title: "Medio eliminado", variant: "success" });
    } catch (err) {
      toast({ title: "Error al eliminar el medio", variant: "destructive" });
      console.error(err);
    }
  };

  return { uploading, handleUpload, handleDelete };
};
