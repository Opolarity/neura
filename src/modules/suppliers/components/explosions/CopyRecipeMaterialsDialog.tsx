import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { toast } from "@/shared/hooks/use-toast";
import { ComboboxOption, EntityCombobox } from "../EntityCombobox";
import { explosionByIdApi, explosionsListApi } from "../../services/explosions.service";
import { ExplosionMaterial } from "../../types/explosions.types";

export type CopyMode = "replace" | "append";

interface CopyRecipeMaterialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** La receta que se edita: no se ofrece como origen. Null en una nueva. */
  currentId: number | null;
  /** Si la receta ya tiene materiales: se elige reemplazarlos o sumar. */
  hasLines: boolean;
  onCopy: (lines: ExplosionMaterial[], mode: CopyMode) => void;
}

const fmt = (value: number | null) =>
  value === null ? "—" : value.toLocaleString("es-PE", { maximumFractionDigits: 4 });

/**
 * Cargar los materiales de otra receta (2026-10-19): para el producto que
 * lleva lo mismo que otro con un material de más o uno distinto. Se copian el
 * material, su variación y la cantidad; las excepciones por talla no, porque
 * son tallas del otro producto. Luego se edita y se guarda como siempre.
 */
export const CopyRecipeMaterialsDialog = ({
  open,
  onOpenChange,
  currentId,
  hasLines,
  onCopy,
}: CopyRecipeMaterialsDialogProps) => {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 300);
  const [options, setOptions] = useState<ComboboxOption[]>([]);
  const [selected, setSelected] = useState<ComboboxOption | null>(null);
  const [source, setSource] = useState<ExplosionMaterial[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let vigente = true;
    explosionsListApi({ search: debounced || undefined, page: 1, size: 20 })
      .then((res) => {
        if (!vigente) return;
        setOptions(
          res.data
            .filter((r) => r.id !== currentId)
            .map((r) => {
              const nombre = r.productTitle ?? r.description ?? `Receta #${r.id}`;
              const label = r.modelCode ? `${nombre} · ${r.modelCode}` : nombre;
              return { id: r.id, label, title: label };
            }),
        );
      })
      .catch(() => vigente && setOptions([]));
    return () => {
      vigente = false;
    };
  }, [open, debounced, currentId]);

  const elegir = async (option: ComboboxOption) => {
    setSelected(option);
    setSource(null);
    try {
      setLoading(true);
      const detalle = await explosionByIdApi(option.id);
      setSource(detalle.materials);
    } catch (error) {
      toast({ title: "No se pudo leer la receta: " + (error as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copiar = (mode: CopyMode) => {
    if (!source || source.length === 0) return;
    onCopy(source, mode);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Copiar materiales de otra receta</DialogTitle>
          <DialogDescription>
            Se copian el material, su variación y la cantidad. Las cantidades por talla no se copian:
            son tallas del otro producto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label>Receta de origen</Label>
          <EntityCombobox
            options={options}
            value={selected?.id ?? null}
            onSelect={(option) => void elegir(option)}
            search={search}
            onSearchChange={setSearch}
            placeholder="Elegir receta"
            searchPlaceholder="Buscar por producto o modelo..."
            fallbackLabel={selected?.label ?? null}
          />
        </div>

        {loading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando materiales...
          </p>
        )}
        {source && (
          source.length === 0 ? (
            <p className="text-sm text-muted-foreground">Esa receta no tiene materiales.</p>
          ) : (
            <div className="max-h-[40vh] overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {source.map((line, index) => (
                    <TableRow key={`${line.materialVariationId ?? line.materialId}-${index}`}>
                      <TableCell>{line.materialName}</TableCell>
                      <TableCell>{line.materialClassName ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {fmt(line.quantity)} {line.measurementUnit ?? ""}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        )}

        <DialogFooter className="flex gap-2 sm:justify-end">
          {hasLines ? (
            <>
              <Button variant="outline" disabled={!source?.length} onClick={() => copiar("append")}>
                Agregar a los actuales
              </Button>
              <Button disabled={!source?.length} onClick={() => copiar("replace")}>
                Reemplazar los actuales
              </Button>
            </>
          ) : (
            <Button disabled={!source?.length} onClick={() => copiar("replace")}>
              Copiar materiales
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
