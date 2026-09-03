import { useMemo, useState } from "react";
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
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { FranchiseCategory } from "../../types/FranchiseStock.types";

interface FranchiseCategoryFilterProps {
  categories: FranchiseCategory[];
  selected: number[];
  onChange: (ids: number[]) => void;
}

/**
 * Combobox multiselect de categorías del franquiciado.
 *
 * Mismo lenguaje visual que `shared/components/category-selector` (Popover +
 * Command + Check), pero sin su capa de datos: aquí las categorías ya vienen en
 * la respuesta del stock, así que el buscador filtra en memoria y no hay fetch,
 * paginación ni scroll infinito. Aquel carga las categorías de Overtake; estas
 * son las del franquiciado y cambian con cada uno.
 *
 * Las hijas se listan indentadas bajo su padre. Marcar un padre NO marca a las
 * hijas: la expansión la hace el SP, que incluye los descendientes al filtrar.
 * Se avisa en el pie para que no parezca que falta algo.
 */
export default function FranchiseCategoryFilter({
  categories,
  selected,
  onChange,
}: FranchiseCategoryFilterProps) {
  const [open, setOpen] = useState(false);

  // Raíces ordenadas, cada una seguida de sus hijas. Las huérfanas (con un
  // padre que no está en la lista) se tratan como raíz para que no desaparezcan.
  const ordered = useMemo(() => {
    const byId = new Set(categories.map((c) => c.id));
    const roots = categories.filter(
      (c) => c.parentId === null || !byId.has(c.parentId),
    );
    const childrenOf = (id: number) =>
      categories.filter((c) => c.parentId === id);

    return roots.flatMap((root) => [
      { category: root, depth: 0 },
      ...childrenOf(root.id).map((child) => ({ category: child, depth: 1 })),
    ]);
  }, [categories]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const toggle = (id: number) => {
    onChange(
      selectedSet.has(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id],
    );
  };

  const label = useMemo(() => {
    if (selected.length === 0) return "Todas las categorías";
    if (selected.length === 1) {
      return (
        categories.find((c) => c.id === selected[0])?.name ?? "1 categoría"
      );
    }
    return `${selected.length} categorías`;
  }, [selected, categories]);

  // ¿Hay algún padre marcado que tenga hijas? Solo entonces el aviso de que se
  // incluyen subcategorías aporta algo.
  const incluyeSubcategorias = useMemo(
    () =>
      selected.some((id) => categories.some((c) => c.parentId === id)),
    [selected, categories],
  );

  const sinCategorias = categories.length === 0;

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={sinCategorias}
            className={cn(
              "w-full justify-between font-normal",
              selected.length === 0 && "text-muted-foreground",
            )}
          >
            <span className="truncate">
              {sinCategorias ? "Sin categorías registradas" : label}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Buscar categoría..." />
            <CommandList>
              <CommandEmpty>No se encontraron categorías.</CommandEmpty>
              <CommandGroup>
                {ordered.map(({ category, depth }) => (
                  <CommandItem
                    key={category.id}
                    // Los nombres son únicos por franquiciado (índice UNIQUE en
                    // la BD), así que sirven de value para el buscador.
                    value={category.name}
                    onSelect={() => toggle(category.id)}
                    className="cursor-pointer"
                    style={{
                      paddingLeft: depth ? `${depth * 1.25 + 0.5}rem` : undefined,
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedSet.has(category.id)
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    <span className={depth ? "text-muted-foreground" : undefined}>
                      {category.name}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {!sinCategorias && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {selected.length === 0
              ? "Se muestran todas"
              : `${selected.length} seleccionada${selected.length === 1 ? "" : "s"}`}
            {incluyeSubcategorias && " · incluye subcategorías"}
          </p>
          {selected.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-0.5 text-xs"
              onClick={() => onChange([])}
            >
              Quitar
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
