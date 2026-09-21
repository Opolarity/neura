import { Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAddSupplier } from "../../hooks/useAddSupplier";
import { SupplierClassesField } from "./SupplierClassesField";

interface AddSupplierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Se ejecuta tras crear el proveedor, con su id -- para recargar el listado
   * y, si quien abre el modal lo necesita, seleccionarlo al vuelo.
   */
  onCreated?: (supplierId: number) => void;
}

export const AddSupplierModal = ({
  open,
  onOpenChange,
  onCreated,
}: AddSupplierModalProps) => {
  const {
    documentTypes,
    classes,
    searchDocTypeId,
    setSearchDocTypeId,
    searchDocNumber,
    setSearchDocNumber,
    searching,
    handleSearchAccount,
    accountResolved,
    existingAccount,
    resetSearch,
    formAccount,
    setFormAccount,
    formSupplier,
    setFormSupplier,
    selectedClassIds,
    toggleClass,
    creatingClass,
    handleCreateClass,
    submitting,
    handleSubmit,
  } = useAddSupplier({
    onSuccess: (supplierId) => {
      onCreated?.(supplierId);
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Añadir Proveedor</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Paso 1: Búsqueda de cuenta */}
          <div className="space-y-4">
            <p className="text-sm font-medium">
              Paso 1 — Identificación del proveedor
            </p>

            <div className="space-y-2">
              <Label>Tipo de Documento *</Label>
              <Select
                value={searchDocTypeId}
                onValueChange={setSearchDocTypeId}
                disabled={accountResolved}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione tipo" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((dt) => (
                    <SelectItem key={dt.id} value={dt.id.toString()}>
                      {dt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Número de Documento *</Label>
              <div className="flex gap-2">
                <Input
                  value={searchDocNumber}
                  onChange={(e) => setSearchDocNumber(e.target.value)}
                  placeholder="Ej: 123456789"
                  disabled={accountResolved}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchAccount()}
                />
                {!accountResolved ? (
                  <Button
                    type="button"
                    onClick={handleSearchAccount}
                    disabled={searching}
                    className="shrink-0"
                  >
                    {searching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
                    onClick={resetSearch}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Resultado de la búsqueda */}
            {accountResolved && existingAccount && (
              <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
                <p className="font-medium">Cuenta encontrada</p>
                <p>
                  {[
                    existingAccount.name,
                    existingAccount.middle_name,
                    existingAccount.last_name,
                    existingAccount.last_name2,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                </p>
              </div>
            )}

            {/* Formulario de nueva cuenta si no existe */}
            {accountResolved && !existingAccount && (
              <div className="space-y-4 pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  No se encontró la cuenta. Completa los datos para crearla.
                </p>
                <div className="space-y-2">
                  <Label>Primer Nombre *</Label>
                  <Input
                    value={formAccount.name}
                    onChange={(e) =>
                      setFormAccount({ ...formAccount, name: e.target.value })
                    }
                    placeholder="Nombre"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Segundo Nombre</Label>
                  <Input
                    value={formAccount.middle_name}
                    onChange={(e) =>
                      setFormAccount({
                        ...formAccount,
                        middle_name: e.target.value,
                      })
                    }
                    placeholder="Segundo nombre"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Primer Apellido *</Label>
                  <Input
                    value={formAccount.last_name}
                    onChange={(e) =>
                      setFormAccount({
                        ...formAccount,
                        last_name: e.target.value,
                      })
                    }
                    placeholder="Apellido"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Segundo Apellido</Label>
                  <Input
                    value={formAccount.last_name2}
                    onChange={(e) =>
                      setFormAccount({
                        ...formAccount,
                        last_name2: e.target.value,
                      })
                    }
                    placeholder="Segundo apellido"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Paso 2: Datos del proveedor */}
          {accountResolved && (
            <div className="space-y-4 pt-4 border-t">
              <p className="text-sm font-medium">Paso 2 — Datos del proveedor</p>

              <div className="space-y-2">
                <Label>Teléfono *</Label>
                <Input
                  type="number"
                  value={formSupplier.phone}
                  onChange={(e) =>
                    setFormSupplier({ ...formSupplier, phone: e.target.value })
                  }
                  placeholder="Ej: 3001234567"
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formSupplier.email}
                  onChange={(e) =>
                    setFormSupplier({ ...formSupplier, email: e.target.value })
                  }
                  placeholder="proveedor@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label>Dirección</Label>
                <Input
                  value={formSupplier.address}
                  onChange={(e) =>
                    setFormSupplier({
                      ...formSupplier,
                      address: e.target.value,
                    })
                  }
                  placeholder="Dirección del taller"
                />
                {/* Es el punto de llegada de la guía de remisión con la que
                    sale la mercadería hacia él. */}
                <p className="text-muted-foreground text-xs">
                  Se imprime como dirección de llegada en su guía de remisión.
                </p>
              </div>

              <SupplierClassesField
                classes={classes}
                selectedIds={selectedClassIds}
                onToggle={toggleClass}
                onCreateClass={handleCreateClass}
                creatingClass={creatingClass}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !accountResolved}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Proveedor"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddSupplierModal;
