import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { CreateTagPayload, EditTagPayload } from "@/modules/products/types/Tags.types";
import { slugify } from "@/shared/utils/slug";

const initialForm = { name: "", code: "" };
const initialErrors = { name: "", code: "" };

const validateField = (value: string): string => {
    if (!value) return "Campo obligatorio";
    if (!value.trim()) return "No puede contener solo espacios";
    return "";
};

interface UseTagsFormProps {
    open: boolean;
    editTag?: EditTagPayload;
    onCreateTag: (payload: CreateTagPayload) => Promise<void>;
    onEditTag?: (payload: EditTagPayload) => Promise<void>;
    onSuccess: () => void;
}

export const useTagsForm = ({ open, editTag, onCreateTag, onEditTag, onSuccess }: UseTagsFormProps) => {
    const isEditing = editTag !== undefined;

    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState(initialErrors);
    const isCodeEditedRef = useRef(false);

    useEffect(() => {
        if (open) {
            setForm(editTag ? { name: editTag.name, code: editTag.code } : initialForm);
            setErrors(initialErrors);
            isCodeEditedRef.current = false;
        }
    }, [open, editTag]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;

        if (id === "code") {
            isCodeEditedRef.current = true;
            const nextCode = slugify(value);
            setForm((prev) => ({ ...prev, code: nextCode }));
            setErrors((prev) => ({ ...prev, code: validateField(nextCode) }));
            return;
        }

        if (id === "name" && !isEditing && !isCodeEditedRef.current) {
            const nextCode = slugify(value);
            setForm((prev) => ({ ...prev, name: value, code: nextCode }));
            setErrors((prev) => ({ ...prev, name: validateField(value), code: validateField(nextCode) }));
            return;
        }

        setForm((prev) => ({ ...prev, [id]: value }));
        setErrors((prev) => ({ ...prev, [id]: validateField(value) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const fieldsToValidate = isEditing
            ? (["name"] as const)
            : (["name", "code"] as const);

        const newErrors = { ...initialErrors };
        let hasError = false;

        for (const field of fieldsToValidate) {
            const error = validateField(form[field]);
            if (error) {
                newErrors[field] = error;
                hasError = true;
            }
        }

        if (hasError) {
            setErrors(newErrors);
            return;
        }

        try {
            if (!isEditing) {
                await onCreateTag(form);
            } else if (editTag) {
                await onEditTag?.({ id: editTag.id, name: form.name, code: form.code });
            }
            onSuccess();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Error al guardar la etiqueta");
        }
    };

    return { form, errors, isEditing, handleChange, handleSubmit };
};
