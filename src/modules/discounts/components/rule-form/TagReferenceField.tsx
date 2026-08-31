import { useMemo } from "react";
import { ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/shared/utils/utils";
import {
  useProductTagOptions,
  type ProductTagKind,
  type ProductTagOption,
} from "@/modules/products/hooks/useProductTagOptions";
import { usePriceRuleReferences } from "../../context/PriceRuleReferencesContext";
import { useReferenceSelection } from "../../hooks/useReferenceSelection";
import { RemovableChip } from "./RemovableChip";

interface TagReferenceFieldProps {
  /** "brand" persiste ids en brand_ids; "tag", en tag_ids. */
  kind: ProductTagKind;
  label: string;
  ids: number[];
  onChangeIds: (ids: number[]) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Campo de marcas/etiquetas de las reglas de precios: chips de lo elegido +
 * popover de búsqueda. Hermano de [CategoryReferenceField] y
 * [ProductReferenceField] — misma forma de seleccionar en condiciones,
 * acciones y exclusiones.
 *
 * A diferencia de productos y categorías, la lista completa cabe en memoria
 * (la tabla `tags` es corta), así que el popover no pagina ni busca contra el
 * backend: filtra sobre lo ya cargado.
 */
export const TagReferenceField = ({
  kind,
  label,
  ids,
  onChangeIds,
  placeholder,
  className,
}: TagReferenceFieldProps) => {
  const { options, loading } = useProductTagOptions(kind);
  const references = usePriceRuleReferences();

  // Nombres para pintar los chips: primero lo que existe hoy en la tabla; si un
  // id ya no está (marca borrada tras guardar la regla), se cae a lo que
  // devolvió `references` en get-price-rule-details.
  const optionsById = useMemo(() => {
    const savedNames = kind === "brand" ? references.brands : references.tags;
    const map = savedNames.reduce<Record<number, ProductTagOption>>(
      (acc, reference) => {
        acc[reference.id] = { id: reference.id, name: reference.name, code: "" };
        return acc;
      },
      {},
    );
    options.forEach((option) => {
      map[option.id] = option;
    });
    return map;
  }, [kind, options, references]);

  const { selected, remember } = useReferenceSelection(ids, optionsById, (id) => ({
    id,
    name: kind === "brand" ? `Marca #${id}` : `Etiqueta #${id}`,
    code: "",
  }));

  const toggleId = (option: ProductTagOption) => {
    if (ids.includes(option.id)) {
      onChangeIds(ids.filter((current) => current !== option.id));
      return;
    }
    remember([option]);
    onChangeIds([...ids, option.id]);
  };

  const removeId = (id: number) => onChangeIds(ids.filter((current) => current !== id));

  const emptyText =
    kind === "brand" ? "No se encontraron marcas" : "No se encontraron etiquetas";
  const triggerText =
    placeholder ??
    (kind === "brand" ? "Seleccionar marcas..." : "Seleccionar etiquetas...");

  return (
    <div className={cn("space-y-1", className)}>
      <Label className="text-xs">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            className="w-full justify-between h-auto min-h-10 py-2 font-normal"
          >
            {selected.length > 0 ? (
              <span className="flex flex-wrap items-center gap-1">
                {selected.map((option) => (
                  <RemovableChip
                    key={option.id}
                    label={option.name}
                    onRemove={() => removeId(option.id)}
                  />
                ))}
              </span>
            ) : (
              <span className="text-muted-foreground">
                {loading ? "Cargando..." : triggerText}
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder={kind === "brand" ? "Buscar marca..." : "Buscar etiqueta..."}
            />
            <CommandList>
              <CommandEmpty>{loading ? "Cargando..." : emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={option.name}
                    onSelect={() => toggleId(option)}
                  >
                    <Checkbox checked={ids.includes(option.id)} className="mr-2" />
                    <span>{option.name}</span>
                    {option.code && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {option.code}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
