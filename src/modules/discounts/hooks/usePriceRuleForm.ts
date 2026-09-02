import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "@/shared/hooks/use-toast";
import type {
  PriceRuleFormData,
  ConditionsConfig,
  ConditionGroup,
  Condition,
  ActionConfig,
  ExclusionFilter,
  PriceRuleReferences,
} from "../types/priceRule.types";
import { EMPTY_REFERENCES } from "../types/priceRule.types";
import {
  CONSIGNMENT_ALLOWED_ACTION_TYPES,
  CONSIGNMENT_CONDITION_TYPE,
  FRANCHISEE_EXCLUSION_CONDITION_TYPE,
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
  getConsignmentTenantReferences,
  hasConsignmentMarker,
  isConsignmentMarkerGroup,
  getFranchiseeExclusionTenantReferences,
  hasFranchiseeExclusionMarker,
  isFranchiseeExclusionMarkerGroup,
} from "../adapters/priceRule.adapter";
import { getPriceRuleFormError } from "../utils/priceRuleValidation";
import { toastError } from "@/shared/utils/toastError";

export function usePriceRuleForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<PriceRuleFormData>(DEFAULT_FORM_DATA);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [references, setReferences] =
    useState<PriceRuleReferences>(EMPTY_REFERENCES);

  // Load rule data in edit mode
  useEffect(() => {
    if (!id) return;
    const loadRule = async () => {
      setLoadingDetail(true);
      try {
        const response = await getPriceRuleDetails(parseInt(id));
        if (response?.data) {
          setFormData(adaptPriceRuleToForm(response.data));
          setReferences({
            ...EMPTY_REFERENCES,
            ...(response.data.references ?? {}),
          });
        }
      } catch (error) {
        console.error("Error loading price rule:", error);
        toastError(error, "Error al cargar la regla de precios");
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

  // Franquiciados seleccionados para la promo (tenant_reference). Vacío =
  // aplica a todos los franquiciados.
  const consignmentTenantReferences = getConsignmentTenantReferences(
    formData.conditions,
  );

  // Escribe (o limpia) la lista de tenant_reference del marcador indicado.
  // Sin selección NO se persiste el campo: el formato canónico de "todos los
  // franquiciados" es el marcador pelado.
  const setMarkerTenantReferences = (markerType: string, refs: string[]) => {
    const cleaned = [
      ...new Set(refs.map((r) => r.trim()).filter((r) => r.length > 0)),
    ];
    setFormData((prev) => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        groups: prev.conditions.groups.map((g) => ({
          ...g,
          conditions: g.conditions.map((c) =>
            c.type === markerType
              ? {
                  type: markerType as Condition["type"],
                  ...(cleaned.length > 0
                    ? { tenant_references: cleaned }
                    : {}),
                }
              : c,
          ),
        })),
      },
    }));
  };

  // Agrega el marcador en su propio grupo (operador global forzado a AND) o lo
  // quita junto con cualquier condición suelta del mismo tipo.
  const toggleMarker = (
    markerType: string,
    enabled: boolean,
    isMarkerGroup: (g: ConditionGroup) => boolean,
  ) => {
    setFormData((prev) => {
      if (enabled) {
        if (
          prev.conditions.groups.some((g) =>
            g.conditions.some((c) => c.type === markerType),
          )
        ) {
          return prev;
        }
        return {
          ...prev,
          conditions: {
            operator: "AND",
            groups: [
              ...prev.conditions.groups,
              {
                operator: "AND" as const,
                conditions: [{ type: markerType as Condition["type"] }],
              },
            ],
          },
        };
      }

      const groups = prev.conditions.groups
        .filter((g) => !isMarkerGroup(g))
        .map((g) => ({
          ...g,
          conditions: g.conditions.filter((c) => c.type !== markerType),
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

  const setConsignmentTenantReferences = (refs: string[]) =>
    setMarkerTenantReferences(CONSIGNMENT_CONDITION_TYPE, refs);

  const toggleConsignmentPromo = (enabled: boolean) => {
    if (enabled) {
      // Una promo de consignación solo existe para el canal franquiciados y es
      // siempre automática.
      setFormData((prev) => ({ ...prev, rule_type: "automatic" }));
    }
    toggleMarker(CONSIGNMENT_CONDITION_TYPE, enabled, isConsignmentMarkerGroup);
  };

  // --- Excluir franquiciados ---
  // Marcador { type: "franchisee_exclusion" }: la regla no aplica a los
  // franquiciados listados, o a ninguno de ellos si no hay selección.
  const isFranchiseeExclusion = hasFranchiseeExclusionMarker(
    formData.conditions,
  );

  const franchiseeExclusionTenantReferences =
    getFranchiseeExclusionTenantReferences(formData.conditions);

  const setFranchiseeExclusionTenantReferences = (refs: string[]) =>
    setMarkerTenantReferences(FRANCHISEE_EXCLUSION_CONDITION_TYPE, refs);

  const toggleFranchiseeExclusion = (enabled: boolean) =>
    toggleMarker(
      FRANCHISEE_EXCLUSION_CONDITION_TYPE,
      enabled,
      isFranchiseeExclusionMarkerGroup,
    );

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
    const validationError = getPriceRuleFormError(formData);
    if (validationError) {
      toast({ title: validationError, variant: "destructive" });
      return;
    }

    let dataToSave = formData;

    if (isConsignmentPromo) {
      if (formData.rule_type !== "automatic") {
        toast({
          title: "Una promoción de consignación debe ser de tipo Automática (no cupón)",
          variant: "destructive",
        });
        return;
      }

      const invalidAction = formData.actions.find(
        (a) => !CONSIGNMENT_ALLOWED_ACTION_TYPES.includes(a.type),
      );
      if (invalidAction) {
        toast({
          title: `La acción "${ACTION_TYPE_LABELS[invalidAction.type]}" no está soportada en promociones de consignación. Usa precio fijo, descuento fijo o % por producto.`,
          variant: "destructive",
        });
        return;
      }

      if (
        formData.actions.some(
          (a) => a.type === "set_fixed_price" && a.max_qty != null,
        )
      ) {
        toast({
          title: "El precio fijo con cantidad máxima (max_qty) no está soportado en promociones de consignación",
          variant: "destructive",
        });
        return;
      }

      // Refuerzo del invariante aunque la UI ya lo garantice.
      dataToSave = {
        ...formData,
        conditions: { ...formData.conditions, operator: "AND" },
      };
    }

    // El marcador de exclusión de franquiciados vive en su propio grupo: con
    // un OR entre grupos la regla podría aplicarse igual al franquiciado, así
    // que se fuerza AND al guardar (el usuario puede haber cambiado el
    // operador desde el builder después de marcar el checkbox).
    if (isFranchiseeExclusion) {
      dataToSave = {
        ...dataToSave,
        conditions: { ...dataToSave.conditions, operator: "AND" },
      };
    }

    setSaving(true);
    try {
      const payload = adaptFormToPayload(dataToSave);
      if (isEditMode) {
        await updatePriceRule(parseInt(id!), payload);
        toast({ title: "Regla de precios actualizada", variant: "success" });
      } else {
        await createPriceRule(payload);
        toast({ title: "Regla de precios creada", variant: "success" });
      }
      navigate("/discounts/price-rules");
    } catch (error) {
      console.error("Error saving price rule:", error);
      const fallbackMessage = isEditMode
        ? "Error al actualizar la regla de precios"
        : "Error al crear la regla de precios";
      toastError(error, fallbackMessage);
    } finally {
      setSaving(false);
    }
  };

  return {
    formData,
    references,
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
    consignmentTenantReferences,
    setConsignmentTenantReferences,
    isFranchiseeExclusion,
    toggleFranchiseeExclusion,
    franchiseeExclusionTenantReferences,
    setFranchiseeExclusionTenantReferences,
    handleSubmit,
    navigate,
  };
}
