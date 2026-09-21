import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "@/shared/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { EntityCombobox } from "../EntityCombobox";
import { AddMaterialModal } from "../materials/AddMaterialModal";
import {
  createExplosionApi,
} from "../../services/explosions.service";
import { materialOptionsApi } from "../../services/supplierServices.service";
import { MaterialOption } from "../../types/services.types";
import { ExplosionOption } from "../../types/productionOrders.types";

/** Línea de material mientras se edita en el diálogo. */
interface DraftLine {
  materialId: number;
  materialName: string;
  measurementUnit: string | null;
  unitCost: number | null;
  quantity: string;
}

const emptyLine = (): DraftLine => ({
  materialId: 0,
  materialName: "",
  measurementUnit: null,
  unitCost: null,
  quantity: "",
});

interface ExplosionQuickCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Nombre de la prenda del ítem. Ya no se teclea en ningún sitio: la
   * descripción de la receta la compone el backend con las prendas que cubre.
   * Se usa solo para nombrarla en el acto al volver, sin ir a leerla; la
   * siguiente recarga trae la de verdad, que sale de la misma prenda.
   */
  suggestedDescription?: string;
  /**
   * La prenda del ítem. La receta nace ya vinculada a ella, que es el motivo
   * de crearla desde aquí: hasta ahora el vínculo solo quedaba en el texto de
   * la descripción.
   */
  variationId?: number | null;
  /** La explosión recién creada, para que el padre la asigne al ítem. */
  onCreated: (explosion: ExplosionOption) => void;
}

/**
 * Alta de explosión sin salir de la orden de producción.
 *
 * Es la misma `create-explosion` de la pantalla de explosiones: interrumpir
 * el armado de la orden para ir a crearla y volver era el único motivo por el
 * que había que salir de aquí. Al guardar queda asignada al ítem.
 *
 * Solo pide lo imprescindible — tipo, descripción y líneas de material. Para
 * editarla después se sigue usando la pantalla de explosiones.
 */
