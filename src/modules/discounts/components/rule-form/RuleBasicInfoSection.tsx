import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PriceRuleFormData } from "../../types/priceRule.types";
import { RuleTypeSection } from "./RuleTypeSection";

interface RuleBasicInfoSectionProps {
  formData: PriceRuleFormData;
  updateField: <K extends keyof PriceRuleFormData>(
    field: K,
    value: PriceRuleFormData[K]
  ) => void;
  isEditMode: boolean;
}

// Nombre y forma de aplicarse: lo primero que se decide al crear una
// promoción. La descripción, la prioridad, la página de la promoción y los
// franquiciados viven en las opciones avanzadas.
export const RuleBasicInfoSection = ({
  formData,
  updateField,
  isEditMode,
}: RuleBasicInfoSectionProps) => {
  return (
    <div className="space-y-5">
      {/* Al crear no hay código interno que mostrar: el nombre ocupa la fila. */}
      <div
        className={`grid grid-cols-1 gap-4 ${isEditMode ? "md:grid-cols-2" : ""}`}
      >
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            placeholder="Ej: Descuento de verano"
            value={formData.name}
            onChange={(e) => updateField("name", e.target.value)}
          />
        </div>
        {/* El código interno lo genera el backend a partir del nombre: al crear
            no se pide y al editar solo se muestra. */}
        {isEditMode && (
          <div className="space-y-2">
            <Label htmlFor="code">Código interno</Label>
            <Input
              id="code"
              value={formData.code}
              placeholder="Sin código"
              readOnly
              disabled
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Cómo se aplica</Label>
        <RuleTypeSection formData={formData} updateField={updateField} />
      </div>
    </div>
  );
};
