import { useEffect, useState } from "react";
import { toastError } from "@/shared/utils/toastError";
import type { CustomerLevel, CustomerLevelPayload } from "../types/customerLevels.types";

interface FormState {
  name: string;
  minPoints: string;
  maxPoints: string;
  discountPct: string;
  color: string;
  imageUrl: string;
  subtitle: string;
  sortOrder: string;
  active: boolean;
}

interface FormErrors {
  name?: string;
  minPoints?: string;
  discountPct?: string;
}

const emptyForm: FormState = {
  name: "",
  minPoints: "",
  maxPoints: "",
  discountPct: "0",
  color: "#6b7280",
  imageUrl: "",
  subtitle: "",
  sortOrder: "",
  active: true,
};

const fromLevel = (level: CustomerLevel): FormState => ({
  name: level.name,
  minPoints: String(level.minPoints),
  maxPoints: level.maxPoints === null ? "" : String(level.maxPoints),
  discountPct: String(level.discountPct),
  color: level.color ?? "",
  imageUrl: level.imageUrl ?? "",
  subtitle: level.subtitle ?? "",
  sortOrder: String(level.sortOrder),
  active: level.active,
});

interface UseCustomerLevelFormProps {
  open: boolean;
  editLevel?: CustomerLevel;
  onSave: (payload: CustomerLevelPayload) => Promise<void>;
  onSuccess: () => void;
}

export const useCustomerLevelForm = ({ open, editLevel, onSave, onSuccess }: UseCustomerLevelFormProps) => {
  const isEditing = editLevel !== undefined;

  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(editLevel ? fromLevel(editLevel) : emptyForm);
      setErrors({});
      setSaving(false);
    }
  }, [open, editLevel]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Validacion minima del lado del cliente: lo que hace ilogica la accion
  // (decimales, rango invertido, SOLAPE) lo valida y explica el backend, y su
  // mensaje se muestra con toastError.
  const buildPayload = (): CustomerLevelPayload | null => {
    const next: FormErrors = {};

    if (!form.name.trim()) next.name = "El nombre es obligatorio.";

    const min = Number(form.minPoints);
    if (form.minPoints.trim() === "" || Number.isNaN(min)) {
      next.minPoints = "Ingresa el punto inicial.";
    }

    const pct = Number(form.discountPct);
    if (form.discountPct.trim() === "" || Number.isNaN(pct) || pct < 0 || pct > 100) {
      next.discountPct = "El descuento va de 0 a 100.";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return null;

    const max = form.maxPoints.trim() === "" ? null : Number(form.maxPoints);
    const sortOrder = form.sortOrder.trim() === "" ? null : Number(form.sortOrder);

    return {
      id: editLevel?.id,
      name: form.name.trim(),
      minPoints: min,
      maxPoints: max,
      discountPct: pct,
      color: form.color.trim() || null,
      imageUrl: form.imageUrl.trim() || null,
      subtitle: form.subtitle.trim() || null,
      sortOrder,
      active: form.active,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = buildPayload();
    if (!payload) return;

    setSaving(true);
    try {
      await onSave(payload);
      onSuccess();
    } catch (err) {
      // Aqui cae el motivo que devuelve el RPC (solape con "X", decimales, etc.).
      toastError(err, "No se pudo guardar el nivel");
    } finally {
      setSaving(false);
    }
  };

  return { form, errors, isEditing, saving, setField, handleSubmit };
};