export const ExplosionQuickCreateDialog = ({
  open,
  onOpenChange,
  suggestedDescription,
  variationId,
  onCreated,
}: ExplosionQuickCreateDialogProps) => {
  const [materials, setMaterials] = useState<MaterialOption[]>([]);
  const [saving, setSaving] = useState(false);
  /** Código del molde de la receta que nace aquí. */
  const [modelCode, setModelCode] = useState("");

  const [lines, setLines] = useState<DraftLine[]>([emptyLine()]);

  const [materialSearch, setMaterialSearch] = useState("");
  /** Línea desde la que se abrió el alta de material, o null. */
  const [creatingMaterialFor, setCreatingMaterialFor] = useState<number | null>(
    null
  );
  const debouncedMaterialSearch = useDebounce(materialSearch, 300);

  // El diálogo se monta al abrirse, así que los catálogos se piden una vez.
  useEffect(() => {
    if (!open) return;

    setLines([emptyLine()]);
    setModelCode("");

    materialOptionsApi()
      .then(setMaterials)
      .catch(() => toast({ title: "Error al cargar los materiales", variant: "destructive" }));
  }, [open, suggestedDescription]);

  // Los materiales pueden ser miles: la búsqueda es del servidor.
  useEffect(() => {
    if (debouncedMaterialSearch === "") return;

    materialOptionsApi(debouncedMaterialSearch)
      .then(setMaterials)
      .catch(() => toast({ title: "Error al buscar materiales", variant: "destructive" }));
  }, [debouncedMaterialSearch]);

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);

  const removeLine = (index: number) =>
    setLines((prev) => prev.filter((_, i) => i !== index));

  // Se copian costo y unidad del material para poder mostrar el total en vivo
  // sin volver a consultar. El total que manda es el que calcula el backend.
  const setLineMaterial = (index: number, material: MaterialOption) => {
    setLines((prev) =>
      prev.map((line, i) =>
        i === index
          ? {
              ...line,
              materialId: material.id,
              materialName: material.name,
              unitCost: material.unitCost,
              measurementUnit: material.measurementUnit,
            }
          : line
      )
    );
  };

  const setLineQuantity = (index: number, value: string) =>
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, quantity: value } : line))
    );

  const previewTotal = lines.reduce(
    (sum, line) => sum + Number(line.quantity || 0) * (line.unitCost ?? 0),
    0
  );

  const handleSave = async () => {
    // Las líneas en blanco se descartan: la de cortesía que abre el diálogo no
    // debería obligar a elegir un material para poder guardar.
    const filled = lines.filter((line) => line.materialId);
    if (filled.length === 0) {
      toast({ title: "Añade al menos un material", variant: "destructive" });
      return;
    }
    if (filled.some((line) => !line.quantity.trim())) {
      toast({ title: "Hay materiales sin cantidad", variant: "destructive" });
      return;
    }
    if (filled.some((line) => isNaN(Number(line.quantity)))) {
      toast({ title: "Hay cantidades no numéricas", variant: "destructive" });
      return;
    }

    try {
      setSaving(true);
      const id = await createExplosionApi({
        // Sin descripcion: la compone el backend con la prenda que cubre.
        model_code: modelCode.trim(),
        materials: filled.map((line) => ({
          material_id: line.materialId,
          quantity: Number(line.quantity),
        })),
        // La receta nace cubriendo la prenda del item. Podra cubrir mas desde
        // la pantalla de desarrollos.
        variation_ids: variationId ? [variationId] : [],
      });

      if (id === null) {
        // La explosión sí se creó; lo que falta es su id para asignarla.
        toast({
          title: "La explosión se creó pero no devolvió su id: selecciónala a mano",
          variant: "destructive",
        });
        onOpenChange(false);
        return;
      }

      toast({ title: "Explosión creada y asignada al ítem", variant: "success" });
      onCreated({
        id,
        label: suggestedDescription?.trim() || `Explosión #${id}`,
        variationIds: variationId ? [variationId] : [],
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Error al crear la explosión: " + error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nueva explosión</DialogTitle>
          <DialogDescription>
            Los materiales y cantidades que consume una unidad de esta prenda.
            Al guardar queda asignada al ítem.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="quick-explosion-model-code">Código de modelo</Label>
          <Input
            id="quick-explosion-model-code"
            value={modelCode}
            onChange={(e) => setModelCode(e.target.value)}
            placeholder="Ej: MOD-2026-014"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Materiales</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLine}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Añadir material
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead className="w-32 text-right">Cantidad</TableHead>
                <TableHead className="w-24">Unidad</TableHead>
                <TableHead className="w-32 text-right">Subtotal</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {/* `min-w-0` es lo que deja funcionar al `truncate` del
                        combobox: sin él el flex item se estira con el nombre
                        en vez de recortarlo y descuadra la fila. */}
                    <div className="flex min-w-0 gap-2">
                      <EntityCombobox
                        className="min-w-0 flex-1"
                        options={materials.map((m) => ({
                          id: m.id,
                          label: m.name,
                        }))}
                        value={line.materialId || null}
                        onSelect={(option) => {
                          const material = materials.find(
                            (m) => m.id === option.id
                          );
                          if (material) setLineMaterial(index, material);
                        }}
                        search={materialSearch}
                        onSearchChange={setMaterialSearch}
                        placeholder="Elegir material..."
                        searchPlaceholder="Buscar material..."
                        fallbackLabel={line.materialName || null}
                      />
                      {/* La receta se arma aquí para no abandonar la orden; si
                          además falta un material, salir a Materiales dejaba
                          esto a medias. */}
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        onClick={() => setCreatingMaterialFor(index)}
                        aria-label="Crear material para esta línea"
                        title="Crear material"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="text-right"
                      value={line.quantity}
                      onChange={(e) => setLineQuantity(index, e.target.value)}
                      placeholder="0"
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {line.measurementUnit ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {line.unitCost === null
                      ? "—"
                      : `S/ ${(
                          Number(line.quantity || 0) * line.unitCost
                        ).toFixed(2)}`}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLine(index)}
                      aria-label="Quitar material"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-end gap-4 pr-4 text-sm">
            <span className="text-muted-foreground">Total estimado</span>
            <span className="font-semibold tabular-nums">
              S/ {previewTotal.toFixed(2)}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              "Crear y asignar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
      {/* Encima del de la receta, que sigue abierto: Radix apila los overlays
          y devuelve el foco al cerrar. Cerrar el de receta para abrir este
          perdería lo tecleado, así que se apila.

          Se monta solo al abrirse, para que el formulario nazca limpio y no
          arrastre lo de un intento anterior que se canceló. */}
      {creatingMaterialFor !== null && (
        <AddMaterialModal
          open
          onOpenChange={(value) => {
            if (!value) setCreatingMaterialFor(null);
          }}
          onSaved={(created) => {
            if (!created) return;
            setMaterials((prev) =>
              prev.some((m) => m.id === created.id) ? prev : [...prev, created]
            );
            setLineMaterial(creatingMaterialFor, created);
            setCreatingMaterialFor(null);
          }}
        />
      )}
    </Dialog>
  );
};
