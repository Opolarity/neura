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
import { Pencil } from "lucide-react";
import { Loader2 } from "lucide-react";
import type { InvoiceSerie } from "../../hooks/useInvoiceSeries";

interface InvoiceSeriesTableProps {
  loading: boolean;
  series: InvoiceSerie[];
  onEditItem: (item: InvoiceSerie) => void;
  onOpenChange: (open: boolean) => void;
}

const InvoiceSeriesTable = ({
  loading,
  series,
  onEditItem,
  onOpenChange,
}: InvoiceSeriesTableProps) => {
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
          <TableHead>FAC</TableHead>
          <TableHead>BOL</TableHead>
          <TableHead>NCF</TableHead>
          <TableHead>NCB</TableHead>
          <TableHead>NDF</TableHead>
          <TableHead>NDB</TableHead>
          <TableHead>GRR</TableHead>
          <TableHead>GRT</TableHead>
          <TableHead>Siguiente #</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Por defecto</TableHead>
          <TableHead className="w-[60px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {series.length === 0 ? (
          <TableRow>
            <TableCell colSpan={14} className="text-center text-muted-foreground py-8">
              No hay series registradas
            </TableCell>
          </TableRow>
        ) : (
          series.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.id}</TableCell>
              <TableCell>{item.account_name}</TableCell>
              <TableCell>{item.fac_serie}</TableCell>
              <TableCell>{item.bol_serie}</TableCell>
              <TableCell>{item.ncf_serie}</TableCell>
              <TableCell>{item.ncb_serie}</TableCell>
              <TableCell>{item.ndf_serie}</TableCell>
              <TableCell>{item.ndb_serie}</TableCell>
              <TableCell>{item.grr_serie}</TableCell>
              <TableCell>{item.grt_serie}</TableCell>
              <TableCell>{item.next_number}</TableCell>
              <TableCell>
                <Badge variant={item.is_active ? "default" : "secondary"}>
                  {item.is_active ? "Activo" : "Inactivo"}
                </Badge>
              </TableCell>
              <TableCell>
                {item.default && <Badge variant="outline">Sí</Badge>}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    onEditItem(item);
                    onOpenChange(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default InvoiceSeriesTable;
