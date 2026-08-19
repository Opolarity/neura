import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ComponentPermission } from "@/shared/components/component-permission";

function InvoicesHeader({ onOpenOrder }: { onOpenOrder: () => void }) {
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-center mb-4">
      <div>
        <h1 className="text-2xl font-bold">FACTURACIÓN</h1>
        <p className="text-gray-600">
          Gestiona y consulta los comprobantes emitidos en el sistema
        </p>
      </div>

      <div className="flex gap-2">
        {/* Las dos opciones del menú acaban emitiendo un comprobante —una en
            blanco y la otra a partir de un pedido—, así que el menú entero
            cuelga de invoices.create, el code de /invoices/add. */}
        <ComponentPermission codeIn={["invoices.create"]}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex gap-2">
                <Plus className="h-4 w-4" />
                Nueva Factura
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate("/invoices/add")}>
                Factura Vacía
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenOrder}>
                A partir de un pedido
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </ComponentPermission>
      </div>
    </div>
  );
}
export default InvoicesHeader;
