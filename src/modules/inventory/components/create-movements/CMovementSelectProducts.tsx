import { useState } from "react";
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
import { Check, Search, Image as ImageIcon } from "lucide-react";
import { ProductSales } from "../../types/Movements.types";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { cn } from "@/shared/utils/utils";
import { Types } from "@/shared/types/type";

interface CMovementSelectProductsProps {
  products: ProductSales[];
  selectedIds: Set<string>;
  movementType: Types | null;
  selectedProduct: ProductSales | null;
  isLoading: boolean;
  search: string;
  pagination: PaginationState;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onSelectProduct: (product: ProductSales) => void;
}

const CMovementSelectProducts = ({
  movementType,
  products,
  selectedIds,
  selectedProduct,
  isLoading,
  search,
  pagination,
  isOpen,
  setIsOpen,
  onSearchChange,
  onPageChange,
  onSelectProduct,
}: CMovementSelectProductsProps) => {

  const totalPages = Math.ceil(pagination.total / pagination.p_size);
  const makeKey = (productId: number, typeId: number) =>
    `${productId}-${typeId}`;

  return (
    <div className="flex flex-row gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full justify-start text-muted-foreground font-normal overflow-hidden"
          >
            <Search className="w-4 h-4 mr-2 shrink-0" />
            <span className="truncate">
              {selectedProduct?.productTitle || "Buscar por nombre o SKU..."}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0 bg-popover">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Escribe para buscar..."
              value={search}
              onValueChange={onSearchChange}
            />
            <CommandList>
              {isLoading ? (
                <div className="p-4 text-sm text-center text-muted-foreground flex items-center justify-center gap-2">
                  <span>Cargando productos...</span>
                </div>
              ) : (
                <>
                  <CommandEmpty>No se encontraron productos.</CommandEmpty>
                  <CommandGroup>
                    {products.map((p) => {
                      const termsNames = p.terms.map((t) => t.name).join(" / ");
                      const displayTerms = termsNames
                        ? `${termsNames} (${p.sku})`
                        : p.sku;

                      return (
                        <CommandItem
                          key={p.sku}
                          className="flex items-center gap-3 py-2"
                          onSelect={() => onSelectProduct(p)}
                        >
                          <Check
                            className={cn(
                              "h-4 w-4 shrink-0",
                              selectedIds.has(
                                makeKey(p.variationId, movementType?.id),
                              )
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted">
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.productTitle}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          <div className="flex flex-1 flex-col min-w-0">
                            <span className="font-medium truncate">
                              {p.productTitle}
                            </span>
                            <span className="text-sm text-muted-foreground truncate">
                              {displayTerms}
                            </span>
                          </div>

                          <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded text-xs font-semibold">
                            {p.stock}
                          </span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </>
              )}
            </CommandList>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/50">
                <span className="text-xs text-muted-foreground">
                  {(pagination.p_page - 1) * pagination.p_size + 1}-
                  {Math.min(
                    pagination.p_page * pagination.p_size,
                    pagination.total
                  )}{" "}
                  de {pagination.total}
                </span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPageChange(pagination.p_page - 1);
                    }}
                    disabled={pagination.p_page <= 1 || isLoading}
                  >
                    Anterior
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPageChange(pagination.p_page + 1);
                    }}
                    disabled={pagination.p_page >= totalPages || isLoading}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>


    </div>
  );
};

export default CMovementSelectProducts;
