import type { ReactNode } from "react";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { usePriceRuleForm } from "../hooks/usePriceRuleForm";
import { RuleBasicInfoSection } from "../components/rule-form/RuleBasicInfoSection";
import { RuleValiditySection } from "../components/rule-form/RuleValiditySection";
import { RuleAdvancedSection } from "../components/rule-form/RuleAdvancedSection";
import { ConditionBuilder } from "../components/rule-form/ConditionBuilder";
import { ActionBuilder } from "../components/rule-form/ActionBuilder";
import { PriceRuleReferencesProvider } from "../context/PriceRuleReferencesContext";
import { OptionalBadge } from "../components/rule-form/OptionalBadge";

// El orden sigue el de quien arma una promoción: qué es y cómo llega al
// cliente, qué descuento da, cuándo aplica y hasta cuándo. Lo técnico va al
// final, plegado.
const FormSection = ({
  title,
  description,
  optional = false,
  children,
}: {
  title: string;
  description?: string;
  optional?: boolean;
  children: ReactNode;
}) => (
  <Card>
    <CardHeader>
      <h2 className="flex items-center gap-2 text-base font-semibold">
        {title}
        {optional && <OptionalBadge />}
      </h2>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

const PriceRuleFormPage = () => {
  const {
    formData,
    references,
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
  } = usePriceRuleForm();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const goBack = () => navigate("/discounts/price-rules");

  const saveButton = (
    <Button onClick={handleSubmit} disabled={saving}>
      {saving ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Save className="w-4 h-4 mr-2" />
      )}
      {saving ? "Guardando..." : "Guardar promoción"}
    </Button>
  );

  return (
    <PriceRuleReferencesProvider value={references}>
    <div className="space-y-6 min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={goBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">
            {isEditMode ? "Editar regla de precios" : "Nueva regla de precios"}
          </h1>
        </div>
        {saveButton}
      </div>

      <FormSection title="Promoción">
        <RuleBasicInfoSection
          formData={formData}
          updateField={updateField}
          isEditMode={isEditMode}
        />
      </FormSection>

      <FormSection title="Descuento">
        <ActionBuilder
          actions={formData.actions}
          addAction={addAction}
          updateAction={updateAction}
          removeAction={removeAction}
        />
      </FormSection>

      <FormSection title="Condiciones" optional>
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
      </FormSection>

      <FormSection title="Vigencia">
        <RuleValiditySection formData={formData} updateField={updateField} />
      </FormSection>

      <RuleAdvancedSection
        formData={formData}
        updateField={updateField}
        updateExclusions={updateExclusions}
        isConsignmentPromo={isConsignmentPromo}
        toggleConsignmentPromo={toggleConsignmentPromo}
        consignmentTenantReferences={consignmentTenantReferences}
        setConsignmentTenantReferences={setConsignmentTenantReferences}
        isFranchiseeExclusion={isFranchiseeExclusion}
        toggleFranchiseeExclusion={toggleFranchiseeExclusion}
        franchiseeExclusionTenantReferences={franchiseeExclusionTenantReferences}
        setFranchiseeExclusionTenantReferences={
          setFranchiseeExclusionTenantReferences
        }
      />

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={goBack} disabled={saving}>
          Cancelar
        </Button>
        {saveButton}
      </div>
    </div>
    </PriceRuleReferencesProvider>
  );
};

export default PriceRuleFormPage;
