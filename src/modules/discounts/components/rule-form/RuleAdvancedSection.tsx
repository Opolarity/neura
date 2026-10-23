import { useState, type ReactNode } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useActivePriceLists } from "@/modules/price-list/hooks/usePriceList";
import type {
  ExclusionFilter,
  FranchiseeAccount,
  PriceRuleFormData,
} from "../../types/priceRule.types";
import { DEFAULT_FORM_DATA } from "../../adapters/priceRule.adapter";
import { useFranchiseeAccounts } from "../../hooks/useFranchiseeAccounts";
import { ExclusionSection } from "./ExclusionSection";
import { LabelRow, OptionalBadge } from "./OptionalBadge";

interface RuleAdvancedSectionProps {
  formData: PriceRuleFormData;
  updateField: <K extends keyof PriceRuleFormData>(
    field: K,
    value: PriceRuleFormData[K]
  ) => void;
  updateExclusions: (exclusions: ExclusionFilter | null) => void;
  isConsignmentPromo: boolean;
  toggleConsignmentPromo: (enabled: boolean) => void;
  consignmentTenantReferences: string[];
  setConsignmentTenantReferences: (refs: string[]) => void;
  isFranchiseeExclusion: boolean;
  toggleFranchiseeExclusion: (enabled: boolean) => void;
  franchiseeExclusionTenantReferences: string[];
  setFranchiseeExclusionTenantReferences: (refs: string[]) => void;
}

// Una regla que ya trae algo de esto configurado abre la sección: si no, al
// editarla no se vería que tiene exclusiones, una lista de precios fija o un
// marcador de franquiciados.
const hasAdvancedValues = (
  formData: PriceRuleFormData,
  hasFranchiseeMarker: boolean,
) =>
  hasFranchiseeMarker ||
  !!formData.description.trim() ||
  !!formData.landing_url.trim() ||
  formData.price_list_id !== null ||
  formData.exclusions !== null ||
  formData.priority !== DEFAULT_FORM_DATA.priority ||
  formData.is_stackable !== DEFAULT_FORM_DATA.is_stackable ||
  formData.stop_processing !== DEFAULT_FORM_DATA.stop_processing;

const SettingRow = ({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) => (
  <div className="flex items-center justify-between gap-4">
    <div>
      <Label>{title}</Label>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);

const Hint = ({ children }: { children: ReactNode }) => (
  <p className="text-xs text-muted-foreground">{children}</p>
);

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
    <Hint>{hint}</Hint>
    {loading ? (
      <Hint>Cargando franquiciados...</Hint>
    ) : accounts.length === 0 ? (
      <Hint>No hay cuentas franquiciadas registradas.</Hint>
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

export const RuleAdvancedSection = ({
  formData,
  updateField,
  updateExclusions,
  isConsignmentPromo,
  toggleConsignmentPromo,
  consignmentTenantReferences,
  setConsignmentTenantReferences,
  isFranchiseeExclusion,
  toggleFranchiseeExclusion,
  franchiseeExclusionTenantReferences,
  setFranchiseeExclusionTenantReferences,
}: RuleAdvancedSectionProps) => {
  const { priceLists, loading } = useActivePriceLists();
  const [open, setOpen] = useState(() =>
    hasAdvancedValues(formData, isConsignmentPromo || isFranchiseeExclusion)
  );
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
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-3 p-6 text-left"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <SlidersHorizontal className="h-4 w-4" />
            </span>
            <span className="flex-1">
              <span className="block text-base font-semibold">
                Opciones avanzadas
              </span>
              <span className="block text-sm text-muted-foreground">
                Exclusiones, combinación con otras promociones, franquiciados,
                lista de precios, página y descripción.
              </span>
            </span>
            <ChevronDown
              className={`h-5 w-5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            <Separator />

            <div className="space-y-3">
              <LabelRow>
                <h3 className="text-sm font-semibold">Exclusiones</h3>
                <OptionalBadge />
              </LabelRow>
              <ExclusionSection
                exclusions={formData.exclusions}
                onChange={updateExclusions}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Combinación con otras promociones</h3>
              <SettingRow
                title="Acumulable"
                description="Activado: el cliente recibe este descuento junto con el de otras promociones."
                checked={formData.is_stackable}
                onCheckedChange={(val) => updateField("is_stackable", val)}
              />
              <SettingRow
                title="Detener las siguientes"
                description="Activado: si esta promoción se aplica, no se evalúan las que siguen en prioridad."
                checked={formData.stop_processing}
                onCheckedChange={(val) => updateField("stop_processing", val)}
              />
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridad</Label>
                <Input
                  id="priority"
                  type="number"
                  className="max-w-[160px]"
                  placeholder="100"
                  value={formData.priority}
                  onChange={(e) =>
                    updateField("priority", parseInt(e.target.value) || 0)
                  }
                />
                <Hint>Las promociones con número menor se evalúan primero.</Hint>
              </div>
            </div>

            <Separator />

            {/* Los dos marcadores son excluyentes: uno restringe la regla al
                canal consignación y el otro la deja fuera de los franquiciados. */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Franquiciados</h3>
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
                      Promoción de consignación
                    </Label>
                    <Hint>
                      No aplica al ecommerce ni al POS: solo la ven los
                      franquiciados por la API de consignación, y el descuento
                      se liquida sobre las unidades que reporten como vendidas
                      mientras la promoción esté vigente. Descuentos admitidos:
                      precio fijo, descuento fijo o % por producto.
                    </Hint>

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
                    <Hint>
                      La regla no aplica a los clientes franquiciados. Sin
                      selección se excluyen todos; si se eligen algunos, solo
                      esos quedan fuera.
                    </Hint>

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
            </div>

            <Separator />

            <div className="space-y-2">
              <LabelRow>
                <Label>Lista de precios</Label>
                <OptionalBadge />
              </LabelRow>
              <Select
                value={formData.price_list_id?.toString() ?? "all"}
                onValueChange={(value) =>
                  updateField(
                    "price_list_id",
                    value === "all" ? null : parseInt(value)
                  )
                }
                disabled={loading}
              >
                <SelectTrigger className="max-w-sm">
                  <SelectValue placeholder="Seleccionar lista de precios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las listas</SelectItem>
                  {priceLists.map((pl) => (
                    <SelectItem key={pl.id} value={pl.id.toString()}>
                      {pl.name}{pl.code ? ` (${pl.code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* T-718: el chatbot manda este link cuando el cliente pregunta por
                esta promoción, en vez del link de la categoría —que muestra
                todo el rubro y no solo los productos de la oferta. Vacío =
                sigue mandando el de categoría, como hasta ahora. */}
            <div className="space-y-2">
              <LabelRow>
                <Label htmlFor="landing_url">Página de la promoción</Label>
                <OptionalBadge />
              </LabelRow>
              <Input
                id="landing_url"
                placeholder="Ej: https://overtake.com.pe/p/3-x-99"
                value={formData.landing_url}
                onChange={(e) => updateField("landing_url", e.target.value)}
              />
              <Hint>
                El chatbot de WhatsApp envía este link cuando preguntan por la
                promoción. Vacío: envía el de la categoría.
              </Hint>
            </div>

            <Separator />

            <div className="space-y-2">
              <LabelRow>
                <Label>Descripción</Label>
                <OptionalBadge />
              </LabelRow>
              {/* El label lo pinta LabelRow para llevar el badge: el del
                  editor (solo acepta texto) se deja vacío. */}
              <WysiwygEditor
                label=""
                value={formData.description}
                onChange={(val) => updateField("description", val)}
                height="150px"
                toolbar="basic"
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
