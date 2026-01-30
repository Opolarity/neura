import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, TrendingUp, TrendingDown, ChevronDown } from "lucide-react";

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Movimiento
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onAddIncome} className="gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              Registrar Ingreso
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onAddExpense} className="gap-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              Registrar Gasto
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default MovementsHeader;
