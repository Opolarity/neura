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
import type { PriceRuleFormData } from "../../types/priceRule.types";
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
}

export const RuleBasicInfoSection = ({
  formData,
  updateField,
  isConsignmentPromo,
  toggleConsignmentPromo,
  consignmentTenantReferences,
  setConsignmentTenantReferences,
}: RuleBasicInfoSectionProps) => {
  const { accounts: franchiseeAccounts, loading: loadingFranchisees } =
    useFranchiseeAccounts(isConsignmentPromo);

  const toggleTenantReference = (tenantReference: string, checked: boolean) => {
    setConsignmentTenantReferences(
      checked
        ? [...consignmentTenantReferences, tenantReference]
        : consignmentTenantReferences.filter((r) => r !== tenantReference),
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

        <div className="flex items-start gap-3 rounded-md border p-4">
          <Checkbox
            id="consignment-promo"
            checked={isConsignmentPromo}
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
              vigente. Acciones soportadas: precio fijo, descuento fijo o % por
              producto.
            </p>

            {isConsignmentPromo && (
              <div className="space-y-2 pt-2">
                <Label>Franquiciados participantes</Label>
                <p className="text-xs text-muted-foreground">
                  Sin selección = aplica a todos los franquiciados.
                </p>
                {loadingFranchisees ? (
                  <p className="text-xs text-muted-foreground">
                    Cargando franquiciados...
                  </p>
                ) : franchiseeAccounts.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No hay cuentas franquiciadas registradas.
                  </p>
                ) : (
                  <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
                    {franchiseeAccounts.map((account) => (
                      <div
                        key={account.id}
                        className="flex items-center gap-2"
                      >
                        <Checkbox
                          id={`franchisee-${account.id}`}
                          checked={consignmentTenantReferences.includes(
                            account.tenant_reference,
                          )}
                          onCheckedChange={(checked) =>
                            toggleTenantReference(
                              account.tenant_reference,
                              checked === true,
                            )
                          }
                        />
                        <Label
                          htmlFor={`franchisee-${account.id}`}
                          className="cursor-pointer font-normal"
                        >
                          {[account.name, account.last_name]
                            .filter(Boolean)
                            .join(" ")}
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({account.tenant_reference})
                          </span>
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
