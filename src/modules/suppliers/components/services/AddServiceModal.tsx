import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/shared/utils/utils";
import { useAddSupplierService } from "../../hooks/useAddSupplierService";
import { SupplierService } from "../../types/services.types";
import { MaterialLinkField } from "../MaterialLinkField";

interface AddServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Servicio a editar. Este modal solo edita: la creación vive en Cotizaciones. */
  service: SupplierService;
  /** Se ejecuta tras actualizar (por ejemplo, para recargar el listado). */
  onSaved?: () => void;
}

export const AddServiceModal = ({
  open,
  onOpenChange,
  service,
  onSaved,
}: AddServiceModalProps) => {
  const {
    quotations,
    materials,
    materialClasses,
    classes,
    loadingCatalogs,
    form,
    setField,
    materialLink,
    setMaterialLink,
    handleMaterialCreated,
    selectedQuotationLabel,
    selectedClassName,
    quotationSearchOpen,
    setQuotationSearchOpen,
    quotationSearch,
    setQuotationSearch,
    materialSearch,
    setMaterialSearch,
    materialClassSearch,
    setMaterialClassSearch,
    classSearchOpen,
    setClassSearchOpen,
    classSearch,
    setClassSearch,
    submitting,
    handleSubmit,
  } = useAddSupplierService({
    service,
    onSuccess: () => {
      onSaved?.();
      onOpenChange(false);
    },
  });

  // quotations y materials ya vienen filtrados por el servidor (búsqueda
  // debounced en el hook), así que no se vuelven a filtrar aquí. Las clases
  // sí son una lista local corta.
  const filteredClasses = classes.filter((cls) =>
    cls.name.toLowerCase().includes(classSearch.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Servicio</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Descripción *</Label>
            <Input
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Ej: Confección de polos"
              autoFocus
            />
          </div>

          {/* Cotización de proveedor */}
          <div className="space-y-2">
            <Label>Cotización de proveedor *</Label>
            <Popover open={quotationSearchOpen} onOpenChange={setQuotationSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  disabled={loadingCatalogs}
                  className="w-full justify-between font-normal"
                >
                  <span className="truncate">
                    {selectedQuotationLabel || "Seleccionar cotización..."}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0"
                align="start"
              >
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Buscar cotización..."
                    value={quotationSearch}
                    onValueChange={setQuotationSearch}
                  />
                  <CommandList className="h-[160px] overflow-y-auto">
                    <CommandEmpty>Sin resultados</CommandEmpty>
                    <CommandGroup>
                      {quotations.map((quotation) => (
                        <CommandItem
                          key={quotation.id}
                          value={quotation.label}
                          onSelect={() => {
                            setField(
                              "supplier_quotation_id",
                              quotation.id.toString()
                            );
                            setQuotationSearch("");
                            setQuotationSearchOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 shrink-0",
                              form.supplier_quotation_id === quotation.id.toString()
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <span className="truncate">{quotation.label}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Material — opcional: se vincula a uno existente o se crea aquí */}
          <MaterialLinkField
            value={materialLink}
            onChange={setMaterialLink}
            materials={materials}
            materialSearch={materialSearch}
            onMaterialSearchChange={setMaterialSearch}
            materialClasses={materialClasses}
            materialClassSearch={materialClassSearch}
            onMaterialClassSearchChange={setMaterialClassSearch}
            supplierId={service.supplierId}
            nameSuggestion={form.description}
            onMaterialCreated={handleMaterialCreated}
            disabled={loadingCatalogs}
          />

          {/* Clase de proveedor */}
          <div className="space-y-2">
            <Label>Clase de proveedor *</Label>
            <Popover open={classSearchOpen} onOpenChange={setClassSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  disabled={loadingCatalogs}
                  className="w-full justify-between font-normal"
                >
                  {selectedClassName || "Seleccionar clase..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0"
                align="start"
              >
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Buscar clase..."
                    value={classSearch}
                    onValueChange={setClassSearch}
                  />
                  <CommandList className="h-[160px] overflow-y-auto">
                    <CommandEmpty>Sin resultados</CommandEmpty>
                    <CommandGroup>
                      {filteredClasses.map((cls) => (
                        <CommandItem
                          key={cls.id}
                          value={cls.name}
                          onSelect={() => {
                            setField("supplier_class_id", cls.id.toString());
                            setClassSearch("");
                            setClassSearchOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              form.supplier_class_id === cls.id.toString()
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {cls.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar cambios"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddServiceModal;
