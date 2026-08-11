import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  deleteParameter,
  getAllParameters,
  saveParameters,
  uploadInvoiceLogo,
  type ParameterRow,
} from "../services/Parameters.service";
import { CURATED_KEYS } from "../types/BusinessParameters.types";

export interface AdvancedRow {
  /** id en BD; null si es una fila nueva aún no guardada */
  id: number | null;
  name: string;
  value: string;
  isNew: boolean;
}

const useBusinessParameters = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [initialData, setInitialData] = useState<Record<string, string>>({});
  const [advancedRows, setAdvancedRows] = useState<AdvancedRow[]>([]);
  const [initialAdvanced, setInitialAdvanced] = useState<Record<number, string>>({});

  const hydrate = useCallback((rows: ParameterRow[]) => {
    const values: Record<string, string> = {};
    for (const key of CURATED_KEYS) values[key] = "";
    for (const row of rows) values[row.name] = row.value ?? "";

    setFormData(values);
    setInitialData(values);

    setAdvancedRows(
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        value: row.value ?? "",
        isNew: false,
      })),
    );
    setInitialAdvanced(
      Object.fromEntries(rows.map((row) => [row.id, row.value ?? ""])),
    );
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      hydrate(await getAllParameters());
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar los parámetros del negocio");
    } finally {
      setLoading(false);
    }
  }, [hydrate]);

  useEffect(() => {
    load();
  }, [load]);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadInvoiceLogo(file);
      handleChange("InvoiceLogoUrl", url);
      toast.success("Logo subido. Recuerda guardar los cambios.");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo subir el logo");
    } finally {
      setUploading(false);
    }
  };

  const handleAdvancedChange = (
    index: number,
    field: "name" | "value",
    value: string,
  ) => {
    setAdvancedRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const addAdvancedRow = () => {
    setAdvancedRows((prev) => [
      ...prev,
      { id: null, name: "", value: "", isNew: true },
    ]);
  };

  const removeAdvancedRow = async (index: number) => {
    const row = advancedRows[index];
    if (row.id === null) {
      setAdvancedRows((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    if (!window.confirm(`¿Eliminar el parámetro "${row.name}"?`)) return;

    try {
      await deleteParameter(row.id);
      toast.success("Parámetro eliminado");
      await load();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo eliminar el parámetro");
    }
  };

  const validate = (): string | null => {
    const hours = formData.TimeToCancelPendingOrder?.trim();
    if (hours && !/^\d+$/.test(hours)) {
      return "Las horas para cancelar órdenes pendientes deben ser un número entero mayor o igual a 0";
    }

    const names = advancedRows
      .map((row) => row.name.trim())
      .filter((name) => name.length > 0);
    if (advancedRows.some((row) => row.isNew && !row.name.trim())) {
      return "Los parámetros nuevos necesitan un nombre";
    }
    if (new Set(names).size !== names.length) {
      return "Hay nombres de parámetro duplicados";
    }
    return null;
  };

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();

    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    // Curados: solo lo que cambió.
    const entries: Record<string, string> = {};
    for (const key of CURATED_KEYS) {
      const value = (formData[key] ?? "").trim();
      if (value !== (initialData[key] ?? "")) entries[key] = value;
    }

    // Avanzado: filas nuevas y valores modificados de filas existentes.
    for (const row of advancedRows) {
      const name = row.name.trim();
      if (!name) continue;
      if (row.id === null) {
        entries[name] = row.value;
      } else if (row.value !== (initialAdvanced[row.id] ?? "")) {
        entries[name] = row.value;
      }
    }

    if (Object.keys(entries).length === 0) {
      toast.info("No hay cambios por guardar");
      return;
    }

    setSaving(true);
    try {
      await saveParameters(entries);
      toast.success("Configuración del negocio actualizada");
      await load();
    } catch (err) {
      console.error(err);
      toast.error("No se pudieron guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    saving,
    uploading,
    formData,
    advancedRows,
    handleChange,
    handleLogoUpload,
    handleAdvancedChange,
    addAdvancedRow,
    removeAdvancedRow,
    handleSubmit,
    reload: load,
  };
};

export default useBusinessParameters;
