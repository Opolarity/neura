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

// Valor centinela del selector de proceso: Radix Select no admite "" como value.
const NO_GROUP = "none";

// El codigo es opcional en la BD (`code text` nullable), asi que aqui
// tampoco se exige -- a diferencia de Atributos, donde si es obligatorio.
const catalogSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  code: z.string().nullable().optional(),
  processGroupId: z.number().nullable().optional(),
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
  codePlaceholder?: string;
   /**
   * Solo procesos: grupos (etapas) disponibles. Si se pasa, aparece el selector
   * "Proceso" y este catálogo cuelga cada operación de un proceso. El de
   * grupos no lo pasa, así que el campo no se filtra a su pantalla.
   */
  groupOptions?: ProcessCatalogItem[];
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
  codePlaceholder = "ej: LAV",
  groupOptions,
}: ProcessCatalogFormDialogProps) => {
  const isEditing = !!item?.id;
  // Concordancia: "Nuevo Proceso" / "Nueva Operación".
  const o = isFeminine ? "a" : "o";
  const showGroup = Array.isArray(groupOptions);
  const availableGroups = groupOptions ?? [];

  const form = useForm<CatalogFormValues>({
    resolver: zodResolver(catalogSchema),
    defaultValues: { name: "", code: "", processGroupId: null },
  });

  // Al abrir se rehidrata el formulario: en edicion con los valores del
  // registro, en alta en blanco.
  useEffect(() => {
    if (!open) return;

    form.reset(
      item
        ? { name: item.name, code: item.code ?? "", processGroupId: item.processGroupId ?? null }
        : { name: "", code: "", processGroupId: null }
    );
  }, [open, item, form]);

  const handleSubmit = (values: CatalogFormValues) => {
    onSave({
      name: values.name.trim(),
      code: values.code?.trim() === "" ? null : values.code?.trim() ?? null,
      // Solo se manda en el catálogo de procesos; en grupos queda fuera.
      ...(showGroup ? { process_group_id: values.processGroupId ?? null } : {}),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Editar ${entityLabel}` : `Nuev${o} ${entityLabel}`}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Modifica los datos ${isFeminine ? "de la" : "del"} ${entityLabel.toLowerCase()}.`
              : `Registra un${o} nuev${o} ${entityLabel.toLowerCase()}.`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input placeholder={namePlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={codePlaceholder}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Solo en Operaciones: a qué PROCESO (etapa) pertenece. */}
            {showGroup && (
              <FormField
                control={form.control}
                name="processGroupId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proceso</FormLabel>
                    <Select
                      value={field.value ? String(field.value) : NO_GROUP}
                      onValueChange={(value) =>
                        field.onChange(value === NO_GROUP ? null : Number(value))
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sin proceso" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NO_GROUP}>Sin proceso</SelectItem>
                        {availableGroups.map((group) => (
                          <SelectItem key={group.id} value={String(group.id)}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                {isEditing ? "Guardar Cambios" : `Crear ${entityLabel}`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
