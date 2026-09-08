import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Store } from "lucide-react";
import { FranchiseeTenant } from "../../types/FranchiseStock.types";

interface FranchiseeEntryModalProps {
  open: boolean;
  franchisees: FranchiseeTenant[];
  loading: boolean;
  /** Se llama al Aceptar, con el code del tenant elegido. */
  onAccept: (tenantReference: string) => void;
}

// name es NOT NULL en tenants, pero si llegara vacío el code deja el selector
// utilizable en vez de una fila en blanco.
const franchiseeLabel = (tenant: FranchiseeTenant) =>
  tenant.name?.trim() || tenant.code;

/**
 * Modal de entrada de /stock/products/franchise: la pantalla no tiene nada que
 * mostrar hasta saber de qué franquiciado, así que se pide al entrar en vez de
 * dejar una tabla vacía.
 *
 * Mismo patrón que el modal de ajustes de "Añadir venta" (CreateSale.tsx): la
 * selección se guarda en un estado temporal y solo se aplica al Aceptar, y
 * cerrar el modal por cualquier otra vía (Cancelar, Escape, clic fuera, la X)
 * saca de la pantalla y devuelve a la página base. El isAcceptingRef es lo que
 * distingue "cerré porque acepté" de "cerré para salir": sin él, aceptar
 * también dispararía la redirección.
 */
export default function FranchiseeEntryModal({
  open,
  franchisees,
  loading,
  onAccept,
}: FranchiseeEntryModalProps) {
  const navigate = useNavigate();
  const [tempTenant, setTempTenant] = useState("");
  const isAcceptingRef = useRef(false);

  // Al reabrirse (p. ej. tras volver atrás) el temporal arranca limpio.
  useEffect(() => {
    if (open) {
      setTempTenant("");
      isAcceptingRef.current = false;
    }
  }, [open]);

  const salir = () => navigate("/sales/products/franchise");

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpenValue) => {
        if (!isOpenValue && !isAcceptingRef.current) {
          salir();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            Selecciona un franquiciado
          </DialogTitle>
          <DialogDescription>
            Elige de qué franquiciado quieres ver el stock de mercadería
            Overtake.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : franchisees.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No hay franquiciados registrados.
            </p>
          ) : (
            <div className="space-y-1">
              <Label>Franquiciado</Label>
              <Select value={tempTenant} onValueChange={setTempTenant}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccione un franquiciado" />
                </SelectTrigger>
                <SelectContent>
                  {franchisees.map((tenant) => (
                    <SelectItem key={tenant.code} value={tenant.code}>
                      {franchiseeLabel(tenant)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={salir}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              isAcceptingRef.current = true;
              onAccept(tempTenant);
            }}
            disabled={!tempTenant || loading}
          >
            Aceptar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
