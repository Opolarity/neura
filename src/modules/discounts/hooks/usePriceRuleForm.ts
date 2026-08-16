import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import type {
  PriceRuleFormData,
  ConditionsConfig,
  ConditionGroup,
  Condition,
  ActionConfig,
  ExclusionFilter,
} from "../types/priceRule.types";
import {
  CONSIGNMENT_ALLOWED_ACTION_TYPES,
  CONSIGNMENT_CONDITION_TYPE,
  ACTION_TYPE_LABELS,
} from "../types/priceRule.types";
import {
  createPriceRule,
  updatePriceRule,
  getPriceRuleDetails,
} from "../services/PriceRule.services";
import {
  DEFAULT_FORM_DATA,
  adaptPriceRuleToForm,
  adaptFormToPayload,
  hasConsignmentMarker,
  isConsignmentMarkerGroup,
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
        // Sin esto el usuario se queda en un formulario vacío que parece
        // editable. Pasa, por ejemplo, al entrar por URL directa a una regla
        // eliminada: el backend responde 404.
        navigate("/discounts/price-rules");
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

  // --- Exclusion management ---
  const updateExclusions = (exclusions: ExclusionFilter | null) => {
    setFormData((prev) => ({ ...prev, exclusions }));
  };

  // --- Promoción de consignación (franquiciados) ---
  // El marcador vive como un grupo propio { type: "consignment_channel" } y el
  // operador entre grupos se fuerza a AND para que la regla jamás pueda
  // evaluar verdadera en el ecommerce por un OR (defensa además del filtro
  // del backend).
  const isConsignmentPromo = hasConsignmentMarker(formData.conditions);

  const toggleConsignmentPromo = (enabled: boolean) => {
    setFormData((prev) => {
      if (enabled) {
        if (hasConsignmentMarker(prev.conditions)) return prev;
        return {
          ...prev,
          rule_type: "automatic",
          conditions: {
            operator: "AND",
            groups: [
              ...prev.conditions.groups,
              {
                operator: "AND" as const,
                conditions: [{ type: CONSIGNMENT_CONDITION_TYPE }],
              },
            ],
          },
        };
      }

      // Quitar el marcador: se eliminan los grupos-marcador y cualquier
      // condición de consignación suelta; siempre queda al menos un grupo.
      const groups = prev.conditions.groups
        .filter((g) => !isConsignmentMarkerGroup(g))
        .map((g) => ({
          ...g,
          conditions: g.conditions.filter(
            (c) => c.type !== CONSIGNMENT_CONDITION_TYPE,
          ),
        }));

      return {
        ...prev,
        conditions: {
          ...prev.conditions,
          groups: groups.length > 0
            ? groups
            : [{ operator: "AND" as const, conditions: [] }],
        },
      };
    });
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

    let dataToSave = formData;

    if (isConsignmentPromo) {
      if (formData.rule_type !== "automatic") {
        toast.error(
          "Una promoción de consignación debe ser de tipo Automática (no cupón)",
        );
        return;
      }

      const invalidAction = formData.actions.find(
        (a) => !CONSIGNMENT_ALLOWED_ACTION_TYPES.includes(a.type),
      );
      if (invalidAction) {
        toast.error(
          `La acción "${ACTION_TYPE_LABELS[invalidAction.type]}" no está soportada en promociones de consignación. Usa precio fijo, descuento fijo o % por producto.`,
        );
        return;
      }

      if (
        formData.actions.some(
          (a) => a.type === "set_fixed_price" && a.max_qty != null,
        )
      ) {
        toast.error(
          "El precio fijo con cantidad máxima (max_qty) no está soportado en promociones de consignación",
        );
        return;
      }

      // Refuerzo del invariante aunque la UI ya lo garantice.
      dataToSave = {
        ...formData,
        conditions: { ...formData.conditions, operator: "AND" },
      };
    }

    setSaving(true);
    try {
      const payload = adaptFormToPayload(dataToSave);
      if (isEditMode) {
        await updatePriceRule(parseInt(id!), payload);
        toast.success("Regla de precios actualizada");
      } else {
        await createPriceRule(payload);
        toast.success("Regla de precios creada");
      }
      navigate("/discounts/price-rules");
    } catch (error) {
      console.error("Error saving price rule:", error);
      const fallbackMessage = isEditMode
        ? "Error al actualizar la regla de precios"
        : "Error al crear la regla de precios";
      toast.error(error instanceof Error && error.message ? error.message : fallbackMessage);
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
    updateExclusions,
    isConsignmentPromo,
    toggleConsignmentPromo,
    handleSubmit,
    navigate,
  };
}
