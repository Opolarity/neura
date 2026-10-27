import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PaymentMethod } from "@/modules/sales/types";
import { cn } from "@/shared/utils/utils";
import { MAX_VOUCHERS, type QuickOrderPayment } from "../../types/quickOrder.types";
import { NumberSelect } from "./NumberSelect";

/** Un pago o un vuelto: los dos llevan método, monto, cuenta y capturas. */
type Entry = Omit<QuickOrderPayment, "operationCode"> & { operationCode?: string };

interface Props<T extends Entry> {
  entry: T;
  label: string;
  methods: PaymentMethod[];
  accounts: { id: number; name: string }[];
  needsAccount: (paymentMethodId: number | null) => boolean;
  accountFor: (paymentMethodId: number | null) => number | null;
  /** Los vueltos no llevan código de operación. */
  withOperationCode: boolean;
  onChange: (entry: T) => void;
  onRemove: () => void;
}

const VoucherThumb = ({ file, onRemove }: { file: File; onRemove: () => void }) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return (
    <span className="relative">
      {url && <img src={url} alt={file.name} className="h-11 w-11 rounded-md border object-cover" />}
      <button
        type="button"
        onClick={onRemove}
        className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full border bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Quitar ${file.name}`}
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </span>
  );
};

/**
 * Tarjeta de un pago (o vuelto), como en Añadir venta: método, monto, cuenta
 * de destino si el método no trae una, código de operación y hasta 3
 * capturas. Las capturas se eligen, se arrastran o se pegan con Ctrl+V.
 */
export const PaymentEntryCard = <T extends Entry>({
  entry,
  label,
  methods,
  accounts,
  needsAccount,
  accountFor,
  withOperationCode,
  onChange,
  onRemove,
}: Props<T>) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const set = (patch: Partial<T>) => onChange({ ...entry, ...patch });

  const addFiles = (files: FileList | File[] | null | undefined) => {
    const images = Array.from(files ?? []).filter((f) => f.type.startsWith("image/"));
    if (!images.length) return;
    set({ vouchers: [...entry.vouchers, ...images].slice(0, MAX_VOUCHERS) } as Partial<T>);
  };

  const full = entry.vouchers.length >= MAX_VOUCHERS;

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border bg-background p-2" onPaste={(e) => addFiles(e.clipboardData.files)}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRemove} aria-label={`Quitar ${label.toLowerCase()}`}>
          <Trash className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-[1fr_92px] gap-1.5">
        <NumberSelect
          label={`Método de ${label.toLowerCase()}`}
          placeholder="Método"
          value={entry.paymentMethodId}
          options={methods}
          onChange={(paymentMethodId) =>
            set({ paymentMethodId, businessAccountId: accountFor(paymentMethodId) } as Partial<T>)
          }
        />
        <Input
          type="number"
          min={0}
          step="0.01"
          value={entry.amount ?? ""}
          onChange={(e) => set({ amount: e.target.value === "" ? null : Number(e.target.value) } as Partial<T>)}
          placeholder="0.00"
          className="h-8 text-xs"
          aria-label={`Monto de ${label.toLowerCase()}`}
          aria-required
        />
      </div>

      {needsAccount(entry.paymentMethodId) && (
        <NumberSelect
          label="Cuenta"
          placeholder={withOperationCode ? "Cuenta de destino" : "Cuenta de origen"}
          value={entry.businessAccountId}
          options={accounts}
          onChange={(businessAccountId) => set({ businessAccountId } as Partial<T>)}
        />
      )}

      {withOperationCode && (
        <Input
          value={entry.operationCode ?? ""}
          onChange={(e) => set({ operationCode: e.target.value } as Partial<T>)}
          placeholder="Código de operación"
          className="h-8 text-xs"
          aria-label="Código de operación"
        />
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <div className="flex flex-wrap items-center gap-2">
        {entry.vouchers.map((file, i) => (
          <VoucherThumb
            key={`${file.name}-${i}`}
            file={file}
            onRemove={() => set({ vouchers: entry.vouchers.filter((_, k) => k !== i) } as Partial<T>)}
          />
        ))}
        {!full && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              addFiles(e.dataTransfer.files);
            }}
            className={cn(
              "flex h-11 flex-1 items-center gap-2 rounded-md border border-dashed px-2 text-left text-[11px] transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              dragging ? "border-primary bg-primary/10" : "hover:bg-muted"
            )}
          >
            <ImagePlus className="h-4 w-4 shrink-0" />
            <span>
              {entry.vouchers.length ? "Otra captura" : "Subir captura"}
              <span className="block text-muted-foreground">
                Arrastra, pega o elige · {entry.vouchers.length}/{MAX_VOUCHERS}
              </span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
