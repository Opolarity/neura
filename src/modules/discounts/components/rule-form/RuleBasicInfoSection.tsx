import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import WysiwygEditor from "@/components/ui/wysiwyg-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FranchiseeAccount, PriceRuleFormData } from "../../types/priceRule.types";
import { useFranchiseeAccounts } from "../../hooks/useFranchiseeAccounts";

interface RuleBasicInfoSectionProps {
  formData: PriceRuleFormData;
  updateField: <K extends keyof PriceRuleFormData>(
    field: K,
    value: PriceRuleFormData[K]
  ) => void;
  isConsignmentPromo: boolean;
  toggleConsignmentPromo: (enabled: boolean) => void;
  consignmentTenantReferences: string[];
  setConsignmentTenantReferences: (refs: string[]) => void;
  isFranchiseeExclusion: boolean;
  toggleFranchiseeExclusion: (enabled: boolean) => void;
  franchiseeExclusionTenantReferences: string[];
  setFranchiseeExclusionTenantReferences: (refs: string[]) => void;
}

// Lista de franquiciados con checkbox, compartida por los dos marcadores
// (promo de consignación y exclusión de franquiciados).
const FranchiseeChecklist = ({
  idPrefix,
  label,
  hint,
  accounts,
  loading,
  selected,
  onToggle,
}: {
  idPrefix: string;
  label: string;
  hint: string;
  accounts: FranchiseeAccount[];
  loading: boolean;
  selected: string[];
  onToggle: (tenantReference: string, checked: boolean) => void;
}) => (
  <div className="space-y-2 pt-2">
    <Label>{label}</Label>
    <p className="text-xs text-muted-foreground">{hint}</p>
    {loading ? (
      <p className="text-xs text-muted-foreground">Cargando franquiciados...</p>
    ) : accounts.length === 0 ? (
      <p className="text-xs text-muted-foreground">
        No hay cuentas franquiciadas registradas.
      </p>
    ) : (
      <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
        {accounts.map((account) => (
          <div key={account.id} className="flex items-center gap-2">
            <Checkbox
              id={`${idPrefix}-${account.id}`}
              checked={selected.includes(account.tenant_reference)}
              onCheckedChange={(checked) =>
                onToggle(account.tenant_reference, checked === true)
              }
            />
            <Label
              htmlFor={`${idPrefix}-${account.id}`}
              className="cursor-pointer font-normal"
            >
              {[account.name, account.last_name].filter(Boolean).join(" ")}
              <span className="ml-1 text-xs text-muted-foreground">
                ({account.tenant_reference})
              </span>
            </Label>
          </div>
        ))}
      </div>
    )}
  </div>
);

export const RuleBasicInfoSection = ({
  formData,
  updateField,
  isConsignmentPromo,
  toggleConsignmentPromo,
  consignmentTenantReferences,
  setConsignmentTenantReferences,
  isFranchiseeExclusion,
  toggleFranchiseeExclusion,
  franchiseeExclusionTenantReferences,
  setFranchiseeExclusionTenantReferences,
}: RuleBasicInfoSectionProps) => {
  const { accounts: franchiseeAccounts, loading: loadingFranchisees } =
    useFranchiseeAccounts(isConsignmentPromo || isFranchiseeExclusion);

  const toggleTenantReference = (tenantReference: string, checked: boolean) => {
    setConsignmentTenantReferences(
      checked
        ? [...consignmentTenantReferences, tenantReference]
        : consignmentTenantReferences.filter((r) => r !== tenantReference),
    );
  };

  const toggleExcludedTenantReference = (
    tenantReference: string,
    checked: boolean,
  ) => {
    setFranchiseeExclusionTenantReferences(
      checked
        ? [...franchiseeExclusionTenantReferences, tenantReference]
        : franchiseeExclusionTenantReferences.filter(
            (r) => r !== tenantReference,
          ),
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Información Básica</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              placeholder="Ej: Descuento de cumpleaños"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Código interno</Label>
            <Input
              id="code"
              placeholder="Ej: BIRTHDAY_DISCOUNT"
              value={formData.code}
              onChange={(e) => updateField("code", e.target.value)}
            />
          </div>
        </div>

        <WysiwygEditor
          label="Descripción"
          value={formData.description}
          onChange={(val) => updateField("description", val)}
          placeholder="Describe qué hace esta regla..."
          height="150px"
          toolbar="basic"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo de regla *</Label>
            <Select
              value={formData.rule_type}
              onValueChange={(val) =>
                updateField("rule_type", val as "automatic" | "coupon")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="automatic">Automática</SelectItem>
                <SelectItem value="coupon">Cupón</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Prioridad *</Label>
            <Input
              id="priority"
              type="number"
              placeholder="100"
              value={formData.priority}
              onChange={(e) => updateField("priority", parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              Menor número = mayor prioridad
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div className="flex items-start gap-3 rounded-md border p-4">
            <Checkbox
              id="consignment-promo"
              checked={isConsignmentPromo}
              disabled={isFranchiseeExclusion}
              onCheckedChange={(checked) =>
                toggleConsignmentPromo(checked === true)
              }
            />
            <div className="space-y-1">
              <Label htmlFor="consignment-promo" className="cursor-pointer">
                Promoción de consignación (franquiciados)
              </Label>
              <p className="text-xs text-muted-foreground">
                No aplica al ecommerce ni al POS: solo la ven los franquiciados
                por la API de consignación, y el descuento se liquida sobre las
                unidades que reporten como vendidas mientras la promoción esté
                vigente. Acciones soportadas: precio fijo, descuento fijo o %
                por producto.
              </p>

              {isConsignmentPromo && (
                <FranchiseeChecklist
                  idPrefix="franchisee"
                  label="Franquiciados participantes"
                  hint="Sin selección = aplica a todos los franquiciados."
                  accounts={franchiseeAccounts}
                  loading={loadingFranchisees}
                  selected={consignmentTenantReferences}
                  onToggle={toggleTenantReference}
                />
              )}
            </div>
          </div>

          {/* Marcador inverso del anterior: en vez de restringir la regla al
              canal consignación, la deja fuera de los franquiciados. Por eso
              son mutuamente excluyentes. */}
          <div className="flex items-start gap-3 rounded-md border p-4">
            <Checkbox
              id="franchisee-exclusion"
              checked={isFranchiseeExclusion}
              disabled={isConsignmentPromo}
              onCheckedChange={(checked) =>
                toggleFranchiseeExclusion(checked === true)
              }
            />
            <div className="space-y-1">
              <Label htmlFor="franchisee-exclusion" className="cursor-pointer">
                Excluir franquiciados
              </Label>
              <p className="text-xs text-muted-foreground">
                La regla no aplica a los clientes franquiciados. Al marcarla se
                excluyen todos; si se seleccionan algunos, solo esos quedan
                excluidos y al resto sí se les aplica.
              </p>

              {isFranchiseeExclusion && (
                <FranchiseeChecklist
                  idPrefix="excluded-franchisee"
                  label="Franquiciados excluidos"
                  hint="Sin selección = se excluyen todos los franquiciados."
                  accounts={franchiseeAccounts}
                  loading={loadingFranchisees}
                  selected={franchiseeExclusionTenantReferences}
                  onToggle={toggleExcludedTenantReference}
                />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
