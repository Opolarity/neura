import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Edit, Trash2 } from "lucide-react";

interface TableInvoicesProps {
  invoice?: string;
}

export default function InvoicesTable({ invoice }: TableInvoicesProps) {
  const navigate = useNavigate();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>SERIE</TableHead>
          <TableHead>N° DE FACTURA</TableHead>
          <TableHead>ORDEN</TableHead>
          <TableHead>CLIENTE</TableHead>
          <TableHead>TOTAL</TableHead>
          <TableHead>ESTADO</TableHead>
          <TableHead>ACCIONES</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {Invoices.map((item) => (
          <TableRow key={item.ID}>
            <TableCell>{item.ID}</TableCell>
            <TableCell>{item.SERIE}</TableCell>
            <TableCell>{item.FACTURA}</TableCell>
            <TableCell>{item.ORDEN}</TableCell>
            <TableCell>{item.CLIENTE}</TableCell>
            <TableCell>S/ {item.TOTAL}</TableCell>
            <TableCell>{item.ESTADO}</TableCell>
            <TableCell>
              {" "}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/invoices/edit/${item.ID}`)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
              
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
const Invoices = [
  {
    ID: 1,
    SERIE: "1",
    FACTURA: "1",
    ORDEN: "1",
    CLIENTE: "Juan Pérez",
    TOTAL: 250.5,
    ESTADO: "Pagado",
  },
];
