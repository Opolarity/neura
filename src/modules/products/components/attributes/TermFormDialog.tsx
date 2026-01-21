import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TermFormValues, TermGroupOption } from "../../types/Attributes.types";

const termSchema = z.object({
  term_group_id: z.number({
    required_error: "Debes seleccionar un grupo de atributo",
  }),
  name: z.string().min(1, "El nombre es obligatorio"),
});

type TermFormSchema = z.infer<typeof termSchema>;

interface TermFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: TermFormValues | null;
  termGroups: TermGroupOption[];
  onSubmit: (data: TermFormValues) => Promise<void>;
  saving: boolean;
}

const TermFormDialog = ({
  open,
  onOpenChange,
  initialData,
  termGroups,
  onSubmit,
  saving,
}: TermFormDialogProps) => {
  const form = useForm<TermFormSchema>({
    resolver: zodResolver(termSchema),
    defaultValues: {
      term_group_id: initialData?.term_group_id ?? undefined,
      name: initialData?.name ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        term_group_id: initialData?.term_group_id ?? undefined,
        name: initialData?.name ?? "",
      });
    }
  }, [open, initialData, form]);

  const handleSubmit = async (values: TermFormSchema) => {
    await onSubmit({
      id: initialData?.id,
      name: values.name,
      term_group_id: values.term_group_id,
    });
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {initialData?.id ? "Editar Término" : "Añadir Término"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="term_group_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grupo de Atributo *</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar grupo..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {termGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <Input placeholder="ej: Rojo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TermFormDialog;
