import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KpiCard } from "@/modules/reports/components/shared/KpiCard";
import { formatCurrency } from "@/shared/utils/currency";
import { cn } from "@/shared/utils/utils";
import { toastError } from "@/shared/utils/toastError";
import { useFranchiseStockValue } from "../../hooks/useFranchiseStockValue";

interface Props {
  tenantReference: string | null;
}

/**
 * T-593: cuánto stock tiene el franquiciado (unidades y S/), cuánto es su tope
 * y cuánto más se le puede enviar. El stock viene de franquiciados; costo y
 * precio, del catálogo de Overtake cruzando por SKU.
 */
export default function FranchiseStockSummary({ tenantReference }: Props) {
  const { value, saveLimit } = useFranchiseStockValue(tenantReference);
  const data = value.data;
  const [limitInput, setLimitInput] = useState("");

  useEffect(() => {
    setLimitInput(data?.stock_limit != null ? String(data.stock_limit) : "");
  }, [data?.stock_limit, tenantReference]);

  if (!tenantReference) return null;

  const parsedLimit = limitInput.trim() === "" ? null : Number(limitInput);
  const limitInvalid = parsedLimit !== null && (!Number.isFinite(parsedLimit) || parsedLimit < 0);
  const limitDirty = (data?.stock_limit ?? null) !== parsedLimit;
  const loading = value.isLoading;

  const handleSave = async () => {
    try {
      await saveLimit.mutateAsync(parsedLimit);
    } catch (err) {
      toastError(err, "No se pudo guardar el tope");
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Unidades en stock"
          value={data?.units ?? "—"}
          loading={loading}
          subtitle={
            data && data.unmatched_units > 0
              ? `${data.unmatched_units} uds sin SKU en Overtake (sin valorizar)`
              : undefined
          }
        />
        <KpiCard
          title="Valor del stock a costo"
          value={data ? formatCurrency(data.cost_value) : "—"}
          loading={loading}
        />
        <KpiCard
          title="Valor potencial de venta"
          value={data ? formatCurrency(data.retail_value) : "—"}
          loading={loading}
          subtitle="precio minorista de Overtake"
        />
        <KpiCard
          title="Disponible para enviar"
          value={data?.available != null ? formatCurrency(data.available) : "Sin tope"}
          loading={loading}
          subtitle={data?.stock_limit != null ? `tope ${formatCurrency(data.stock_limit)} a costo` : undefined}
        />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {data?.by_category.map((c) => (
            <span key={c.category} className="text-muted-foreground">
              {c.category}: <span className="font-medium text-foreground">{c.units}</span>
            </span>
          ))}
        </div>

        <div className="flex items-end gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Tope de stock (S/ a costo)</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Sin tope"
              value={limitInput}
              onChange={(e) => setLimitInput(e.target.value)}
              className={cn("h-9 w-[160px] text-right", limitInvalid && "border-destructive")}
            />
          </div>
          <Button
            size="sm"
            className="h-9 gap-1.5"
            onClick={handleSave}
            disabled={!limitDirty || limitInvalid || saveLimit.isPending}
          >
            {saveLimit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar
          </Button>
        </div>
      </div>

      {data?.available != null && data.available < 0 && (
        <p className="text-sm text-destructive">
          El stock a costo supera el tope en {formatCurrency(Math.abs(data.available))}.
        </p>
      )}
    </div>
  );
}
