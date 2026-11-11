import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronDown, Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  SYSTEM_PRINT_TEMPLATES,
  findSystemPrintTemplate,
} from "../constants/systemPrintTemplates";
import { cn } from "@/shared/utils/utils";
import { toast } from "@/shared/hooks/use-toast";
import { formatPaper } from "../utils/formatPaper";
import {
  PRINT_TEMPLATE_AREAS,
  type Imposition,
} from "../types/printTemplates.types";
import { DEFAULT_IMPOSITION, impositionOf } from "../editor/lib/imposition";
import { ImpositionFields } from "../editor/components/imposition-fields";
import { DesignSnapshotJob } from "../editor/print/design-snapshot-job";

/** La opción de «Medidas» que deja escribir el ancho y el alto. */
const CUSTOM_PAPER = "custom";

/** Un ancho o un alto escrito en «Personalizada», en mm. */
const PAPER_MM = z.coerce.number().min(10).max(1000);

const schema = z
  .object({
    title: z.string().trim().min(1, "El nombre es obligatorio"),
    systemCode: z.string().min(1, "Elige el documento"),
    paperPreset: z.string(),
    paperWidthMm: z.coerce.number(),
    paperHeightMm: z.coerce.number(),
    use: z.boolean(),
  })
  // El ancho y el alto solo se validan cuando se escriben («Personalizada»):
  // las plantillas de medida fija no los usan y los dejan en 0.
  .superRefine((values, ctx) => {
    if (values.paperPreset !== CUSTOM_PAPER) return;
    if (!findSystemPrintTemplate(values.systemCode)?.paperPresets?.length)
      return;
    for (const key of ["paperWidthMm", "paperHeightMm"] as const)
      if (!PAPER_MM.safeParse(values[key]).success)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: "Entre 10 y 1000 mm",
        });
  });

// Interfaz explícita: con la config de TS del proyecto, z.infer deja los
// campos opcionales.
export interface PrintTemplateFormValues {
  title: string;
  systemCode: string;
  /** Con medidas elegibles: el índice de la recomendada o «custom». */
  paperPreset: string;
  paperWidthMm: number;
  paperHeightMm: number;
  /** Si se pone en uso al crearla: el documento se imprime con ella. */
  use: boolean;
}

/**
 * Lo que se crea: su diseño de arranque (la plantilla del sistema con la
 * medida y la impresión elegidas, ya serializado) y si se pone en uso.
 */
export interface PrintTemplateCreateValues {
  title: string;
  systemCode: string;
  contentJson: Record<string, unknown>;
  use: boolean;
}

/** Lo elegido, mientras se arma su diseño (DesignSnapshotJob). */
interface PendingCreate {
  title: string;
  systemCode: string;
  paper: { widthMm: number; heightMm: number } | null;
  imposition: Imposition;
  use: boolean;
}

/** «1 columna · 1 copia», lo elegido en «Impresión» mientras está plegada. */
const impositionSummary = ({ columns, copies }: Imposition) =>
  `${columns} ${columns === 1 ? "columna" : "columnas"} · ${copies} ${
    copies === 1 ? "copia" : "copias"
  }`;

const EMPTY_VALUES: PrintTemplateFormValues = {
  title: "",
  systemCode: "",
  paperPreset: "0",
  paperWidthMm: 0,
  paperHeightMm: 0,
  use: true,
};

interface PrintTemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saving: boolean;
  onSave: (values: PrintTemplateCreateValues) => void;
  /** El documento con que arranca («Nueva plantilla» de un documento). */
  initialSystemCode?: string | null;
}

/**
 * Alta de una plantilla personalizada: su nombre y la plantilla del sistema
 * que personaliza. La hoja (medidas) es la de esa plantilla; si sus medidas
 * son elegibles (la etiqueta de envío), se elige una recomendada o una
 * personalizada, y después se cambia en la Hoja. También cómo se imprime
 * (columnas y copias), que después se cambia en «Impresión», en el editor.
 * Se crea con ese diseño ya guardado (content_json) y, con «Usar esta
 * plantilla» (marcada por defecto), queda en uso para su documento.
 */
