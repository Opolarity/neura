import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Loader2, Trash2 } from "lucide-react";
import { BusinessAccount } from "../../types/BusinessAccount.types";

interface BusinessAccountTableProps {
  loading: boolean;
  businessAccounts: BusinessAccount[];
  onEditItem: (item: BusinessAccount) => void;
  onOpenChange: (open: boolean) => void;
  onDeleteClick: (item: BusinessAccount) => void;
}

const BusinessAccountTable = ({
  loading,
  businessAccounts,
  onEditItem,
  onOpenChange,
  onDeleteClick,
}: BusinessAccountTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">ID</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Banco</TableHead>
          <TableHead>N° Cuenta</TableHead>
          <TableHead className="text-right">Monto Total</TableHead>
          <TableHead className="text-center">Estado</TableHead>
          <TableHead className="text-center w-28">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando cuentas de negocio...
              </div>
            </TableCell>
          </TableRow>
        ) : businessAccounts.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={7}
              className="text-center py-10 text-muted-foreground"
            >
              No se encontraron cuentas de negocio
            </TableCell>
          </TableRow>
        ) : (
          businessAccounts.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-muted-foreground">
                {item.id}
              </TableCell>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.bank}</TableCell>
              <TableCell className="font-mono text-sm">
                {item.account_number}
              </TableCell>
              <TableCell className="text-right">
                {item.total_amount != null
                  ? new Intl.NumberFormat("es-CO", {
                      style: "currency",
                      currency: "COP",
                      minimumFractionDigits: 0,
                    }).format(item.total_amount)
                  : "—"}
              </TableCell>
              <TableCell className="text-center">
                <Badge variant={item.is_active ? "default" : "secondary"}>
                  {item.is_active ? "Activo" : "Inactivo"}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      onEditItem(item);
                      onOpenChange(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onDeleteClick(item)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default BusinessAccountTable;
