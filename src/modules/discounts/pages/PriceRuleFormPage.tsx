import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePriceRuleForm } from "../hooks/usePriceRuleForm";
import { RuleBasicInfoSection } from "../components/rule-form/RuleBasicInfoSection";
import { RuleValiditySection } from "../components/rule-form/RuleValiditySection";
import { ConditionBuilder } from "../components/rule-form/ConditionBuilder";
import { ActionBuilder } from "../components/rule-form/ActionBuilder";
import { CouponSection } from "../components/rule-form/CouponSection";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const PriceRuleFormPage = () => {
  const {
    formData,
    isEditMode,
    loading,
    saving,
    updateField,
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
  } = usePriceRuleForm();

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/discounts/price-rules")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">
            {isEditMode ? "Editar Regla de Precios" : "Nueva Regla de Precios"}
          </h1>
        </div>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </div>

      {/* 1. Basic Info */}
      <RuleBasicInfoSection formData={formData} updateField={updateField} />

      {/* 2. Validity */}
      <RuleValiditySection formData={formData} updateField={updateField} />

      {/* 3. Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Condiciones</CardTitle>
        </CardHeader>
        <CardContent>
          <ConditionBuilder
            conditions={formData.conditions}
            setGroupOperator={setGroupOperator}
            addGroup={addGroup}
            removeGroup={removeGroup}
            updateGroupOperator={updateGroupOperator}
            addCondition={addCondition}
            updateCondition={updateCondition}
            removeCondition={removeCondition}
          />
        </CardContent>
      </Card>

      {/* 4. Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Acciones</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionBuilder
            actions={formData.actions}
            addAction={addAction}
            updateAction={updateAction}
            removeAction={removeAction}
          />
        </CardContent>
      </Card>

      {/* 5. Stacking */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Apilamiento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Acumulable con otras reglas</Label>
              <p className="text-sm text-muted-foreground">
                Permite que esta regla se combine con otras reglas
              </p>
            </div>
            <Switch
              checked={formData.is_stackable}
              onCheckedChange={(val) => updateField("is_stackable", val)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Detener procesamiento</Label>
              <p className="text-sm text-muted-foreground">
                No evaluar reglas de menor prioridad después de esta
              </p>
            </div>
            <Switch
              checked={formData.stop_processing}
              onCheckedChange={(val) => updateField("stop_processing", val)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 6. Coupon (only for coupon type) */}
      {formData.rule_type === "coupon" && (
        <CouponSection formData={formData} updateField={updateField} />
      )}
    </div>
  );
};

export default PriceRuleFormPage;
