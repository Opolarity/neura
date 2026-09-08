import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SquarePen, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { InvoiceSerie } from "../../hooks/useInvoiceSeries";
import { ComponentPermission } from "@/shared/components/component-permission";

// ID, Cuenta, Tipo de Comprobante, Serie, Siguiente #, Estado, acciones. Si el
// rol no puede editar, la última columna no se pinta y este número queda uno
// largo: solo afecta a la fila de "no hay series", y la columna sobrante
// colapsa a 0px porque ninguna otra fila la ocupa.
const COL_SPAN = 7;

// Code de la columna de acciones, en una constante para que la cabecera y la
// celda no puedan quedar con listas distintas y aparezca un th sin td o al
// revés.
const ACTION_CODES = ["invoice_series.edit"];

interface InvoiceSeriesTableProps {
  loading: boolean;
  series: InvoiceSerie[];
}

const InvoiceSeriesTable = ({ loading, series }: InvoiceSeriesTableProps) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Cuenta</TableHead>
          <TableHead>Tipo de Comprobante</TableHead>
          <TableHead>Serie</TableHead>
          <TableHead>Siguiente #</TableHead>
          <TableHead>Estado</TableHead>
          {/* Se envuelve el th entero: aunque no lleve texto, la celda sigue
              ocupando sus 60px y dejaría un hueco muerto al final. */}
          <ComponentPermission codeIn={ACTION_CODES}>
            <TableHead className="w-[60px]"></TableHead>
          </ComponentPermission>
        </TableRow>
      </TableHeader>
      <TableBody>
        {series.length === 0 ? (
          <TableRow>
            <TableCell colSpan={COL_SPAN} className="text-center text-muted-foreground py-8">
              No hay series registradas
            </TableCell>
          </TableRow>
        ) : (
          series.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.id}</TableCell>
              <TableCell>{item.account_name}</TableCell>
              <TableCell>{item.invoice_type_name}</TableCell>
              <TableCell>{item.serie || "-"}</TableCell>
              <TableCell>{item.next_number}</TableCell>
              <TableCell>
                <Badge variant={item.is_active ? "default" : "secondary"}>
                  {item.is_active ? "Activo" : "Inactivo"}
                </Badge>
              </TableCell>
              <ComponentPermission codeIn={ACTION_CODES}>
                <TableCell>
                  {/* El botón lleva a /invoices/series/edit/:serieId, ya
                      protegida con invoice_series.edit: se reutiliza ese code. */}
                  <Button
                    variant="outline"
                    size="sm"
                    title="Editar la serie"
                    onClick={() => navigate(`/invoices/series/edit/${item.id}`)}
                  >
                    <SquarePen className="h-4 w-4" />
                  </Button>
                </TableCell>
              </ComponentPermission>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default InvoiceSeriesTable;
