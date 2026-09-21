import { useEffect, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { Supplier, SupplierClass } from "../types/suppliers.types";
import {
  supplierClassesApi,
  createSupplierClassOptionApi,
  setSupplierClassesApi,
  updateSupplierProfileApi,
} from "../services/suppliers.service";

interface UseEditSupplierOptions {
  supplier: Supplier;
  onSaved: () => void;
}

/**
 * Edición de un proveedor ya creado: contacto y clases.
 *
 * El nombre y el documento no se tocan — son de `accounts`, que esa misma
 * cuenta puede compartir con un cliente o un usuario del ERP.
 */
export const useEditSupplier = ({ supplier, onSaved }: UseEditSupplierOptions) => {
  const [classes, setClasses] = useState<SupplierClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  const [form, setForm] = useState({
    phone: supplier.phone ? String(supplier.phone) : "",
    email: supplier.email ?? "",
    address: supplier.address ?? "",
  });

  // Las clases que ya tiene vienen en el listado: `sp_get_suppliers` manda id y
  // nombre, así que el modal abre con ellas marcadas sin pedir nada más.
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>(
    supplier.classes.map((cls) => cls.id)
  );
  const [creatingClass, setCreatingClass] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadClasses = async () => {
      try {
        setClasses(await supplierClassesApi());
      } catch (error: any) {
        toast({ title: "Error al cargar las clases", variant: "destructive" });
      } finally {
        setLoadingClasses(false);
      }
    };
    loadClasses();
  }, []);

  const toggleClass = (classId: number) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  const handleCreateClass = async (name: string) => {
    try {
      setCreatingClass(true);
      const created = await createSupplierClassOptionApi(name);
      setClasses(await supplierClassesApi());
      setSelectedClassIds((prev) => [...prev, created.id]);
      toast({ title: `Clase "${created.name}" creada`, variant: "success" });
    } catch (error: any) {
      toast({ title: "Error al crear clase: " + error.message, variant: "destructive" });
    } finally {
      setCreatingClass(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.phone) {
      toast({ title: "El teléfono es obligatorio", variant: "destructive" });
      return;
    }
    // Un proveedor sin clases rompe el alta de servicios: sp_create_supplier_service
    // deduce la clase del servicio de la del proveedor cuando tiene una sola.
    if (selectedClassIds.length === 0) {
      toast({ title: "El proveedor debe tener al menos una clase", variant: "destructive" });
      return;
    }

    try {
      setSubmitting(true);

      // Dos llamadas, las dos idempotentes: si la segunda falla, repetir el
      // guardado deja lo mismo que si hubiera ido a la primera.
      await updateSupplierProfileApi(supplier.id, {
        phone: parseInt(form.phone),
        email: form.email || undefined,
        address: form.address || undefined,
      });
      await setSupplierClassesApi(supplier.id, selectedClassIds);

      toast({ title: "Proveedor actualizado", variant: "success" });
      onSaved();
    } catch (error: any) {
      toast({
        title: "Error al actualizar proveedor: " + error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    classes,
    loadingClasses,
    form,
    setForm,
    selectedClassIds,
    toggleClass,
    creatingClass,
    handleCreateClass,
    submitting,
    handleSubmit,
  };
};
