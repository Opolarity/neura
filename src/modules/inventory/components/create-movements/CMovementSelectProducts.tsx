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
import { Button } from "@/components/ui/button";
import { Check, Search, Image as ImageIcon, Plus } from "lucide-react";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";

interface CMovementSelectProductsProps {
  typeStock: string | undefined;
  typesStock: { id: number; name: string; code: string }[];
  onTypeStock: (value: string) => void;
}

const CMovementSelectProducts = ({
  typeStock,
  typesStock,
  onTypeStock,
}: CMovementSelectProductsProps) => {
  return (
    <div className="flex flex-row gap-2">
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
            <PaginationBar
              pagination={{
                p_page: 1,
                p_size: 20,
                total: 13,
              }}
              onPageChange={(page: number) => {}}
              onPageSizeChange={(size: number) => {}}
            />
          </Command>
        </PopoverContent>
      </Popover>

      <Button type="button">
        <Plus className="w-4 h-4 mr-2" /> Agregar
      </Button>
    </div>
  );
};

export default CMovementSelectProducts;