export const PrintTemplateFormDialog = ({
  open,
  onOpenChange,
  saving,
  onSave,
  initialSystemCode,
}: PrintTemplateFormDialogProps) => {
  const form = useForm<PrintTemplateFormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (open)
      form.reset({ ...EMPTY_VALUES, systemCode: initialSystemCode ?? "" });
  }, [open, form, initialSystemCode]);

  const systemCode = useWatch({ control: form.control, name: "systemCode" });
  const paperPreset = useWatch({ control: form.control, name: "paperPreset" });
  const paperWidthMm = useWatch({
    control: form.control,
    name: "paperWidthMm",
  });
  const paperHeightMm = useWatch({
    control: form.control,
    name: "paperHeightMm",
  });
  const system = findSystemPrintTemplate(systemCode);
  const presets = system?.paperPresets ?? [];
  // Columnas y copias: fuera del formulario (no se validan con el esquema).
  const [imposition, setImposition] = useState<Imposition>(DEFAULT_IMPOSITION);
  // «Impresión» arranca plegada: casi siempre basta la de por defecto.
  const [printOpen, setPrintOpen] = useState(false);
  // Lo elegido, mientras se arma el diseño con que se crea.
  const [pending, setPending] = useState<PendingCreate | null>(null);
  useEffect(() => {
    if (open) {
      setPrintOpen(false);
      setPending(null);
    }
  }, [open]);

  // Otra plantilla del sistema: arranca con su primera medida recomendada y
  // su primer papel recomendado.
  useEffect(() => {
    const template = findSystemPrintTemplate(systemCode);
    const first = template?.paperPresets?.[0];
    form.setValue("paperPreset", "0");
    form.setValue("paperWidthMm", first?.widthMm ?? 0);
    form.setValue("paperHeightMm", first?.heightMm ?? 0);
    setImposition(template ? impositionOf(template) : DEFAULT_IMPOSITION);
  }, [systemCode, form, open]);

  // Primero se arma el diseño (DesignSnapshotJob) y con él se crea.
  const handleSubmit = (values: PrintTemplateFormValues) =>
    setPending({
      title: values.title.trim(),
      systemCode: values.systemCode,
      paper: presets.length
        ? {
            widthMm: Number(values.paperWidthMm),
            heightMm: Number(values.paperHeightMm),
          }
        : null,
      imposition,
      use: values.use,
    });

  const pendingSystem = pending
    ? findSystemPrintTemplate(pending.systemCode)
    : undefined;
  const busy = saving || pending !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Nueva plantilla</DialogTitle>
          <DialogDescription>
            Elige el documento que vas a diseñar: arranca con su plantilla del
            sistema.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="systemCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Documento</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Elige un documento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/* Por área, como el listado. */}
                      {PRINT_TEMPLATE_AREAS.map((area) => (
                        <SelectGroup key={area}>
                          <SelectLabel>{area}</SelectLabel>
                          {SYSTEM_PRINT_TEMPLATES.filter(
                            (template) => template.area === area,
                          ).map((template) => (
                            <SelectItem
                              key={template.code}
                              value={template.code}
                            >
                              {template.section}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                  {system && !presets.length && (
                    <p className="text-[12px] text-muted-foreground">
                      Hoja de{" "}
                      {formatPaper(
                        system.paperWidthMm,
                        system.paperHeightMm,
                        system.multiPage,
                      )}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {presets.length > 0 && (
              <FormField
                control={form.control}
                name="paperPreset"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Medidas</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        const preset = presets[Number(value)];
                        if (value !== CUSTOM_PAPER && preset) {
                          form.setValue("paperWidthMm", preset.widthMm);
                          form.setValue("paperHeightMm", preset.heightMm);
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {presets.map((preset, index) => (
                          <SelectItem key={preset.label} value={String(index)}>
                            {preset.label}
                            {index === 0 ? " (recomendada)" : ""}
                          </SelectItem>
                        ))}
                        <SelectItem value={CUSTOM_PAPER}>
                          Personalizada
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[12px] text-muted-foreground">
                      Las puedes cambiar después en la Hoja.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {presets.length > 0 && paperPreset === CUSTOM_PAPER && (
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="paperWidthMm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Ancho (mm)</FormLabel>
                      <FormControl>
                        <Input type="number" min={10} max={1000} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paperHeightMm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Alto (mm)</FormLabel>
                      <FormControl>
                        <Input type="number" min={10} max={1000} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {system && (
              <div className="flex flex-col rounded-md border border-border px-3 py-2">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 text-left"
                  onClick={() => setPrintOpen((value) => !value)}
                  aria-expanded={printOpen}
                >
                  <span className="flex-1">
                    <span className="block text-sm font-medium">Impresión</span>
                    <span className="block text-[12px] text-muted-foreground">
                      {printOpen
                        ? "Cómo se acomoda la hoja en el papel. La puedes cambiar después en el editor."
                        : impositionSummary(imposition)}
                    </span>
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                      printOpen && "rotate-180",
                    )}
                  />
                </button>
                {printOpen && (
                  <ImpositionFields
                    value={imposition}
                    onChange={setImposition}
                    presets={system.impositionPresets}
                    pageWidthMm={
                      presets.length
                        ? Number(paperWidthMm) || system.paperWidthMm
                        : system.paperWidthMm
                    }
                    pageHeightMm={
                      presets.length
                        ? Number(paperHeightMm) || system.paperHeightMm
                        : system.paperHeightMm
                    }
                    multiPage={system.multiPage ?? false}
                  />
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Nombre</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ej: Etiqueta de envío con logo"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="use"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                      className="mt-0.5"
                    />
                  </FormControl>
                  <div className="flex flex-col gap-0.5">
                    <FormLabel className="font-normal">
                      Usar esta plantilla
                    </FormLabel>
                    <p className="text-[12px] text-muted-foreground">
                      El documento se imprime con ella, en lugar de la que está
                      en uso ahora.
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear y diseñar
              </Button>
            </DialogFooter>
          </form>
        </Form>

        {/* El diseño con que se crea: se arma fuera de la vista. */}
        {pending && pendingSystem && (
          <DesignSnapshotJob
            key={pending.systemCode}
            system={pendingSystem}
            paper={pending.paper}
            imposition={pending.imposition}
            onDone={(contentJson) => {
              const { title, systemCode, use } = pending;
              setPending(null);
              onSave({ title, systemCode, contentJson, use });
            }}
            onError={(error) => {
              setPending(null);
              toast({
                title: "No se pudo armar el diseño de la plantilla",
                description: error instanceof Error ? error.message : undefined,
                variant: "destructive",
              });
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
