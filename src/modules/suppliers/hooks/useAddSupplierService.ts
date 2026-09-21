import { useState, useEffect } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { useDebounce } from "@/shared/hooks/useDebounce";
import {
  MaterialOption,
  QuotationOption,
  SupplierClassOption,
  SupplierService,
} from "../types/services.types";
import {
  materialOptionsApi,
  quotationOptionsApi,
  supplierClassesApi,
  updateSupplierServiceApi,
} from "../services/supplierServices.service";
import { materialClassesApi } from "../services/materials.service";
import { MaterialClass } from "../types/materials.types";
import {
  MaterialLinkValue,
  materialLinkError,
  materialLinkFromExisting,
  materialLinkPayload,
} from "../types/materialLink.types";

interface UseAddSupplierServiceOptions {
  /** Servicio a editar. La creación de servicios vive en Cotizaciones. */
  service: SupplierService;
  /** Se ejecuta tras actualizar el servicio. */
  onSuccess?: () => void;
}

export const useAddSupplierService = ({
  service,
  onSuccess,
}: UseAddSupplierServiceOptions) => {
  const [quotations, setQuotations] = useState<QuotationOption[]>([]);
  const [materials, setMaterials] = useState<MaterialOption[]>([]);
  const [classes, setClasses] = useState<SupplierClassOption[]>([]);
  const [materialClasses, setMaterialClasses] = useState<MaterialClass[]>([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  const [form, setForm] = useState({
    description: service.description,
    supplier_quotation_id: service.supplierQuotationId.toString(),
    supplier_class_id: service.supplierClassId.toString(),
  });

  const [materialLink, setMaterialLink] = useState<MaterialLinkValue>(() =>
    materialLinkFromExisting(
      service.materialId,
      service.materialName,
      service.materialMeasurementUnit
    )
  );

  const [quotationSearchOpen, setQuotationSearchOpen] = useState(false);
  const [quotationSearch, setQuotationSearch] = useState("");

  const [materialSearchOpen, setMaterialSearchOpen] = useState(false);
  const [materialSearch, setMaterialSearch] = useState("");

  const [classSearchOpen, setClassSearchOpen] = useState(false);
  const [classSearch, setClassSearch] = useState("");

  const [materialClassSearch, setMaterialClassSearch] = useState("");

  const [submitting, setSubmitting] = useState(false);

  // Cotizaciones y materiales se buscan en el servidor: pueden ser miles y
  // traer solo las primeras 100 para filtrar en cliente ocultaria opciones
  // en silencio. Las clases de proveedor si son un catalogo corto y local.
  const debouncedQuotationSearch = useDebounce(quotationSearch, 300);
  const debouncedMaterialSearch = useDebounce(materialSearch, 300);

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        setLoadingCatalogs(true);
        const [quotationList, materialList, classList, materialClassList] =
          await Promise.all([
            quotationOptionsApi(),
            materialOptionsApi(),
            supplierClassesApi(),
            materialClassesApi(),
          ]);
        setQuotations(quotationList);
        setMaterials(materialList);
        setClasses(classList);
        setMaterialClasses(materialClassList);
      } catch (error: any) {
        toast({ title: "Error al cargar datos iniciales", variant: "destructive" });
      } finally {
        setLoadingCatalogs(false);
      }
    };
    loadCatalogs();
  }, []);

  useEffect(() => {
    // La carga inicial ya trajo la primera pagina sin filtro.
    if (debouncedQuotationSearch === "") return;

    quotationOptionsApi(debouncedQuotationSearch)
      .then(setQuotations)
      .catch(() => toast({ title: "Error al buscar cotizaciones", variant: "destructive" }));
  }, [debouncedQuotationSearch]);

  useEffect(() => {
    if (debouncedMaterialSearch === "") return;

    materialOptionsApi(debouncedMaterialSearch)
      .then(setMaterials)
      .catch(() => toast({ title: "Error al buscar materiales", variant: "destructive" }));
  }, [debouncedMaterialSearch]);

  const setField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.description.trim()) {
      toast({ title: "La descripción es obligatoria", variant: "destructive" });
      return;
    }
    if (!form.supplier_quotation_id) {
      toast({ title: "La cotización de proveedor es obligatoria", variant: "destructive" });
      return;
    }
    if (!form.supplier_class_id) {
      toast({ title: "La clase de proveedor es obligatoria", variant: "destructive" });
      return;
    }

    const linkError = materialLinkError(materialLink);
    if (linkError) {
      toast({ title: linkError, variant: "destructive" });
      return;
    }

    try {
      setSubmitting(true);

      // El material se puede desasignar: si el checkbox quedó destildado y
      // el servicio tenía uno, hay que pedir el borrado explícitamente.
      const clearMaterial = !materialLink.linked && service.materialId !== null;

      await updateSupplierServiceApi({
        id: service.id,
        description: form.description.trim(),
        supplier_quotation_id: parseInt(form.supplier_quotation_id),
        supplier_class_id: parseInt(form.supplier_class_id),
        ...materialLinkPayload(materialLink),
        clear_material: clearMaterial,
      });
      toast({ title: "Servicio actualizado exitosamente", variant: "success" });

      onSuccess?.();
    } catch (error: any) {
      toast({ title: "Error al actualizar servicio: " + error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedQuotationLabel =
    quotations.find((q) => q.id.toString() === form.supplier_quotation_id)?.label ??
    `#${service.supplierQuotationId} · ${service.quotationDescription}`;

  const selectedClassName =
    classes.find((c) => c.id.toString() === form.supplier_class_id)?.name ??
    service.supplierClassName ??
    "";

  const handleMaterialCreated = (material: MaterialOption) => {
    setMaterials((prev) => [material, ...prev]);
  };

  return {
    quotations,
    materials,
    materialClasses,
    classes,
    loadingCatalogs,
    form,
    setField,
    materialLink,
    setMaterialLink,
    handleMaterialCreated,
    selectedQuotationLabel,
    selectedClassName,
    quotationSearchOpen,
    setQuotationSearchOpen,
    quotationSearch,
    setQuotationSearch,
    materialSearchOpen,
    setMaterialSearchOpen,
    materialSearch,
    setMaterialSearch,
    materialClassSearch,
    setMaterialClassSearch,
    classSearchOpen,
    setClassSearchOpen,
    classSearch,
    setClassSearch,
    submitting,
    handleSubmit,
  };
};
