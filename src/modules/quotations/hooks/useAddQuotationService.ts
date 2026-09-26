import { useEffect, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { useDebounce } from "@/shared/hooks/useDebounce";
import {
  materialVariationLinkOptionsApi,
  supplierClassesApi,
} from "@/modules/suppliers/services/supplierServices.service";
import { materialClassesApi } from "@/modules/suppliers/services/materials.service";
import {
  MaterialOption,
  SupplierClassOption,
} from "@/modules/suppliers/types/services.types";
import { MaterialClass } from "@/modules/suppliers/types/materials.types";
import {
  MaterialLinkValue,
  emptyMaterialLink,
  materialLinkError,
  materialLinkPayload,
  materialLinkUnit,
} from "@/modules/suppliers/types/materialLink.types";
import { nextLineDescription } from "../utils/materialLineName";
import {
  ProductionOrderLinkValue,
  emptyProductionOrderLink,
  productionOrderLinkError,
  productionOrderLinkPayload,
} from "@/modules/suppliers/types/productionOrderLink.types";
import { productionOrdersListApi } from "@/modules/suppliers/services/productionOrders.service";
import { ProductionOrder } from "@/modules/suppliers/types/productionOrders.types";
import { addSupplierQuotationServiceApi } from "../services/Quotations.service";
import { QuotationServiceLine, ServiceTab } from "../types/Quotations.types";
import { toastError } from "@/shared/utils/toastError";

interface UseAddQuotationServiceOptions {
  /**
   * La cotización a la que se añade, o `null` cuando todavía no existe.
   *
   * Al crear desde cero las líneas se juntan en memoria y salen todas de golpe
   * con la cotización, así que no hay a qué añadirlas: en ese caso el guardado
   * entrega la línea a `onAddLine` en vez de llamar al servidor. Es la única
   * diferencia entre los dos modos -- el formulario y sus validaciones son los
   * mismos, que es lo que hace que una línea creada desde cero llegue con la
   * misma forma que una añadida a una cotización viva.
   */
  quotationId: number | null;
  /** Proveedor de la cotización, con el que se crea un material nuevo. */
  supplierId: number | null;
  /**
   * Qué se está dando de alta, según la pestaña desde la que se abrió. En
   * compra la línea nace apuntando a un material; en servicios nunca lleva
   * material y sí puede ir a una orden de producción.
   */
  kind?: ServiceTab;
  /** Solo en modo local: recibe la línea ya validada. */
  onAddLine?: (line: QuotationServiceLine) => void;
  onSuccess?: () => void;
}

const emptyForm = {
  description: "",
  supplier_class_id: "",
  quantity: "",
  price: "",
  /**
   * Si el precio ya lleva IGV. Vacío = todavía no se eligió, y no se deja
   * guardar así: el problema que esto viene a resolver es justamente que hasta
   * ahora se acumulaban precios de los que no se sabía nada.
   */
  price_includes_tax: "",
  measurement_unit: "",
  /** Cuando se espera el trabajo (date). */
  promised_date: "",
};

export const useAddQuotationService = ({
  quotationId,
  supplierId,
  kind = "SERVICE",
  onAddLine,
  onSuccess,
}: UseAddQuotationServiceOptions) => {
  const [classes, setClasses] = useState<SupplierClassOption[]>([]);
  const [materials, setMaterials] = useState<MaterialOption[]>([]);
  const [materialClasses, setMaterialClasses] = useState<MaterialClass[]>([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  const [form, setForm] = useState(emptyForm);
  // En compra el vínculo entra activo: una línea de compra ES un material.
  // Y con `linked` en true, materialLinkError() ya lo hace obligatorio al
  // guardar, sin necesidad de una validación aparte.
  const [materialLink, setMaterialLink] = useState<MaterialLinkValue>(() =>
    kind === "MATERIAL"
      ? { ...emptyMaterialLink(), linked: true }
      : emptyMaterialLink()
  );
  const [productionOrderLink, setProductionOrderLink] =
    useState<ProductionOrderLinkValue>(emptyProductionOrderLink());

  // El diálogo puede seguir montado al cambiar de pestaña, y entonces el
  // estado inicial de arriba ya no se recalcula: pasar de Servicios a Compra
  // dejaría la línea sin material. Al revés, volver a Servicios lo limpia.
  useEffect(() => {
    setMaterialLink((prev) =>
      kind === "MATERIAL"
        ? prev.linked
          ? prev
          : { ...prev, linked: true }
        : emptyMaterialLink()
    );
  }, [kind]);

  const [classSearch, setClassSearch] = useState("");
  const [materialSearch, setMaterialSearch] = useState("");
  const [materialClassSearch, setMaterialClassSearch] = useState("");
  const debouncedMaterialSearch = useDebounce(materialSearch, 300);

  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [productionOrderSearch, setProductionOrderSearch] = useState("");
  const debouncedProductionOrderSearch = useDebounce(productionOrderSearch, 300);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        setLoadingCatalogs(true);
        const [classList, materialList, materialClassList] = await Promise.all([
          supplierClassesApi(),
          materialVariationLinkOptionsApi(),
          materialClassesApi(),
        ]);
        setClasses(classList);
        setMaterials(materialList);
        setMaterialClasses(materialClassList);
      } catch (error: any) {
        toastError(error, "Error al cargar datos iniciales");
      } finally {
        setLoadingCatalogs(false);
      }
    };
    loadCatalogs();
  }, []);

  useEffect(() => {
    if (debouncedMaterialSearch === "") return;
    materialVariationLinkOptionsApi(debouncedMaterialSearch)
      .then(setMaterials)
      .catch(() => toast({ title: "Error al buscar materiales", variant: "destructive" }));
  }, [debouncedMaterialSearch]);

  useEffect(() => {
    if (debouncedProductionOrderSearch.trim() === "") {
      setProductionOrders([]);
      return;
    }
    productionOrdersListApi({ search: debouncedProductionOrderSearch, size: 20 })
      .then((result) => setProductionOrders(result.data))
      .catch(() => toast({ title: "Error al buscar ordenes de produccion", variant: "destructive" }));
  }, [debouncedProductionOrderSearch]);

  const setField = (field: keyof typeof emptyForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setMaterialLink(emptyMaterialLink());
    setProductionOrderLink(emptyProductionOrderLink());
  };

  const selectedClassName =
    classes.find((c) => c.id.toString() === form.supplier_class_id)?.name ?? "";

  const handleSubmit = async () => {
    if (!form.description.trim()) {
      toast({ title: "La descripción es obligatoria", variant: "destructive" });
      return;
    }
    if (!form.supplier_class_id) {
      toast({ title: "La clase de proveedor es obligatoria", variant: "destructive" });
      return;
    }
    if (form.quantity !== "" && isNaN(Number(form.quantity))) {
      toast({ title: "La cantidad debe ser numérica", variant: "destructive" });
      return;
    }
    if (form.price !== "" && isNaN(Number(form.price))) {
      toast({ title: "El precio debe ser numérico", variant: "destructive" });
      return;
    }
    // Obligatorio, y solo cuando hay precio: sin importe no hay nada que
    // declarar.
    if (form.price !== "" && form.price_includes_tax === "") {
      toast({
        title: "Indica si el precio incluye IGV",
        variant: "destructive",
      });
      return;
    }

    const linkError =
      materialLinkError(materialLink) ??
      productionOrderLinkError(productionOrderLink);
    if (linkError) {
      toast({ title: linkError, variant: "destructive" });
      return;
    }

    // Con material vinculado la unidad la define el material, no el campo.
    const unit = materialLinkUnit(materialLink) ?? form.measurement_unit.trim();

    // Con un SERVICIO vinculado a una orden la cantidad la deriva el backend de
    // las prendas que el servicio atraviesa: teclear un numero seria una
    // segunda fuente que la orden ya contradice. Una COMPRA vinculada no: la
    // orden es solo su procedencia y la cantidad la decide quien compra. Se
    // decide una vez y vale para los dos modos.
    const cantidadLaPoneLaOrden = kind === "SERVICE" && productionOrderLink.linked;
    const cantidad = cantidadLaPoneLaOrden
      ? null
      : form.quantity === ""
        ? null
        : Number(form.quantity);

    // `price` en la base es el TOTAL de la linea (asi lo dejo la migracion que
    // retiro unit_price, y asi lo leen los SPs y los papeles), pero el campo
    // pide el UNITARIO: viaja unitario × cantidad. Sin cantidad --orden
    // vinculada, o cantidad vacia-- no hay por que multiplicar y el campo ya
    // se rotula como total.
    const precio = (() => {
      if (form.price === "") return null;
      const tecleado = Number(form.price);
      if (cantidad === null) return tecleado;
      return Math.round(tecleado * cantidad * 100) / 100;
    })();

    // ---- Modo local: la cotizacion todavia no existe ----
    if (quotationId === null) {
      onAddLine?.({
        description: form.description.trim(),
        supplierClassId: parseInt(form.supplier_class_id),
        supplierClassName: selectedClassName,
        materialLink,
        productionOrderLink,
        quantity: cantidad,
        price: precio,
        priceIncludesTax:
          form.price_includes_tax === ""
            ? null
            : form.price_includes_tax === "true",
        measurementUnit: unit,
        promisedDate: form.promised_date || null,
      });
      resetForm();
      onSuccess?.();
      return;
    }

    try {
      setSubmitting(true);
      await addSupplierQuotationServiceApi({
        supplier_quotation_id: quotationId,
        description: form.description.trim(),
        supplier_class_id: parseInt(form.supplier_class_id),
        ...materialLinkPayload(materialLink),
        // Sin esto el servicio nace huérfano de orden: no hay otra pantalla
        // donde vincularlo después, y sin orden no entra en su costo.
        ...productionOrderLinkPayload(productionOrderLink),
        code: null,
        // En null solo para un servicio con orden: ahi no hay material y el
        // quantity de la situacion solo mueve stock y costo por la via del
        // material. Una compra siempre lleva su cantidad, con orden o sin ella:
        // el backend la guarda con production_order_id como procedencia y no
        // la mete en la ruta (trg_production_order_info_no_material).
        quantity: cantidad,
        price: precio,
        price_includes_tax:
          form.price_includes_tax === ""
            ? null
            : form.price_includes_tax === "true",
        measurement_unit: unit === "" ? null : unit,
        promised_date: form.promised_date || null,
      });
      toast({ title: "Servicio agregado exitosamente", variant: "success" });
      resetForm();
      onSuccess?.();
    } catch (error: any) {
      toastError(error, "Error al agregar servicio");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMaterialCreated = (material: MaterialOption) => {
    setMaterials((prev) => [material, ...prev]);
  };

  /**
   * Vincular un material también nombra la línea: el material ya dice cómo se
   * llama, y teclearlo otra vez era copiar un dato que estaba a la vista.
   * `nextLineDescription` no pisa lo que se haya escrito a mano.
   */
  const changeMaterialLink = (next: MaterialLinkValue) => {
    setForm((prev) => ({
      ...prev,
      description: nextLineDescription(prev.description, materialLink, next),
    }));
    setMaterialLink(next);
  };

  return {
    classes,
    materials,
    materialClasses,
    loadingCatalogs,
    form,
    setField,
    resetForm,
    materialLink,
    setMaterialLink: changeMaterialLink,
    productionOrderLink,
    setProductionOrderLink,
    productionOrders,
    productionOrderSearch,
    setProductionOrderSearch,
    supplierId,
    handleMaterialCreated,
    selectedClassName,
    classSearch,
    setClassSearch,
    materialSearch,
    setMaterialSearch,
    materialClassSearch,
    setMaterialClassSearch,
    submitting,
    handleSubmit,
  };
};
