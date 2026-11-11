import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  ProcessCatalogItem,
  SaveProcessCatalogData,
} from "../../types/processes.types";

// Valor centinela del selector de operación padre: Radix Select no admite ""
// como value.
const NO_PARENT = "none";

// Sin código (2026-10-30): el backend lo arma a partir del nombre, en
// operaciones y bloques igual que en Procesos.
const catalogSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  parentProcessId: z.number().nullable().optional(),
  // El catálogo solo lleva nombre y bloque: lo que se paga se pone en el
  // encargo al proveedor.
});

type CatalogFormValues = z.infer<typeof catalogSchema>;

interface ProcessCatalogFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si se pasa, el modal funciona en modo edición. */
  item?: ProcessCatalogItem | null;
  saving: boolean;
  onSave: (values: SaveProcessCatalogData) => void;
  /** "Proceso" / "Operación". */
  entityLabel: string;
  /** Concordancia de los textos: "Nueva Operación" en vez de "Nuevo". */
  isFeminine?: boolean;
  namePlaceholder?: string;
  /**
   * Solo operaciones: las que pueden ser OPERACIÓN PADRE (las que no cuelgan
   * de otra). Si se pasa, aparecen «Operación padre» y el tiempo estándar. El
   * catálogo de Procesos no lo pasa.
   */
  parentOptions?: Array<Pick<ProcessCatalogItem, "id" | "name" | "parentProcessId">>;
  /** Alta de una operación desde un bloque (2026-10-19): nace con ese padre elegido. */
  defaultParentId?: number | null;
  /**
   * Catálogo de Operaciones (2026-10-19): «block» = un BLOQUE (operación padre,
   * sin padre propio); «operation» = una operación que DEBE ir en un bloque.
   * Sin él, el padre es opcional como antes (receta, ruta de la OP).
   */
  mode?: "block" | "operation";
}

export const ProcessCatalogFormDialog = ({
  open,
  onOpenChange,
  item = null,
  saving,
  onSave,
  entityLabel,
  isFeminine = false,
  namePlaceholder = "ej: Lavado",
  parentOptions,
  defaultParentId = null,
  mode,
}: ProcessCatalogFormDialogProps) => {
  const isEditing = !!item?.id;
  // Un bloque no elige padre: es el padre.
  const showOperationFields = Array.isArray(parentOptions) && mode !== "block";
  const parentRequired = mode === "operation";
  // Concordancia y textos según lo que se crea: «Nuevo Proceso», «Nueva
  // Operación» o «Nuevo Bloque de operación».
  const label = mode === "block" ? "Bloque de operación" : entityLabel;
  const genero = mode === "block" ? "o" : isFeminine ? "a" : "o";
  // Un solo nivel: una operación no es su propio padre, y una que ya agrupa a
  // otras no puede colgar de nadie (el SP lo rechaza igual).
  const availableParents = (parentOptions ?? []).filter(
    (parent) => parent.id !== item?.id && parent.parentProcessId === null
  );
  const agrupaOtras = (item?.childrenCount ?? 0) > 0;

  const form = useForm<CatalogFormValues>({
    resolver: zodResolver(catalogSchema),
    defaultValues: { name: "", parentProcessId: null },
  });

  // Al abrir se rehidrata el formulario: en edicion con los valores del
  // registro, en alta en blanco.
  useEffect(() => {
    if (!open) return;

    form.reset(
      item
        ? {
            name: item.name,
            parentProcessId: item.parentProcessId ?? null,
          }
        : { name: "", parentProcessId: defaultParentId }
    );
  }, [open, item, form, defaultParentId]);

  const handleSubmit = (values: CatalogFormValues) => {
    if (parentRequired && !values.parentProcessId) {
      form.setError("parentProcessId", { message: "Elige el bloque al que pertenece" });
      return;
    }
    onSave({
      name: values.name.trim(),
      // El código lo pone el backend a partir del nombre; al editar se conserva.
      code: null,
      // Solo se manda en el catálogo de operaciones; en Procesos queda fuera.
      ...(showOperationFields
        ? {
            // null al editar le quita el padre.
            parent_process_id: values.parentProcessId ?? null,
          }
        : mode === "block"
          ? { parent_process_id: null }
          : {}),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Editar ${label}` : `Nuev${genero} ${label}`}
          </DialogTitle>
          <DialogDescription>
            {mode === "block"
              ? "Agrupa operaciones (ej.: Ensamble, Cuello). Puede ir completo en la ruta o con sus operaciones."
              : isEditing
                ? `Modifica los datos ${genero === "a" ? "de la" : "del"} ${label.toLowerCase()}.`
                : `Registra un${genero === "a" ? "a" : ""} nuev${genero} ${label.toLowerCase()}.`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder={namePlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Solo en Operaciones: el BLOQUE que la agrupa. Desde la receta es
                opcional, pero se llama igual que en el catálogo. */}
            {showOperationFields && (
              <FormField
                control={form.control}
                name="parentProcessId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required={parentRequired}>Bloque</FormLabel>
                    <Select
                      value={field.value ? String(field.value) : NO_PARENT}
                      onValueChange={(value) =>
                        field.onChange(value === NO_PARENT ? null : Number(value))
                      }
                      disabled={agrupaOtras}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={parentRequired ? "Elige el bloque" : "Sin bloque"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {!parentRequired && <SelectItem value={NO_PARENT}>Sin bloque</SelectItem>}
                        {availableParents.map((parent) => (
                          <SelectItem key={parent.id} value={String(parent.id)}>
                            {parent.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {agrupaOtras
                        ? "Esta operación es un bloque: no puede pertenecer a otro."
                        : parentRequired
                          ? availableParents.length === 0
                            ? "Aún no hay bloques: crea uno con «Nuevo bloque»."
                            : "El bloque al que pertenece (ej.: Ensamble)."
                          : "Opcional. El bloque al que pertenece (ej.: Ensamble)."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Guardar Cambios" : `Crear ${label}`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
