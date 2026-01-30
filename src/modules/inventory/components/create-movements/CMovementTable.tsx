import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface CMovementTableProps {
  typeStock: string | undefined;
  typesStock: { id: number; name: string; code: string }[];
  onTypeStock: (value: string) => void;
}

const CMovementTable = ({
  typeStock,
  typesStock,
  onTypeStock,
}: CMovementTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className=" text-center">Producto</TableHead>
          <TableHead className=" text-center">Cantidad Actual</TableHead>
          <TableHead className=" text-center">Cantidad Ingresar</TableHead>
          <TableHead className=" text-center">Tipo de Inventario</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>
            <div className="flex flex-col">
              <span className="font-medium">Elemental - Bividí</span>
            </div>
          </TableCell>
          <TableCell>
            <div className="flex flex-col">
              <Input placeholder="40" className="bg-muted" disabled />
            </div>
          </TableCell>
          <TableCell>
            <div className="flex flex-col">
              <Input placeholder="0" />
            </div>
          </TableCell>
          <TableCell>
            <div className="flex flex-col">
              <Select
                value={typeStock || typesStock[0].id.toString()}
                onValueChange={(v) => onTypeStock(v)}
              >
                <SelectTrigger id="stock-type" aria-labelledby="stock-type">
                  <SelectValue placeholder="Seleccione un tipo"></SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {typesStock.map((typeS, index) => (
                    <SelectItem key={index} value={typeS.id.toString()}>
                      {typeS.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};

export default CMovementTable;
