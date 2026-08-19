import { useEffect, useRef, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import type { CreateBrandPayload, EditBrandPayload } from "@/modules/products/types/Brands.types";
import { slugify } from "@/shared/utils/slug";

const initialForm = { name: "", code: "" };
const initialErrors = { name: "", code: "" };

const validateField = (value: string): string => {
    if (!value) return "Campo obligatorio";
    if (!value.trim()) return "No puede contener solo espacios";
    return "";
};

interface UseBrandsFormProps {
    open: boolean;
    editBrand?: EditBrandPayload;
    onCreateBrand: (payload: CreateBrandPayload) => Promise<void>;
    onEditBrand?: (payload: EditBrandPayload) => Promise<void>;
    onSuccess: () => void;
}

export const useBrandsForm = ({ open, editBrand, onCreateBrand, onEditBrand, onSuccess }: UseBrandsFormProps) => {
    const isEditing = editBrand !== undefined;

    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState(initialErrors);
    const isCodeEditedRef = useRef(false);

    useEffect(() => {
        if (open) {
            setForm(editBrand ? { name: editBrand.name, code: editBrand.code } : initialForm);
            setErrors(initialErrors);
            isCodeEditedRef.current = false;
        }
    }, [open, editBrand]);

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
                await onCreateBrand(form);
            } else if (editBrand) {
                await onEditBrand?.({ id: editBrand.id, name: form.name, code: form.code });
            }
            onSuccess();
        } catch (err) {
            toast({
              title: err instanceof Error ? err.message : "Error al guardar la marca",
              variant: "destructive",
            });
        }
    };

    return { form, errors, isEditing, handleChange, handleSubmit };
};
