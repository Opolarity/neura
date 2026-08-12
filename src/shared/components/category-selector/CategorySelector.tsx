import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, Image as ImageIcon, Loader2, Search, X } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { fetchCategories } from "./CategorySelector.service";
import { categoriesFromApiAdapter } from "./CategorySelector.adapter";
import type { CategoryOption } from "./CategorySelector.types";

interface CategorySelectorProps {
  selectedItems: CategoryOption[];
  onChangeItems: (items: CategoryOption[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

const PAGE_SIZE = 10;

/** Selector de categorías: búsqueda con popover, selección múltiple con chips. */
export default function CategorySelector({
  selectedItems,
  onChangeItems,
  disabled = false,
  placeholder = "Buscar categoría por nombre...",
}: CategorySelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, size: PAGE_SIZE, total: 0 });
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const hasLoadedRef = useRef(false);

  const totalPages = Math.ceil(pagination.total / pagination.size);

  const loadData = async (p: number, q: string) => {
    try {
      setLoading(true);
      const adapted = categoriesFromApiAdapter(
        await fetchCategories({ page: p, size: PAGE_SIZE, search: q || undefined }),
      );
      setCategories(adapted.data);
      setPagination(adapted.pagination);
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setLoading(false);
    }
  };

  // Carga solo la primera vez que se abre el popover.
  useEffect(() => {
    if (!open || hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    setPage(1);
    loadData(1, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Búsqueda debounced
  useEffect(() => {
    if (!hasLoadedRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      loadData(1, search);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    loadData(newPage, search);
  };

  const toggle = (category: CategoryOption) => {
    const exists = selectedItems.some((item) => item.id === category.id);
    onChangeItems(
      exists
        ? selectedItems.filter((item) => item.id !== category.id)
        : [...selectedItems, category],
    );
  };

  return (
    <div className="space-y-2">
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedItems.map((item) => (
            <Badge
              key={item.id}
              variant="secondary"
              className="text-xs font-normal gap-1 pr-1"
            >
              <span className="truncate max-w-[220px]">{item.name}</span>
              <button
                type="button"
                disabled={disabled}
                aria-label={`Quitar ${item.name}`}
                className="rounded-sm hover:bg-muted-foreground/20 disabled:opacity-50"
                onClick={() =>
                  onChangeItems(selectedItems.filter((s) => s.id !== item.id))
                }
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            disabled={disabled}
            className="w-full justify-start text-muted-foreground font-normal"
          >
            <Search className="w-4 h-4 mr-2" />
            {selectedItems.length > 0
              ? `${selectedItems.length} seleccionada${selectedItems.length === 1 ? "" : "s"}`
              : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[350px] p-0 bg-popover">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar categoría..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <CommandEmpty>No se encontraron categorías.</CommandEmpty>
                  <CommandGroup>
                    {categories.map((category) => (
                      <CommandItem
                        key={category.id}
                        value={category.name}
                        onSelect={() => toggle(category)}
                        className="flex items-center gap-2 py-2"
                      >
                        <Check
                          className={cn(
                            "h-4 w-4 shrink-0",
                            selectedItems.some((item) => item.id === category.id)
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted">
                          {category.imageUrl ? (
                            <img
                              src={category.imageUrl}
                              alt={category.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col min-w-0">
                          <span className="truncate">{category.name}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/50">
                <span className="text-xs text-muted-foreground">
                  {(page - 1) * pagination.size + 1}-
                  {Math.min(page * pagination.size, pagination.total)}{" "}
                  de {pagination.total}
                </span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1 || loading}
                  >
                    Anterior
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages || loading}
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
}
