import { useCallback, useEffect, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import {
  deleteParameter,
  getAllParameters,
  saveParameters,
  uploadInvoiceLogo,
  type ParameterRow,
} from "../services/Parameters.service";
import { CURATED_KEYS, READ_ONLY_KEYS } from "../types/BusinessParameters.types";
import { toastError } from "@/shared/utils/toastError";

export interface AdvancedRow {
  /** id en BD; null si es una fila nueva aún no guardada */
  id: number | null;
  name: string;
  value: string;
  isNew: boolean;
  readOnly?: boolean;
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
        readOnly: READ_ONLY_KEYS.includes(row.name),
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
      toastError(error, "No se pudieron cargar los parámetros del negocio");
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
      toast({ title: "Logo subido. Recuerda guardar los cambios.", variant: "success" });
    } catch (error) {
      console.error(error);
      toastError(error, "No se pudo subir el logo");
    } finally {
      setUploading(false);
    }
  };

  const handleAdvancedChange = (
    index: number,
    field: "name" | "value",
    value: string,
  ) => {
    if (advancedRows[index]?.readOnly) return;
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
    if (row.readOnly) {
      toast({ title: `El parámetro "${row.name}" no se puede eliminar`, variant: "destructive" });
      return;
    }
    if (row.id === null) {
      setAdvancedRows((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    if (!window.confirm(`¿Eliminar el parámetro "${row.name}"?`)) return;

    try {
      await deleteParameter(row.id);
      toast({ title: "Parámetro eliminado", variant: "success" });
      await load();
    } catch (error) {
      console.error(error);
      toastError(error, "No se pudo eliminar el parámetro");
    }
  };

  const validate = (): string | null => {
    const hours = formData.TimeToCancelPendingOrder?.trim();
    if (hours && !/^\d+$/.test(hours)) {
      return "Las horas para cancelar órdenes pendientes deben ser un número entero mayor o igual a 0";
    }

    const lowStock = formData.LowStockThreshold?.trim();
    if (lowStock && (!/^\d+$/.test(lowStock) || Number(lowStock) < 1)) {
      return "El umbral de stock bajo debe ser un número entero mayor o igual a 1";
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
    const blocked = advancedRows.find(
      (row) => row.isNew && READ_ONLY_KEYS.includes(row.name.trim()),
    );
    if (blocked) {
      return `El parámetro "${blocked.name.trim()}" no es editable`;
    }
    return null;
  };

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();

    const error = validate();
    if (error) {
      toast({ title: error, variant: "destructive" });
      return;
    }

    // Curados: solo lo que cambió.
    const entries: Record<string, string> = {};
    for (const key of CURATED_KEYS) {
      if (READ_ONLY_KEYS.includes(key)) continue;
      const value = (formData[key] ?? "").trim();
      if (value !== (initialData[key] ?? "")) entries[key] = value;
    }

    // Avanzado: filas nuevas y valores modificados de filas existentes.
    for (const row of advancedRows) {
      const name = row.name.trim();
      if (!name || READ_ONLY_KEYS.includes(name)) continue;
      if (row.id === null) {
        entries[name] = row.value;
      } else if (row.value !== (initialAdvanced[row.id] ?? "")) {
        entries[name] = row.value;
      }
    }

    if (Object.keys(entries).length === 0) {
      toast({ title: "No hay cambios por guardar", variant: "info" });
      return;
    }

    setSaving(true);
    try {
      await saveParameters(entries);
      toast({ title: "Configuración del negocio actualizada", variant: "success" });
      await load();
    } catch (err) {
      console.error(err);
      toastError(err, "No se pudieron guardar los cambios");
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
