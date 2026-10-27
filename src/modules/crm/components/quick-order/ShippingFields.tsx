import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import type { ShippingCost } from "@/modules/sales/types";
import { formatCurrency } from "@/shared/utils/currency";
import type { QuickOrderCatalogs, QuickOrderShipping } from "../../types/quickOrder.types";
import { NumberSelect } from "./NumberSelect";

interface Props {
  shipping: QuickOrderShipping;
  catalogs: QuickOrderCatalogs;
  options: ShippingCost[];
  onChange: (shipping: QuickOrderShipping) => void;
}

/**
 * Datos de envío en una sola columna. Al cambiar un nivel del ubigeo se
 * limpian los de abajo y la tarifa, porque la tarifa depende de la ubicación.
 */
export const ShippingFields = ({ shipping, catalogs, options, onChange }: Props) => {
  const states = useMemo(
    () => catalogs.states.filter((s) => s.countryId === shipping.countryId),
    [catalogs.states, shipping.countryId]
  );
  const cities = useMemo(
    () => catalogs.cities.filter((c) => c.stateId === shipping.stateId),
    [catalogs.cities, shipping.stateId]
  );
  const neighborhoods = useMemo(
    () => catalogs.neighborhoods.filter((n) => n.cityId === shipping.cityId),
    [catalogs.neighborhoods, shipping.cityId]
  );

  const resetCost = { shippingCostId: null, cost: 0 };
  const set = (patch: Partial<QuickOrderShipping>) => onChange({ ...shipping, ...patch });

  return (
    <div className="flex flex-col gap-1.5">
      <NumberSelect
        label="Departamento"
        placeholder="Departamento"
        value={shipping.stateId}
        options={states}
        onChange={(stateId) => set({ stateId, cityId: null, neighborhoodId: null, ...resetCost })}
      />
      <div className="grid grid-cols-2 gap-1.5">
        <NumberSelect
          label="Provincia"
          placeholder="Provincia"
          value={shipping.cityId}
          options={cities}
          onChange={(cityId) => set({ cityId, neighborhoodId: null, ...resetCost })}
        />
        <NumberSelect
          label="Distrito"
          placeholder="Distrito"
          value={shipping.neighborhoodId}
          options={neighborhoods}
          onChange={(neighborhoodId) => set({ neighborhoodId, ...resetCost })}
        />
      </div>
      <NumberSelect
        label="Método de envío"
        placeholder={options.length ? "Método de envío" : "Sin tarifas para esta ubicación"}
        value={shipping.shippingCostId}
        options={options.map((o) => ({ id: o.id, name: `${o.name} · ${formatCurrency(o.cost)}` }))}
        onChange={(id) => {
          const option = options.find((o) => o.id === id);
          set({ shippingCostId: id, cost: option?.cost ?? 0 });
        }}
      />
      <Input
        value={shipping.address}
        onChange={(e) => set({ address: e.target.value })}
        placeholder="Dirección"
        className="h-8 text-xs"
        aria-label="Dirección"
        aria-required
      />
      <Input
        value={shipping.reference}
        onChange={(e) => set({ reference: e.target.value })}
        placeholder="Referencia"
        className="h-8 text-xs"
        aria-label="Referencia"
      />
      <div className="grid grid-cols-2 gap-1.5">
        <Input
          value={shipping.receptionPerson}
          onChange={(e) => set({ receptionPerson: e.target.value })}
          placeholder="Quién recibe"
          className="h-8 text-xs"
          aria-label="Quién recibe"
        />
        <Input
          value={shipping.receptionPhone}
          onChange={(e) => set({ receptionPhone: e.target.value })}
          placeholder="Celular"
          inputMode="tel"
          className="h-8 text-xs"
          aria-label="Celular de quien recibe"
        />
      </div>
    </div>
  );
};
