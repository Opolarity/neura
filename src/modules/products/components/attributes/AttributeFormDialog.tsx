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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { AttributeFormValues } from "../../types/Attributes.types";

const attributeSchema = z.object({
  code: z.string().min(1, "El código es obligatorio"),
  name: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().nullable().optional(),
});

type AttributeFormSchema = z.infer<typeof attributeSchema>;

interface AttributeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: AttributeFormValues | null;
  onSubmit: (data: AttributeFormValues) => Promise<void>;
  saving: boolean;
}

const AttributeFormDialog = ({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  saving,
}: AttributeFormDialogProps) => {
  const isEditing = !!initialData?.id;

  const form = useForm<AttributeFormSchema>({
    resolver: zodResolver(attributeSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          code: initialData.code || "",
          name: initialData.name || "",
          description: initialData.description || "",
        });
      } else {
        form.reset({
          code: "",
          name: "",
          description: "",
        });
      }
    }
  }, [open, initialData, form]);

  const handleSubmit = async (values: AttributeFormSchema) => {
    await onSubmit({
      id: initialData?.id,
      code: values.code,
      name: values.name,
      description: values.description,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Atributo" : "Nuevo Atributo"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los datos del atributo"
              : "Ingresa los datos para crear un nuevo atributo"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código *</FormLabel>
                  <FormControl>
                    <Input placeholder="ej: color" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input placeholder="ej: Color" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descripción del atributo (opcional)"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Guardar Cambios" : "Crear Atributo"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AttributeFormDialog;
