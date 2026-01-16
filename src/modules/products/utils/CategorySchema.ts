import { z } from "zod";

export const categorySchema = z.object({
    id: z.number().optional(),
    name: z.string().min(1, "El nombre es obligatorio"),
    description: z.string().nullable().optional(),
    parent_category: z.number().nullable().optional(),
    image: z.custom<File>((v) => v instanceof File || v === null || v === undefined, {
        message: "Debe ser un archivo válido",
    }).optional().nullable(),
    image_url: z.string().nullable().optional(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
