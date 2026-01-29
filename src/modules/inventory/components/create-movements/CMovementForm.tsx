import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, Search, Image as ImageIcon, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchSaleProducts } from "../../services/CreateMovements.service";

const CMovementForm = () => {
  const [typeStock, setTypeStock] = useState<string | undefined>(undefined);
  const typesStock = [
    { id: 9, name: "Producción", code: "PRD" },
    { id: 10, name: "Fallido", code: "FAL" },
  ];

  const handleTypeStock = (value: string) => {
    setTypeStock(value);
  };

  useEffect(() => {
    const load = async () => {
      const data = await fetchSaleProducts();
      console.log(data);
    };
    load();
  }, []);

  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex flex-row gap-2">
        <div className="flex-1 flex flex-col gap-2">
          <Label>Tipo de Movimiento</Label>
          <Input
            className="bg-muted"
            placeholder="Intercambio de tipo"
            disabled
            type="text"
          />
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <Label>Usuario</Label>
          <Input
            className="bg-muted"
            placeholder="Kevin"
            disabled
            type="text"
          />
        </div>
      </div>

      <div className="flex flex-row gap-2">
        <div className="flex-1 flex flex-col gap-2">
          <Label>Almacén</Label>
          <Input
            className="bg-muted"
            placeholder="Gamarra"
            disabled
            type="text"
          />
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <Label>Fecha</Label>
          <Input
            className="bg-muted"
            placeholder="29-01-2026"
            disabled
            type="text"
          />
        </div>
      </div>

      <div className="flex flex-row gap-2">
        <Select
          value={typeStock || typesStock[0].id.toString()}
          onValueChange={(v) => handleTypeStock(v)}
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

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="w-full justify-start text-muted-foreground font-normal"
            >
              <Search className="w-4 h-4 mr-2" />
              Buscar por nombre o SKU...
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0 bg-popover">
            <Command shouldFilter={false}>
              <CommandInput placeholder="Buscar producto o SKU..." />
              <CommandList>
                <CommandEmpty>No se encontraron productos.</CommandEmpty>
                <CommandGroup>
                  <CommandItem className="flex items-center gap-3 py-2">
                    <Check className="h-4 w-4 shrink-0" />
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted">
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col min-w-0">
                      <span className="font-medium truncate">
                        Elemental - Bividí
                      </span>
                      <span className="text-sm text-muted-foreground truncate">
                        L (100000460141)
                      </span>
                    </div>

                    <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      0
                    </span>
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Button type="button">
          <Plus className="w-4 h-4 mr-2" /> Agregar
        </Button>
      </div>

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
                <Input value={40} className="bg-muted" disabled />
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <Input value={0} />
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <Select
                  value={typeStock || typesStock[0].id.toString()}
                  onValueChange={(v) => handleTypeStock(v)}
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
    </Card>
  );
};

export default CMovementForm;
