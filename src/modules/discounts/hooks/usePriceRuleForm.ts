import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import type {
  PriceRuleFormData,
  ConditionsConfig,
  ConditionGroup,
  Condition,
  ActionConfig,
} from "../types/priceRule.types";
import {
  createPriceRule,
  updatePriceRule,
  getPriceRuleDetails,
} from "../services/PriceRule.services";
import {
  DEFAULT_FORM_DATA,
  adaptPriceRuleToForm,
} from "../adapters/priceRule.adapter";

export function usePriceRuleForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<PriceRuleFormData>(DEFAULT_FORM_DATA);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Load rule data in edit mode
  useEffect(() => {
    if (!id) return;
    const loadRule = async () => {
      setLoadingDetail(true);
      try {
        const response = await getPriceRuleDetails(parseInt(id));
        if (response?.data) {
          setFormData(adaptPriceRuleToForm(response.data));
        }
      } catch (error) {
        console.error("Error loading price rule:", error);
        toast.error("Error al cargar la regla de precios");
      } finally {
        setLoadingDetail(false);
      }
    };
    loadRule();
  }, [id]);

  // Field updaters
  const updateField = <K extends keyof PriceRuleFormData>(
    field: K,
    value: PriceRuleFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // --- Condition management ---
  const updateConditions = (conditions: ConditionsConfig) => {
    setFormData((prev) => ({ ...prev, conditions }));
  };

  const setGroupOperator = (operator: "AND" | "OR") => {
    setFormData((prev) => ({
      ...prev,
      conditions: { ...prev.conditions, operator },
    }));
  };

  const addGroup = () => {
    setFormData((prev) => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        groups: [
          ...prev.conditions.groups,
          { operator: "AND" as const, conditions: [] },
        ],
      },
    }));
  };

  const removeGroup = (groupIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        groups: prev.conditions.groups.filter((_, i) => i !== groupIndex),
      },
    }));
  };

  const updateGroupOperator = (groupIndex: number, operator: "AND" | "OR") => {
    setFormData((prev) => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        groups: prev.conditions.groups.map((g, i) =>
          i === groupIndex ? { ...g, operator } : g
        ),
      },
    }));
  };

  const addCondition = (groupIndex: number, condition: Condition) => {
    setFormData((prev) => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        groups: prev.conditions.groups.map((g, i) =>
          i === groupIndex
            ? { ...g, conditions: [...g.conditions, condition] }
            : g
        ),
      },
    }));
  };

  const updateCondition = (
    groupIndex: number,
    conditionIndex: number,
    condition: Condition
  ) => {
    setFormData((prev) => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        groups: prev.conditions.groups.map((g, i) =>
          i === groupIndex
            ? {
                ...g,
                conditions: g.conditions.map((c, j) =>
                  j === conditionIndex ? condition : c
                ),
              }
            : g
        ),
      },
    }));
  };

  const removeCondition = (groupIndex: number, conditionIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        groups: prev.conditions.groups.map((g, i) =>
          i === groupIndex
            ? {
                ...g,
                conditions: g.conditions.filter((_, j) => j !== conditionIndex),
              }
            : g
        ),
      },
    }));
  };

  // --- Action management ---
  const addAction = (action: ActionConfig) => {
    setFormData((prev) => ({
      ...prev,
      actions: [...prev.actions, action],
    }));
  };

  const updateAction = (index: number, action: ActionConfig) => {
    setFormData((prev) => ({
      ...prev,
      actions: prev.actions.map((a, i) => (i === index ? action : a)),
    }));
  };

  const removeAction = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index),
    }));
  };

  // --- Submit ---
  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    if (formData.rule_type === "coupon" && !formData.coupon_code.trim()) {
      toast.error("El código de cupón es requerido");
      return;
    }

    if (formData.actions.length === 0) {
      toast.error("Debe agregar al menos una acción");
      return;
    }

    setSaving(true);
    try {
      if (isEditMode) {
        await updatePriceRule(parseInt(id!), formData);
        toast.success("Regla de precios actualizada");
      } else {
        await createPriceRule(formData);
        toast.success("Regla de precios creada");
      }
      navigate("/discounts/price-rules");
    } catch (error) {
      console.error("Error saving price rule:", error);
      toast.error(
        isEditMode
          ? "Error al actualizar la regla de precios"
          : "Error al crear la regla de precios"
      );
    } finally {
      setSaving(false);
    }
  };

  return {
    formData,
    isEditMode,
    loading: loadingDetail,
    saving,
    updateField,
    updateConditions,
    setGroupOperator,
    addGroup,
    removeGroup,
    updateGroupOperator,
    addCondition,
    updateCondition,
    removeCondition,
    addAction,
    updateAction,
    removeAction,
    handleSubmit,
    navigate,
  };
}
