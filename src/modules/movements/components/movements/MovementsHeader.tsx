import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, TrendingUp, TrendingDown, ChevronDown } from "lucide-react";
import { ComponentPermission } from "@/shared/components/component-permission";

// Los dos items del menú. El trigger se pinta con la lista entera: basta con
// poder registrar UNO de los dos para que "Nuevo Movimiento" tenga sentido, y
// sin ninguno el botón abriría un menú vacío.
const NEW_MOVEMENT_CODES = [
  "movements_income.create",
  "movements_expenses.create",
];

interface MovementsHeaderProps {
  onAddExpense: () => void;
  onAddIncome: () => void;
}

const MovementsHeader = ({
  onAddExpense,
  onAddIncome,
}: MovementsHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Movimientos</h1>
        <p className="text-gray-600">
          Gestiona todos los ingresos y gastos del negocio
        </p>
      </div>
      <div className="flex gap-2">
        <ComponentPermission codeIn={NEW_MOVEMENT_CODES}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nuevo Movimiento
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Cada item lleva a su propia ruta, ya protegida con ese mismo
                  code: se reutiliza para no ofrecer una opción que acaba en una
                  pantalla bloqueada. */}
              <ComponentPermission codeIn={["movements_income.create"]}>
                <DropdownMenuItem onClick={onAddIncome} className="gap-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  Registrar Ingreso
                </DropdownMenuItem>
              </ComponentPermission>
              <ComponentPermission codeIn={["movements_expenses.create"]}>
                <DropdownMenuItem onClick={onAddExpense} className="gap-2">
                  <TrendingDown className="w-4 h-4 text-destructive" />
                  Registrar Gasto
                </DropdownMenuItem>
              </ComponentPermission>
            </DropdownMenuContent>
          </DropdownMenu>
        </ComponentPermission>
      </div>
    </div>
  );
};

export default MovementsHeader;
