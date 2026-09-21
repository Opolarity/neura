import { Loader2, SquarePen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Supplier } from "../../types/suppliers.types";

interface SuppliersTableProps {
  suppliers: Supplier[];
  loading: boolean;
  onEdit: (supplier: Supplier) => void;
}

export const SuppliersTable = ({
  suppliers,
  loading,
  onEdit,
}: SuppliersTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">ID</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Tipo Doc.</TableHead>
          <TableHead>Nro. Documento</TableHead>
          <TableHead>Teléfono</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Clases</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading && suppliers.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-8">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando proveedores...
              </div>
            </TableCell>
          </TableRow>
        ) : suppliers.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center text-muted-foreground p-10">
              No se encontraron proveedores
            </TableCell>
          </TableRow>
        ) : (
          suppliers.map((supplier) => (
            <TableRow key={supplier.id}>
              <TableCell className="font-medium">{supplier.id}</TableCell>
              <TableCell>{supplier.fullName}</TableCell>
              <TableCell>{supplier.documentType}</TableCell>
              <TableCell>{supplier.documentNumber}</TableCell>
              <TableCell>{supplier.phone ?? "—"}</TableCell>
              <TableCell>{supplier.email || "—"}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {supplier.classes.length === 0 ? (
                    <span className="text-muted-foreground text-sm">—</span>
                  ) : (
                    supplier.classes.map((cls) => (
                      <Badge key={cls.id} variant="secondary">
                        {cls.name}
                      </Badge>
                    ))
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(supplier)}
                  aria-label={`Editar proveedor ${supplier.fullName}`}
                >
                  <SquarePen className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};
