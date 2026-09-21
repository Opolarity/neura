import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/shared/hooks/use-toast";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { supplierOptionsApi } from "@/modules/suppliers/services/materials.service";
import { SupplierOption } from "@/modules/suppliers/types/materials.types";
import {
  materialLinkError,
  materialLinkPayload,
  materialLinkUnit,
} from "@/modules/suppliers/types/materialLink.types";
import {
  productionOrderLinkError,
  productionOrderLinkPayload,
} from "@/modules/suppliers/types/productionOrderLink.types";
import { createSupplierQuotationApi } from "../services/Quotations.service";
import { QuotationServiceLine, ServiceTab } from "../types/Quotations.types";
import { toastError } from "@/shared/utils/toastError";


export const useNewQuotation = () => {
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [supplierName, setSupplierName] = useState("");
  /** El asunto: el título de la cotización. Obligatorio. */
  const [description, setDescription] = useState("");
  /**
   * Las notas, opcionales. Van a request_description y salen en las
   * Observaciones de la Orden de Compra y de la Orden de Servicio.
   */
  const [notes, setNotes] = useState("");
  /**
   * Lo pactado con el proveedor. La moneda rige TODOS los importes de los dos
   * papeles, así que es de la cotización y no de cada línea. Arranca en soles,
   * que es el caso normal.
   */
  const [currency, setCurrency] = useState("PEN");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [lines, setLines] = useState<QuotationServiceLine[]>([]);
  /**
   * Qué se está añadiendo. No filtra las líneas ni viaja en el payload -- la
   * naturaleza la deriva el backend de `material_id` -- solo decide cómo nace
   * la línea y cómo se rotula el botón.
   */
  const [kind, setKind] = useState<ServiceTab>("SERVICE");

  const [supplierSearch, setSupplierSearch] = useState("");
  const debouncedSupplierSearch = useDebounce(supplierSearch, 300);



  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        setLoadingCatalogs(true);
        // Solo proveedores. Las clases, los materiales y las ordenes las carga
        // el dialogo de linea, que es quien las usa desde que el alta dejo de
        // hacerse en la propia fila.
        setSuppliers(await supplierOptionsApi());
      } catch (error: any) {
        toastError(error, "Error al cargar datos iniciales");
      } finally {
        setLoadingCatalogs(false);
      }
    };
    loadCatalogs();
  }, []);

  useEffect(() => {
    if (debouncedSupplierSearch === "") return;
    supplierOptionsApi(debouncedSupplierSearch)
      .then(setSuppliers)
      .catch(() => toast({ title: "Error al buscar proveedores", variant: "destructive" }));
  }, [debouncedSupplierSearch]);

  const selectSupplier = (supplier: SupplierOption) => {
    setSupplierId(supplier.id);
    setSupplierName(supplier.name);
  };

  /**
   * Tras crear un proveedor desde la propia cotizacion: se recarga la lista y
   * se deja seleccionado. Dejarlo sin seleccionar obligaria a buscarlo a mano
   * justo despues de crearlo.
   */
  const reloadSuppliers = async (createdId: number) => {
    try {
      const lista = await supplierOptionsApi();
      setSuppliers(lista);
      const creado = lista.find((s) => s.id === createdId);
      if (creado) selectSupplier(creado);
    } catch (error) {
      toastError(error, "Error al recargar proveedores");
    }
  };

  /**
   * La linea llega ya validada del dialogo, que es el mismo que usa la
   * cotizacion al editarse. Aqui solo se guarda hasta que la cotizacion exista.
   */
  const addLineFromDialog = (line: QuotationServiceLine) =>
    setLines((prev) => [...prev, line]);

  const removeLine = (index: number) =>
    setLines((prev) => prev.filter((_, i) => i !== index));




  // El material recien creado desde el popup se agrega a la lista local
  // para que aparezca seleccionado sin esperar un refetch.


  const validLines = lines.filter(
    (line) => line.description.trim() !== "" && line.supplierClassId !== null
  );

  const canSubmit =
    supplierId !== null && description.trim() !== "" && validLines.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit || supplierId === null) {
      toast({ title: "Completa el proveedor, la descripción y al menos un servicio", variant: "destructive" });
      return;
    }

    // Los vínculos con material y orden de producción se validan línea por
    // línea: el backend lo rechazaría igual, pero así el usuario ve cuál falta.
    const invalidIndex = validLines.findIndex(
      (line) =>
        materialLinkError(line.materialLink) !== null ||
        productionOrderLinkError(line.productionOrderLink) !== null
    );
    if (invalidIndex !== -1) {
      const line = validLines[invalidIndex];
      const error =
        materialLinkError(line.materialLink) ??
        productionOrderLinkError(line.productionOrderLink);
      toast({ title: `Servicio ${invalidIndex + 1}: ${error}`, variant: "destructive" });
      return;
    }

    try {
      setSubmitting(true);
      const result = await createSupplierQuotationApi({
        supplier_id: supplierId,
        subject: description.trim(),
        request_description: notes.trim() || null,
        currency,
        payment_terms: paymentTerms.trim() || null,
        code: null,
        services: validLines.map((line) => {
          // Con material vinculado la unidad la define el material; el
          // campo del formulario solo aplica a los servicios sin material.
          const unit =
            materialLinkUnit(line.materialLink) ?? line.measurementUnit.trim();

          return {
            description: line.description.trim(),
            supplier_class_id: line.supplierClassId as number,
            ...materialLinkPayload(line.materialLink),
            ...productionOrderLinkPayload(line.productionOrderLink),
            code: null,
            // Con orden vinculada la cantidad la deriva el backend de las
            // prendas que el servicio atraviesa: mandar una aqui seria una
            // segunda fuente que la orden ya contradice.
            quantity: line.productionOrderLink.linked ? null : line.quantity,
            price: line.price,
            price_includes_tax: line.priceIncludesTax,
            measurement_unit: unit === "" ? null : unit,
            promised_date: line.promisedDate ?? null,
          };
        }),
      });
      toast({ title: "Cotización creada exitosamente", variant: "success" });
      navigate(`/quotations/view/${result.id}`);
    } catch (error: any) {
      toastError(error, "Error al crear cotización");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    kind,
    setKind,
    suppliers,
    loadingCatalogs,
    supplierId,
    supplierName,
    selectSupplier,
    reloadSuppliers,
    supplierSearch,
    setSupplierSearch,
    description,
    setDescription,
    notes,
    currency,
    setCurrency,
    paymentTerms,
    setPaymentTerms,
    setNotes,
    lines,
    addLineFromDialog,
    removeLine,
    canSubmit,
    submitting,
    handleSubmit,
  };
};
