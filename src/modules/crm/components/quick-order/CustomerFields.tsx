import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DocumentType } from "@/modules/sales/types";
import type { QuickOrderCustomer } from "../../types/quickOrder.types";
import { NumberSelect } from "./NumberSelect";

interface Props {
  customer: QuickOrderCustomer;
  documentTypes: DocumentType[];
  lookingUp: boolean;
  lookup: "erp" | "registry" | "none" | null;
  botOrderId: number | null;
  onChange: (customer: QuickOrderCustomer) => void;
  onSearch: () => void;
}

const LOOKUP_MESSAGE = {
  erp: "Cliente registrado en el ERP.",
  registry: "Datos tomados de RENIEC/SUNAT. Se registrará al crear la orden.",
  none: "No está registrado: completa sus datos y se creará con la orden.",
} as const;

/**
 * Datos del cliente para la orden. Llegan precargados con lo que el bot ya le
 * pidió por WhatsApp; buscar por documento completa el resto, como en Añadir
 * venta.
 */
export const CustomerFields = ({
  customer,
  documentTypes,
  lookingUp,
  lookup,
  botOrderId,
  onChange,
  onSearch,
}: Props) => {
  // Si cambia el documento, la cuenta encontrada antes ya no corresponde.
  const set = (patch: Partial<QuickOrderCustomer>) => onChange({ ...customer, ...patch });
  // RUC y demás documentos de empresa (persona jurídica): razón social y sin
  // apellidos, como en Añadir venta.
  const isCompany = documentTypes.find((d) => d.id === customer.documentTypeId)?.personType === 2;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Label className="text-xs" required>
          Documento
        </Label>
        <div className="grid grid-cols-[88px_1fr_auto] gap-1.5">
          <NumberSelect
            label="Tipo de documento"
            placeholder="Tipo"
            value={customer.documentTypeId}
            options={documentTypes}
            onChange={(documentTypeId) => {
              const company = documentTypes.find((d) => d.id === documentTypeId)?.personType === 2;
              set({ documentTypeId, accountId: null, userId: null, ...(company ? { lastName: "" } : {}) });
            }}
          />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSearch();
            }}
          >
            <Input
              value={customer.documentNumber}
              onChange={(e) => set({ documentNumber: e.target.value, accountId: null, userId: null })}
              placeholder="Número"
              inputMode="numeric"
              className="h-8 text-xs"
              aria-label="Número de documento"
              aria-required
            />
          </form>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={onSearch}
            disabled={lookingUp || !customer.documentNumber.trim()}
            aria-label="Buscar cliente por documento"
            title="Buscar cliente por documento"
          >
            {lookingUp ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
          </Button>
        </div>
        {lookup && <p className="text-[11px] text-muted-foreground">{LOOKUP_MESSAGE[lookup]}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="qo-first-name" className="text-xs" required>
          {isCompany ? "Razón social" : "Nombre"}
        </Label>
        <Input
          id="qo-first-name"
          value={customer.firstName}
          onChange={(e) => set({ firstName: e.target.value })}
          className="h-8 text-xs"
          aria-required
        />
      </div>
      {!isCompany && (
        <div className="flex flex-col gap-1">
          <Label htmlFor="qo-last-name" className="text-xs">
            Apellidos
          </Label>
          <Input
            id="qo-last-name"
            value={customer.lastName}
            onChange={(e) => set({ lastName: e.target.value })}
            className="h-8 text-xs"
          />
        </div>
      )}
      <div className="grid grid-cols-2 gap-1.5">
        <div className="flex flex-col gap-1">
          <Label htmlFor="qo-phone" className="text-xs">
            Celular
          </Label>
          <Input
            id="qo-phone"
            value={customer.phone}
            onChange={(e) => set({ phone: e.target.value })}
            inputMode="tel"
            className="h-8 text-xs"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="qo-email" className="text-xs">
            Correo
          </Label>
          <Input
            id="qo-email"
            type="email"
            value={customer.email}
            onChange={(e) => set({ email: e.target.value })}
            className="h-8 text-xs"
          />
        </div>
      </div>

      {botOrderId && (
        <p className="rounded-md bg-muted px-2 py-1.5 text-[11px] text-muted-foreground">
          El bot ya le armó el pedido #{botOrderId}. Revísalo en Ventas antes de crear otro.
        </p>
      )}
    </div>
  );
};
