import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Supplier } from "../../types/suppliers.types";
import { useEditSupplier } from "../../hooks/useEditSupplier";
import { SupplierClassesField } from "./SupplierClassesField";

interface EditSupplierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier;
  /** Se ejecuta tras guardar, para recargar el listado. */
  onSaved: () => void;
}

export const EditSupplierModal = ({
  open,
  onOpenChange,
  supplier,
  onSaved,
}: EditSupplierModalProps) => {
  const {
    classes,
    loadingClasses,
    form,
    setForm,
    selectedClassIds,
    toggleClass,
    creatingClass,
    handleCreateClass,
    submitting,
    handleSubmit,
  } = useEditSupplier({
    supplier,
    onSaved: () => {
      onSaved();
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar proveedor</DialogTitle>
          <DialogDescription>
            {supplier.fullName} · {supplier.documentType} {supplier.documentNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Teléfono *</Label>
            <Input
              type="number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Ej: 987654321"
            />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="proveedor@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label>Dirección</Label>
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Dirección del taller"
            />
            {/* Es el punto de llegada de la guía de remisión con la que sale
                la mercadería hacia él. */}
            <p className="text-muted-foreground text-xs">
              Se imprime como dirección de llegada en su guía de remisión.
            </p>
          </div>

          {loadingClasses ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando clases...
            </div>
          ) : (
            <SupplierClassesField
              classes={classes}
              selectedIds={selectedClassIds}
              onToggle={toggleClass}
              onCreateClass={handleCreateClass}
              creatingClass={creatingClass}
            />
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

export default EditSupplierModal;
