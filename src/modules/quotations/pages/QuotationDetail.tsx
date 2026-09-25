import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getWarehousesIsActiveTrue } from "@/shared/services/service";
import type { Warehouse } from "@/types/warehouse";
import { useQuotationDetail } from "../hooks/useQuotationDetail";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencySelect } from "@/shared/components/CurrencySelect";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ChevronDown,
  CreditCard,
  Package,
  Eye,
  History,
  Loader2,
  Pencil,
  Plus,
  Search,
  FileText,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { toast } from "@/shared/hooks/use-toast";
import {
  QuotationServiceApi,
  BulkStockEntryResult,
} from "../types/Quotations.types";
import {
  fetchSituationsByModuleId,
  forwardSituations,
  SituationOption,
  updateServiceSituation,
  purchaseOrderHeaderApi,
  allQuotationServicesApi,
  UpdateServiceSituationParams,
  createServiceStockEntry,
  bulkServiceStockEntry,
  BulkServiceItem,
  fetchServiceSituationHistory,
  fetchQuotationPayments,
  fetchServicePayments,
  PaymentItem,
  updateSupplierQuotationNotesApi,
} from "../services/Quotations.service";
import { ServiceSituationHistoryItem, ServiceTab } from "../types/Quotations.types";
import { QuotationConsumptionsDialog } from "../components/quotations/QuotationConsumptionsDialog";
import { taxLabel } from "@/shared/utils/tax";
import { openPurchaseOrderPdf } from "../utils/purchaseOrderPdf";
import { openServiceOrderPdf } from "../utils/serviceOrderPdf";
import { productionOrderByIdApi } from "@/modules/suppliers/services/productionOrders.service";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/modules/auth";
import { cn } from "@/shared/utils/utils";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { AddQuotationServiceDialog } from "../components/AddQuotationServiceDialog";
import { toastError } from "@/shared/utils/toastError";
import {
  DeselectConfirmDialog,
  useDeselectGuard,
} from "@/shared/components/selection-guard";

interface QuotationDetailProps {
  viewOnly?: boolean;
}

interface StockTypeOption {
  id: number;
  name: string;
}

interface VariationResult {
  id: number;
  sku: string;
  title: string;
}

const QuotationDetail = ({ viewOnly = false }: QuotationDetailProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const quotationId = Number(id);
  const { ensureProfile } = useUserProfile();

  const {
    quotation,
    services,
    serviceKind,
    onServiceKindChange,
    pagination,
    loading,
    loadingServices,
    error,
    onPageChange,
    onPageSizeChange,
    onSearchChange,
    refetch,
  } = useQuotationDetail(quotationId);

  const [searchInput, setSearchInput] = useState<string>("");

  /**
   * Qué material consume este paso y de qué almacén sale.
   *
   * Solo en cotizaciones de servicio: una línea con material es una COMPRA, y
   * una compra trae material, no lo gasta.
   *
   * La naturaleza sale del CÓDIGO y no de `services`. Esa lista viene filtrada
   * por la pestaña activa y paginada, así que derivar de ella una propiedad de
   * la cotización entera daba lo contrario de lo que parece: en una compra, la
   * pestaña de servicios llega vacía, `some()` devuelve false y el botón salía
   * justo donde no debe; y al cambiar de pestaña en una de servicio,
   * desaparecía.
   *
   * El prefijo lo pone el backend al crearla —OC si alguna línea lleva
   * material, OS si ninguna—, así que es la misma regla, ya resuelta y sobre
   * la cotización completa. Sin código —las anteriores al correlativo— se
   * muestra: abrir el diálogo en una compra solo enseña la lista vacía, que es
   * menos malo que esconderlo donde hace falta.
   */
  const [consumptionsOpen, setConsumptionsOpen] = useState(false);
  const esCompra = (quotation?.code ?? "").trim().toUpperCase().startsWith("OC-");

  /**
   * Las notas de la cotización, tal como se están escribiendo. Es lo único de
   * la cabecera que se edita después del alta: salen en las Observaciones de
   * la Orden de Compra y de la Orden de Servicio, y suelen saberse después de
   * crearla ("entregar en dos lotes").
   */
  const [notesDraft, setNotesDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  /** Lo pactado con el proveedor, editable como las notas. */
  const [currencyDraft, setCurrencyDraft] = useState("PEN");
  const [paymentTermsDraft, setPaymentTermsDraft] = useState("");

  // Cada carga pisa el borrador: lo que hay en pantalla es lo guardado.
  useEffect(() => {
    setNotesDraft(quotation?.request_description ?? "");
    // Las cotizaciones anteriores a la moneda salen en PEN por el DEFAULT de
    // la columna, así que aquí nunca falta.
    setCurrencyDraft(quotation?.currency ?? "PEN");
    setPaymentTermsDraft(quotation?.payment_terms ?? "");
  }, [
    quotation?.id,
    quotation?.request_description,
    quotation?.currency,
    quotation?.payment_terms,
  ]);

  // Un solo botón para los tres: son la misma cabecera y el mismo endpoint.
  const notesDirty =
    notesDraft.trim() !== (quotation?.request_description ?? "").trim() ||
    currencyDraft !== (quotation?.currency ?? "PEN") ||
    paymentTermsDraft.trim() !== (quotation?.payment_terms ?? "").trim();

  const handleSaveNotes = async () => {
    if (!quotation) return;
    try {
      setSavingNotes(true);
      await updateSupplierQuotationNotesApi(
        quotation.id,
        notesDraft.trim() || null,
        currencyDraft,
        // Cadena vacía y no null: es lo que el backend entiende por "bórrala",
        // mientras que null sería "no la toques".
        paymentTermsDraft.trim(),
      );
      toast({ title: "Cambios guardados", variant: "success" });
      await refetch();
    } catch (error) {
      toastError(error, "No se pudieron guardar los cambios");
    } finally {
      setSavingNotes(false);
    }
  };

  const [selectedService, setSelectedService] =
    useState<QuotationServiceApi | null>(null);
  const [modalMode, setModalMode] = useState<"view" | "edit" | null>(null);

  // Edit form state
  const [availableSituations, setAvailableSituations] = useState<
    SituationOption[]
  >([]);
  const [editSituationId, setEditSituationId] = useState<string>("");
  const [editQuantity, setEditQuantity] = useState<string>("");
  const [editBadQuantity, setEditBadQuantity] = useState<string>("");
  const [editPrice, setEditPrice] = useState<string>("");
  const [editMessage, setEditMessage] = useState<string>("");
  /** El indicador de IGV, como cadena para el Select. "" = sin declarar. */
  const [editIncludesTax, setEditIncludesTax] = useState<string>("");
  /**
   * A qué almacén entra el material al recibirlo. "" = el del perfil, que es
   * lo que el backend usaba siempre sin preguntar.
   *
   * Solo aparece al recibir una COMPRA: un servicio no trae material, así que
   * no hay stock que colocar en ningún sitio.
   */
  const [editWarehouseId, setEditWarehouseId] = useState<string>("");
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [origIncludesTax, setOrigIncludesTax] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [loadingSituations, setLoadingSituations] = useState(false);

  // Los almacenes PROPIOS: el material comprado entra en casa, no en el taller
  // de nadie. Una vez, al montar -- es un catálogo corto y no cambia mientras
  // se está recibiendo.
  useEffect(() => {
    getWarehousesIsActiveTrue()
      .then((todos) => setWarehouses(todos.filter((w) => !w.supplier_id)))
      .catch(() => setWarehouses([]));
  }, []);

  // Original values to detect changes
  const [origSituationId, setOrigSituationId] = useState<string>("");
  const [origQuantity, setOrigQuantity] = useState<string>("");
  const [origBadQuantity, setOrigBadQuantity] = useState<string>("");
  const [origPrice, setOrigPrice] = useState<string>("");

  // History modal state
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<
    ServiceSituationHistoryItem[]
  >([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Quotation payments modal state
  const [quotationPaymentsOpen, setQuotationPaymentsOpen] = useState(false);
  const [quotationPayments, setQuotationPayments] = useState<PaymentItem[]>([]);
  const [loadingQuotationPayments, setLoadingQuotationPayments] =
    useState(false);

  // Service payments modal state
  const [servicePaymentsOpen, setServicePaymentsOpen] = useState(false);
  const [servicePayments, setServicePayments] = useState<PaymentItem[]>([]);
  const [loadingServicePayments, setLoadingServicePayments] = useState(false);

  // Receive confirmation modal state
  const [recvConfirmOpen, setRecvConfirmOpen] = useState(false);
  const [isConfirmSaving, setIsConfirmSaving] = useState(false);

  // Agregar servicio a la cotización
  const [addServiceOpen, setAddServiceOpen] = useState(false);

  // Una cotización mezcla maquila y compra de material, y cada cosa se
  // comporta distinto: el servicio va a una orden de producción, el material
  // se consume por la explosión. El corte lo hace el backend -- esta lista
  // pagina en servidor, y repartirla aquí daría una pestaña con tres filas y
  // un paginador anunciando veinte.

  // Bulk selection state. La selección se conserva al paginar, así que se
  // guarda la fila y no solo el id: las acciones masivas necesitan
  // last_situation, module_id y code de filas que ya no están en la página.
  const [selectedServiceRows, setSelectedServiceRows] = useState<
    Map<number, QuotationServiceApi>
  >(new Map());
  const selectedServicesList = Array.from(selectedServiceRows.values());

  // Buscar o cambiar de pestaña con líneas seleccionadas pide confirmación y
  // deselecciona; paginar conserva la selección.
  const { guard, dialogProps: deselectDialogProps } = useDeselectGuard();
  const guardSelection = (action: () => void) =>
    guard(selectedServiceRows.size, () => setSelectedServiceRows(new Map()), action);

  // Bulk situation modal state
  const [bulkSituationModalOpen, setBulkSituationModalOpen] = useState(false);
  const [bulkSituationId, setBulkSituationId] = useState<string>("");
  const [bulkSituations, setBulkSituations] = useState<SituationOption[]>([]);
  const [loadingBulkSituations, setLoadingBulkSituations] = useState(false);
  const [isBulkSaving, setIsBulkSaving] = useState(false);

  // Bulk REC-PHY confirmation state
  const [bulkRecvConfirmOpen, setBulkRecvConfirmOpen] = useState(false);
  const [pendingBulkParams, setPendingBulkParams] = useState<{
    params: UpdateServiceSituationParams[];
    services: QuotationServiceApi[];
  } | null>(null);

  // Ingreso modal state
  const [ingresoOpen, setIngresoOpen] = useState(false);
  const [ingresoVariationId, setIngresoVariationId] = useState<number | null>(
    null,
  );
  const [ingresoVariationLabel, setIngresoVariationLabel] =
    useState<string>("");
  const [ingresoQuantity, setIngresoQuantity] = useState<string>("");
  const [ingresoStockTypeId, setIngresoStockTypeId] = useState<string>("");
  const [stockTypes, setStockTypes] = useState<StockTypeOption[]>([]);
  const [userWarehouse, setUserWarehouse] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [isCreatingIngreso, setIsCreatingIngreso] = useState(false);
  const [loadingIngreso, setLoadingIngreso] = useState(false);
  const [ingresoSearch, setIngresoSearch] = useState<string>("");
  const [ingresoSearchInput, setIngresoSearchInput] = useState<string>("");
  const [variationResults, setVariationResults] = useState<VariationResult[]>(
    [],
  );
  const [searchingVariations, setSearchingVariations] = useState(false);

  // Bulk ingreso modal state
  const [bulkIngresoOpen, setBulkIngresoOpen] = useState(false);
  const [bulkIngresoStockTypeId, setBulkIngresoStockTypeId] =
    useState<string>("");
  const [isBulkIngresoLoading, setIsBulkIngresoLoading] = useState(false);
  const [loadingBulkPreview, setLoadingBulkPreview] = useState(false);
  const [bulkIngresoPreview, setBulkIngresoPreview] = useState<
    BulkStockEntryResult[]
  >([]);

  const toggleServiceSelection = (service: QuotationServiceApi) => {
    setSelectedServiceRows((prev) => {
      const next = new Map(prev);
      if (next.has(service.id)) next.delete(service.id);
      else next.set(service.id, service);
      return next;
    });
  };

  const allPageServicesSelected =
    services.length > 0 && services.every((s) => selectedServiceRows.has(s.id));

  // Solo actúa sobre la página visible: lo seleccionado en otras páginas se
  // conserva. Si la página está a medias, la completa.
  const toggleAllServices = () => {
    setSelectedServiceRows((prev) => {
      const next = new Map(prev);
      services.forEach((s) =>
        allPageServicesSelected ? next.delete(s.id) : next.set(s.id, s),
      );
      return next;
    });
  };

  const [printingOrder, setPrintingOrder] = useState(false);

  /**
   * Orden de Compra en PDF con las líneas de esta pestaña.
   *
   * La cabecera necesita datos que el detalle no trae -- los de la empresa y el
   * contacto del proveedor -- así que se piden aquí y no se guardan en estado:
   * es un papel que se imprime de vez en cuando, no algo que la pantalla use.
   */
  const handlePrintPurchaseOrder = async () => {
    if (!quotation) return;

    try {
      setPrintingOrder(true);
      // Las lineas NO son las de `services`: eso es la pagina visible, filtrada
      // por el buscador. Una cotizacion de 25 materiales imprimiria 20 sin que
      // nada en el papel avisara de que faltan cinco.
      const [header, lines] = await Promise.all([
        purchaseOrderHeaderApi(quotation.supplier_id),
        allQuotationServicesApi(quotation.id, "MATERIAL"),
      ]);

      // La entrega de la compra es la MAS LEJANA de las comprometidas: es
      // cuando se espera tenerlo todo. Mismo criterio que la Orden de Servicio.
      const promisedDates = lines
        .map((line) => line.promised_date)
        .filter((date): date is string => !!date)
        .sort();

      openPurchaseOrderPdf({
        quotationCode: quotation.code,
        quotationDescription: quotation.subject,
        quotationNotes: quotation.request_description,
        currency: quotation.currency,
        paymentTerms: quotation.payment_terms,
        createdAt: quotation.created_at,
        promisedDate: promisedDates[promisedDates.length - 1] ?? null,
        supplierName: quotation.supplier_name,
        supplierDocument: header.supplierDocument,
        supplierPhone: header.supplierPhone,
        company: header.company,
        lines: lines.map((service) => ({
          code: service.code,
          description: service.description,
          quantity: service.last_situation?.quantity ?? null,
          measurementUnit: service.last_situation?.measurement_unit ?? null,
          price: service.last_situation?.price ?? null,
          includesTax: service.price_includes_tax ?? null,
        })),
      });
    } catch (error: any) {
      toastError(error, "No se pudo generar la orden");
    } finally {
      setPrintingOrder(false);
    }
  };

  /**
   * Orden de Servicio: una POR SERVICIO, no por cotización -- al revés que la
   * de Compra. Es lo que dice el papel: un número de OS, un tipo de servicio y
   * las prendas que lo atraviesan.
   *
   * Las prendas y sus cantidades salen de la ORDEN vinculada, no del servicio:
   * `variations` solo trae id, sku y producto, sin talla ni cantidad. Se cruzan
   * por variación con los ítems de la orden, que sí las tienen.
   */
  /**
   * Una Orden de Servicio por cotizacion, con TODOS sus servicios: lo que se
   * encarga a un taller es el conjunto, no cada linea por separado.
   *
   * Igual que la de compra, las lineas se piden completas y no se toman de
   * `services`, que es la pagina visible filtrada por el buscador.
   */
  const handlePrintServiceOrder = async () => {
    if (!quotation) return;

    try {
      setPrintingOrder(true);
      const [header, lines] = await Promise.all([
        purchaseOrderHeaderApi(quotation.supplier_id),
        allQuotationServicesApi(quotation.id, "SERVICE"),
      ]);

      // Las prendas salen una sola vez aunque tres servicios cuelguen de la
      // misma orden: cada orden vinculada se pide una vez y se juntan.
      const orderIds = [
        ...new Set(
          lines
            .map((line) => line.production_order_id)
            .filter((id): id is number => id !== null)
        ),
      ];
      const orders = await Promise.all(orderIds.map(productionOrderByIdApi));

      // La entrega de la cotizacion es la mas lejana de las comprometidas: es
      // cuando se espera tenerlo todo.
      const promisedDates = lines
        .map((line) => line.promised_date)
        .filter((date): date is string => !!date)
        .sort();

      openServiceOrderPdf({
        quotationCode: quotation.code,
        quotationDescription: quotation.subject,
        quotationNotes: quotation.request_description,
        currency: quotation.currency,
        paymentTerms: quotation.payment_terms,
        createdAt: quotation.created_at,
        promisedDate: promisedDates[promisedDates.length - 1] ?? null,
        supplierName: quotation.supplier_name,
        supplierDocument: header.supplierDocument,
        supplierPhone: header.supplierPhone,
        company: header.company,
        productionOrderNames: orders.map((order) => order.name),
        lines: lines.map((line) => ({
          code: line.code,
          description: line.description,
          // Lo PEDIDO, no lo ultimo registrado: tras un avance
          // last_situation.quantity ya no es lo que se encargo.
          quantity: line.requested_quantity,
          measurementUnit: line.last_situation?.measurement_unit ?? null,
          price: line.last_situation?.price ?? null,
          includesTax: line.price_includes_tax ?? null,
        })),
        garments: orders.flatMap((order) =>
          order.items
            .filter((item) => item.variationId !== null)
            .map((item) => ({
              label: item.variationLabel ?? item.name,
              sku: item.variationSku,
              quantity: item.quantity,
              // La talla por separado: la rejilla del papel la pone en columna.
              productTitle: item.productTitle,
              sizeTermId: item.sizeTermId,
              sizeTerm: item.sizeTerm,
              sizeGroup: item.sizeGroup,
              otherTerms: item.otherTerms,
            }))
        ),
      });
    } catch (error: any) {
      toastError(error, "No se pudo generar la orden");
    } finally {
      setPrintingOrder(false);
    }
  };

  // Cambiar de pestaña cambia el tipo de fila (maquila o material): la
  // selección de una no vale en la otra.
  const handleServiceTabChange = (value: string) =>
    guardSelection(() => onServiceKindChange(value as ServiceTab));

  const openBulkSituationModal = async () => {
    const firstSelected = selectedServicesList[0];
    if (!firstSelected) return;
    setBulkSituationId("");
    setBulkSituationModalOpen(true);
    setLoadingBulkSituations(true);
    try {
      const situations = await fetchSituationsByModuleId(
        firstSelected.module_id,
      );
      setBulkSituations(situations);
    } catch (error) {
      toastError(error, "No se pudieron cargar las situaciones");
    } finally {
      setLoadingBulkSituations(false);
    }
  };

  const openBulkIngresoModal = async () => {
    // Captura sincrónicamente antes de cualquier await para evitar stale closure
    const bulkServices: BulkServiceItem[] = selectedServicesList.map((s) => ({
      supplier_service_id: Number(s.id),
      code: s.code,
      production_order_id: s.production_order_id,
    }));

    if (bulkServices.length === 0) {
      toast({ title: "No hay servicios seleccionados", variant: "destructive" });
      return;
    }

    setBulkIngresoOpen(true);
    setBulkIngresoStockTypeId("");
    setBulkIngresoPreview([]);
    setLoadingBulkPreview(true);
    try {
      const profile = await ensureProfile();
      if (profile?.warehouse_id) {
        setUserWarehouse({
          id: profile.warehouse_id,
          name: profile.warehouses?.name ?? "—",
        });
      }

      const { data: stkModule } = await supabase
        .from("modules")
        .select("id")
        .eq("code", "STK")
        .single();
      if (stkModule) {
        const { data: classesData } = await supabase
          .from("classes")
          .select("id, name")
          .eq("module_id", stkModule.id);
        setStockTypes(
          (classesData ?? []).map((c) => ({ id: c.id, name: c.name })),
        );
      }

      const preview = await bulkServiceStockEntry(
        {
          services: bulkServices,
          stockTypeId: 0,
          warehouseId: 0,
          quotationCode: quotation?.code ?? undefined,
        },
        true,
      );
      setBulkIngresoPreview(preview.results);
    } catch (error) {
      toastError(error, "Error al calcular el stock faltante");
      setBulkIngresoOpen(false);
    } finally {
      setLoadingBulkPreview(false);
    }
  };

  const handleBulkIngreso = async () => {
    if (!bulkIngresoStockTypeId || !userWarehouse || !quotation) return;
    setIsBulkIngresoLoading(true);
    try {
      const bulkServices: BulkServiceItem[] = selectedServicesList.map((s) => ({
        supplier_service_id: Number(s.id),
        code: s.code,
        production_order_id: s.production_order_id,
      }));

      const result = await bulkServiceStockEntry(
        {
          services: bulkServices,
          stockTypeId: Number(bulkIngresoStockTypeId),
          warehouseId: userWarehouse.id,
          quotationCode: quotation.code ?? undefined,
        },
        false,
      );
      toast({ title: `${result.summary.will_process} ingreso(s) creado(s) exitosamente`, variant: "success" });
      // El backend cuenta los errores dentro de "skipped": se separan para no
      // presentar un fallo como una omisión normal (stock ya completo, etc.).
      const errors = result.results.filter((r) => r.status === "error");
      const skipped = result.summary.skipped - errors.length;
      if (skipped > 0)
        toast({ title: `${skipped} servicio(s) omitido(s)`, variant: "info" });
      if (errors.length > 0)
        toast({
          title: `${errors.length} servicio(s) no se pudieron ingresar`,
          description: errors[0].reason,
          variant: "destructive",
        });
      setBulkIngresoOpen(false);
      setSelectedServiceRows(new Map());
      await refetch();
    } catch (err) {
      toastError(err, "Error al crear ingresos");
    } finally {
      setIsBulkIngresoLoading(false);
    }
  };

  const callFchConfirmReceivedBulk = async (
    selectedServices: QuotationServiceApi[],
  ) => {
    if (!quotation?.code) return;
    const secret = import.meta.env.VITE_CONSIGNMENT_API_SECRET as string;
    if (!secret) return;
    const apiKey = await computeHmac("ovtk_product_lookup", secret);
    const products = selectedServices
      .filter((s) => s.code)
      .map((s) => ({
        sku: s.code!,
        quantity: s.last_situation?.quantity ?? 0,
      }));
    if (products.length === 0) return;
    try {
      await fetch(
        // API de overtake (otro backend, auth por x-api-key): no pasa por el chokepoint.
        // eslint-disable-next-line no-restricted-syntax
        `${import.meta.env.VITE_OVERTAKE_URL_SUPABASE}/functions/v1/fch-confirm-received-products`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": apiKey },
          body: JSON.stringify({ order_id: quotation.code, products }),
        },
      );
    } catch {
      // La confirmación externa no debe bloquear el flujo
    }
  };

  /**
   * Un avance por servicio, cada uno en su transacción: con Promise.all el
   * primer error escondía los que sí se guardaron. Ahora se informa cuántos
   * fallaron (p. ej. porque otro usuario los avanzó mientras tanto: la
   * selección se conserva entre páginas) y se recarga siempre, para que lo
   * que quede por hacer se vuelva a elegir con datos frescos.
   */
  const runBulkSituationUpdates = async (
    allParams: UpdateServiceSituationParams[],
  ) => {
    const results = await Promise.allSettled(
      allParams.map((p) => updateServiceSituation(p)),
    );
    const failed = results.filter(
      (r): r is PromiseRejectedResult => r.status === "rejected",
    );
    const okIndexes = results.flatMap((r, i) =>
      r.status === "fulfilled" ? [i] : [],
    );

    if (failed.length === 0) {
      toast({ title: "Servicios actualizados correctamente", variant: "success" });
    } else if (okIndexes.length === 0) {
      toastError(failed[0].reason, "No se pudo actualizar ningún servicio");
    } else {
      toast({
        title: `Se actualizaron ${okIndexes.length} de ${results.length} servicios`,
        description:
          `${failed.length} no se actualizaron: ` +
          (failed[0].reason instanceof Error
            ? failed[0].reason.message
            : "error desconocido"),
        variant: "warning",
      });
    }

    return okIndexes;
  };

  const executeBulkSave = async (allParams: UpdateServiceSituationParams[]) => {
    setIsBulkSaving(true);
    try {
      await runBulkSituationUpdates(allParams);
      setBulkSituationModalOpen(false);
      setSelectedServiceRows(new Map());
      await refetch();
    } catch (err) {
      toastError(err, "Error al actualizar");
    } finally {
      setIsBulkSaving(false);
    }
  };

  const handleBulkSituationSave = async () => {
    if (!bulkSituationId || !quotation) return;
    const chosenSituationId = Number(bulkSituationId);
    const chosenSituation = bulkSituations.find(
      (s) => s.id === chosenSituationId,
    );
    if (!chosenSituation) return;

    const selectedServices = selectedServicesList;
    const allParams: UpdateServiceSituationParams[] = selectedServices.map(
      (service) => {
        const sit = service.last_situation!;
        return {
          supplierServiceSituationId: sit.id,
          supplierServiceId: service.id,
          moduleId: service.module_id,
          situationId: chosenSituationId,
          statusId: chosenSituation.status_id,
          badQuantity: null,
          message: null,
          quantity: sit.quantity ?? null,
          measurementUnit: sit.measurement_unit,
          price: sit.price ?? null,
        };
      },
    );

    const isRecPhy = chosenSituation.code === "REC-PHY";
    if (isRecPhy && quotation.code) {
      const { data: supplierProfile } = await supabase
        .from("suppliers_profile")
        .select("code")
        .eq("id", quotation.supplier_id)
        .maybeSingle();

      if (supplierProfile?.code) {
        setPendingBulkParams({ params: allParams, services: selectedServices });
        setBulkSituationModalOpen(false);
        setBulkRecvConfirmOpen(true);
        return;
      }
    }

    await executeBulkSave(allParams);
  };

  const handleConfirmedBulkSave = async () => {
    if (!pendingBulkParams) return;
    setIsBulkSaving(true);
    try {
      const okIndexes = await runBulkSituationUpdates(pendingBulkParams.params);
      // La confirmación externa solo de los que sí quedaron recibidos.
      await callFchConfirmReceivedBulk(
        okIndexes.map((i) => pendingBulkParams.services[i]),
      );
      setBulkRecvConfirmOpen(false);
      setPendingBulkParams(null);
      setSelectedServiceRows(new Map());
      await refetch();
    } catch (err) {
      toastError(err, "Error al actualizar");
    } finally {
      setIsBulkSaving(false);
    }
  };

  const openViewModal = (service: QuotationServiceApi) => {
    setSelectedService(service);
    setModalMode("view");
  };

  const openHistoryModal = async (service: QuotationServiceApi) => {
    setHistoryOpen(true);
    setHistoryItems([]);
    setLoadingHistory(true);
    try {
      const items = await fetchServiceSituationHistory(service.id);
      setHistoryItems(items);
    } catch (error) {
      toastError(error, "No se pudo cargar el historial");
    } finally {
      setLoadingHistory(false);
    }
  };

  const openEditModal = async (service: QuotationServiceApi) => {
    const s = service.last_situation;
    const initialSituationId = s?.situation_id?.toString() ?? "";
    const initialQuantity =
      s?.quantity !== null && s?.quantity !== undefined
        ? String(s.quantity)
        : "";
    const initialBadQuantity =
      s?.bad_quantity !== null && s?.bad_quantity !== undefined
        ? String(s.bad_quantity)
        : "";
    const initialPrice =
      s?.price !== null && s?.price !== undefined ? String(s.price) : "";
    // Una línea antigua no lo declara: se abre vacío y sigue sin declararlo
    // mientras nadie lo elija.
    const initialIncludesTax =
      service.price_includes_tax === null ||
      service.price_includes_tax === undefined
        ? ""
        : String(service.price_includes_tax);

    setSelectedService(service);
    setEditSituationId(initialSituationId);
    setEditQuantity(initialQuantity);
    setEditBadQuantity(initialBadQuantity);
    setEditPrice(initialPrice);
    setEditIncludesTax(initialIncludesTax);
    // En blanco al abrir: significa «el de mi perfil», que es el
    // comportamiento de siempre. Elegir otro es un acto.
    setEditWarehouseId("");
    setEditMessage("");
    setOrigSituationId(initialSituationId);
    setOrigQuantity(initialQuantity);
    setOrigBadQuantity(initialBadQuantity);
    setOrigPrice(initialPrice);
    setOrigIncludesTax(initialIncludesTax);
    setModalMode("edit");

    setLoadingSituations(true);
    try {
      // Solo hacia delante: retroceder de situación desharía stock y costo ya
      // movidos, porque el trigger de situaciones reacciona al delta. El
      // cambio MASIVO se queda sin filtrar a propósito -- ahí cada servicio
      // seleccionado puede estar en un orden distinto.
      const situations = forwardSituations(
        await fetchSituationsByModuleId(service.module_id),
        service.last_situation?.situation_id ?? null
      );
      setAvailableSituations(situations);
    } catch (error) {
      toastError(error, "No se pudieron cargar las situaciones disponibles");
    } finally {
      setLoadingSituations(false);
    }
  };

  const closeModal = () => {
    setSelectedService(null);
    setModalMode(null);
    setAvailableSituations([]);
    setEditSituationId("");
    setEditQuantity("");
    setEditBadQuantity("");
    setEditPrice("");
    setEditMessage("");
  };

  const buildSaveParams = (): UpdateServiceSituationParams | null => {
    if (!selectedService?.last_situation) return null;
    const sit = selectedService.last_situation;
    const chosenSituationId = editSituationId
      ? Number(editSituationId)
      : sit.situation_id;
    const chosenStatusId =
      availableSituations.find((s) => s.id === chosenSituationId)?.status_id ??
      sit.status_id;
    return {
      supplierServiceSituationId: sit.id,
      supplierServiceId: selectedService.id,
      moduleId: selectedService.module_id,
      situationId: chosenSituationId,
      statusId: chosenStatusId,
      badQuantity: editBadQuantity !== "" ? Number(editBadQuantity) : null,
      message: editMessage.trim() || null,
      quantity: editQuantity !== "" ? Number(editQuantity) : null,
      measurementUnit: sit.measurement_unit,
      price: editPrice !== "" ? Number(editPrice) : null,
      priceIncludesTax: editIncludesTax === "" ? null : editIncludesTax === "true",
      // Solo cuando se ha elegido: vacío deja que el backend caiga al almacén
      // del perfil, que es lo que hacía antes de que se pudiera elegir.
      warehouseId: editWarehouseId !== "" ? Number(editWarehouseId) : null,
    };
  };

  /**
   * Se está recibiendo una COMPRA: es el único momento en que hay stock que
   * colocar, y por tanto el único en que preguntar el almacén significa algo.
   * Un servicio no trae material, y las demás situaciones no mueven stock.
   */
  const recibiendoMaterial =
    modalMode === "edit" &&
    selectedService?.material_id != null &&
    availableSituations.find((s) => s.id === Number(editSituationId))?.code ===
      "REC-PHY";

  const computeHmac = async (
    message: string,
    secret: string,
  ): Promise<string> => {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
    return Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  const callFchConfirmReceived = async () => {
    if (!selectedService || !quotation) return;
    const secret = import.meta.env.VITE_CONSIGNMENT_API_SECRET as string;
    if (!secret) return;
    const apiKey = await computeHmac("ovtk_product_lookup", secret);
    const body = {
      order_id: quotation?.code,
      products: [
        {
          sku: selectedService.code,
          quantity:
            editQuantity !== ""
              ? Number(editQuantity)
              : selectedService.last_situation?.quantity,
        },
      ],
    };
    try {
      await fetch(
        // API de overtake (otro backend, auth por x-api-key): no pasa por el chokepoint.
        // eslint-disable-next-line no-restricted-syntax
        `${import.meta.env.VITE_OVERTAKE_URL_SUPABASE}/functions/v1/fch-confirm-received-products`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": apiKey },
          body: JSON.stringify(body),
        },
      );
    } catch {
      // La confirmación externa no debe bloquear el flujo
    }
  };

  const executeActualSave = async (params: UpdateServiceSituationParams) => {
    setIsSaving(true);
    try {
      await updateServiceSituation(params);
      toast({ title: "Servicio actualizado correctamente", variant: "success" });
      closeModal();
      await refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al actualizar";
      toastError(err, msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    const params = buildSaveParams();
    if (!params || !selectedService || !quotation) return;

    const chosenSituationId = editSituationId
      ? Number(editSituationId)
      : selectedService.last_situation!.situation_id;
    const chosenSituation = availableSituations.find(
      (s) => s.id === chosenSituationId,
    );
    const isRecPhySituation = chosenSituation?.code === "REC-PHY";
    const serviceHasCode = Boolean(selectedService.code);
    const quotationHasCode = Boolean(quotation.code);

    if (isRecPhySituation && serviceHasCode && quotationHasCode) {
      // Verify supplier profile has code
      const { data: supplierProfile } = await supabase
        .from("suppliers_profile")
        .select("code")
        .eq("id", quotation.supplier_id)
        .maybeSingle();

      if (supplierProfile?.code) {
        setRecvConfirmOpen(true);
        return;
      }
    }

    await executeActualSave(params);
  };

  const handleConfirmedSave = async () => {
    const params = buildSaveParams();
    if (!params) return;
    setIsConfirmSaving(true);
    try {
      await updateServiceSituation(params);
      await callFchConfirmReceived();
      toast({ title: "Servicio actualizado correctamente", variant: "success" });
      setRecvConfirmOpen(false);
      closeModal();
      await refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al actualizar";
      toastError(err, msg);
    } finally {
      setIsConfirmSaving(false);
    }
  };

  const openIngresoModal = async () => {
    if (!selectedService) return;
    setIngresoOpen(true);
    setLoadingIngreso(true);
    setIngresoVariationId(null);
    setIngresoVariationLabel("");
    setIngresoSearch("");
    setIngresoSearchInput("");
    setVariationResults([]);
    setIngresoStockTypeId("");
    setIngresoQuantity(String(selectedService.last_situation?.quantity ?? ""));

    try {
      // Fetch user warehouse
      const profile = await ensureProfile();
      if (profile?.warehouse_id) {
        setUserWarehouse({
          id: profile.warehouse_id,
          name: profile.warehouses?.name ?? "—",
        });
      }

      // Fetch stock types directly from classes filtered by STK module
      const { data: stkModule } = await supabase
        .from("modules")
        .select("id")
        .eq("code", "STK")
        .single();
      if (stkModule) {
        const { data: classesData } = await supabase
          .from("classes")
          .select("id, name")
          .eq("module_id", stkModule.id);
        setStockTypes(
          (classesData ?? []).map((c) => ({ id: c.id, name: c.name })),
        );
      }

      // Pre-select variation if service has a SKU code
      const sku = selectedService.code;
      if (sku) {
        const { data: varData } = await supabase
          .from("variations")
          .select("id, sku, products(title)")
          .eq("sku", sku)
          .maybeSingle();
        if (varData) {
          setIngresoVariationId(varData.id);
          setIngresoVariationLabel(
            `${(varData.products as { title: string } | null)?.title ?? ""} — ${varData.sku}`,
          );
        }
      }
    } catch (error) {
      toastError(error, "Error al cargar datos del ingreso");
    } finally {
      setLoadingIngreso(false);
    }
  };

  const closeIngresoModal = () => {
    setIngresoOpen(false);
    setIngresoVariationId(null);
    setIngresoVariationLabel("");
    setIngresoSearch("");
    setIngresoSearchInput("");
    setVariationResults([]);
    setIngresoStockTypeId("");
    setIngresoQuantity("");
    setUserWarehouse(null);
    setStockTypes([]);
  };

  const searchVariations = async (term: string) => {
    if (!term.trim()) {
      setVariationResults([]);
      return;
    }
    setSearchingVariations(true);
    try {
      const { data } = await supabase
        .from("variations")
        .select("id, sku, products(title)")
        .or(`sku.ilike.%${term}%,products.title.ilike.%${term}%`)
        .limit(10);
      setVariationResults(
        (data ?? []).map((v) => ({
          id: v.id,
          sku: v.sku ?? "",
          title: (v.products as { title: string } | null)?.title ?? "",
        })),
      );
    } catch {
      setVariationResults([]);
    } finally {
      setSearchingVariations(false);
    }
  };

  useEffect(() => {
    if (!selectedService?.code && ingresoOpen) {
      const t = setTimeout(() => searchVariations(ingresoSearch), 400);
      return () => clearTimeout(t);
    }
  }, [ingresoSearch, ingresoOpen, selectedService?.code]);

  const handleCreateIngreso = async () => {
    if (
      !selectedService ||
      !ingresoVariationId ||
      !userWarehouse ||
      !ingresoStockTypeId ||
      !ingresoQuantity
    ) {
      toast({ title: "Completa todos los campos requeridos", variant: "destructive" });
      return;
    }
    if (Number(ingresoQuantity) <= 0) {
      toast({ title: "La cantidad debe ser mayor a 0", variant: "destructive" });
      return;
    }

    setIsCreatingIngreso(true);
    try {
      await createServiceStockEntry({
        variationId: ingresoVariationId,
        quantity: Number(ingresoQuantity),
        stockTypeId: Number(ingresoStockTypeId),
        supplierServiceId: selectedService.id,
        quotationCode: quotation?.code ?? "",
        productionOrderId: selectedService.production_order_id,
        price: Number(selectedService.last_situation?.price ?? 0),
        warehouseId: userWarehouse.id,
      });
      toast({ title: "Ingreso creado correctamente", variant: "success" });
      closeIngresoModal();
    } catch (err) {
      toastError(err, "Error al crear ingreso");
    } finally {
      setIsCreatingIngreso(false);
    }
  };

  const openQuotationPaymentsModal = async () => {
    if (!quotation) return;
    setQuotationPaymentsOpen(true);
    setLoadingQuotationPayments(true);
    try {
      const items = await fetchQuotationPayments(
        quotationId,
        quotation.supplier_id,
        services.length,
      );
      setQuotationPayments(items);
    } catch (error) {
      toastError(error, "No se pudieron cargar los pagos");
    } finally {
      setLoadingQuotationPayments(false);
    }
  };

  const openServicePaymentsModal = async (service: QuotationServiceApi) => {
    if (!quotation) return;
    setServicePaymentsOpen(true);
    setLoadingServicePayments(true);
    try {
      const items = await fetchServicePayments(
        service.id,
        quotation.supplier_id,
        services.length,
      );
      setServicePayments(items);
    } catch (error) {
      toastError(error, "No se pudieron cargar los pagos del servicio");
    } finally {
      setLoadingServicePayments(false);
    }
  };

  const formatCurrency = (value: number | null | undefined) =>
    value !== null && value !== undefined
      ? `S/ ${Number(value).toFixed(2)}`
      : "—";

  const formatUnitPrice = (
    price: number | null | undefined,
    quantity: number | null | undefined,
  ) => {
    if (
      price !== null &&
      price !== undefined &&
      quantity !== null &&
      quantity !== undefined &&
      Number(quantity) !== 0
    ) {
      return `S/ ${(Number(price) / Number(quantity)).toFixed(2)}`;
    }
    return "—";
  };

  const sit = selectedService?.last_situation;
  /**
   * La cantidad de una línea vinculada a una orden de producción la manda la
   * orden: el backend la deriva de las prendas que el servicio atraviesa y la
   * sigue cuando la orden cambia. Dejarla editable aquí crearía una segunda
   * fuente para el mismo número, que es lo que ya nos costó `kind` y el
   * costeo. Sin orden, la pone la persona y se edita como siempre.
   */
  const quantityFromOrder = Boolean(selectedService?.production_order_id);
  /**
   * El ingreso a stock es de la prenda terminada, así que solo se ofrece en el
   * último servicio del recorrido: en corte o en costura la prenda todavía no
   * existe como producto. La situación en `-PHY` sigue haciendo falta — es la
   * que dice que lo físico ya llegó — pero ya no basta por sí sola.
   *
   * `is_last_step` lo resuelve el backend. Si el servicio no está vinculado a
   * ninguna orden de producción llega en `true`, que es el comportamiento que
   * había antes para el flujo suelto de cotización.
   */
  const showIngresoButton =
    (sit?.situation_code?.endsWith("-PHY") ?? false) &&
    (selectedService?.is_last_step ?? true) &&
    // Si la orden tiene prendas es producción propia, y el stock entra por
    // «Recibir» en la orden, con el producto que ya dice cada ítem. Dejarlo
    // también aquí serían dos puertas al mismo stock, una de ellas pidiendo
    // que se busque a mano una variación que ya se conoce.
    !(selectedService?.production_order_has_items ?? false);

  const hasChanges =
    editSituationId !== origSituationId ||
    editQuantity !== origQuantity ||
    editBadQuantity !== origBadQuantity ||
    editPrice !== origPrice ||
    editIncludesTax !== origIncludesTax ||
    editMessage.trim() !== "";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/quotations")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {viewOnly ? "Ver cotización" : "Editar cotización"}
            {quotation ? ` #${quotation.id}` : ""}
          </h1>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && !loading && (
        <Card>
          <CardContent className="py-8 text-center text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {!loading && !error && quotation && (
        <>
          {/* Info general */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Información General</CardTitle>
                <div className="flex items-center gap-2">
                  {/* Solo en cotizaciones de SERVICIO: una compra trae
                      material, no lo gasta, así que no consume nada. */}
                  {!esCompra && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConsumptionsOpen(true)}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Consumo de material
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openQuotationPaymentsModal}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Ver pagos
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>ID</Label>
                  <Input
                    disabled
                    value={`#${quotation.id}`}
                    className="bg-muted text-muted-foreground cursor-not-allowed"
                  />
                </div>
                {quotation.code && (
                  <div className="space-y-2">
                    <Label>Código</Label>
                    <Input
                      disabled
                      value={quotation.code}
                      className="bg-muted text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Input
                    disabled
                    value={
                      quotation.created_at
                        ? format(
                            new Date(quotation.created_at),
                            "dd/MM/yyyy HH:mm",
                          )
                        : "—"
                    }
                    className="bg-muted text-muted-foreground cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Proveedor</Label>
                  <Input
                    disabled
                    value={quotation.supplier_name}
                    className="bg-muted text-muted-foreground cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cantidad</Label>
                  <Input
                    disabled
                    value={
                      quotation.quantity !== null
                        ? String(quotation.quantity)
                        : "—"
                    }
                    className="bg-muted text-muted-foreground cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Precio</Label>
                  <Input
                    disabled
                    value={
                      quotation.price !== null
                        ? `S/ ${Number(quotation.price).toFixed(2)}`
                        : "—"
                    }
                    className="bg-muted text-muted-foreground cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                  {/* El campo de siempre, en su sitio: por debajo es `subject`,
                      el título. Se fija al crearla. */}
                  <Label>Descripción</Label>
                  <Input
                    disabled
                    value={quotation.subject}
                    className="bg-muted text-muted-foreground cursor-not-allowed"
                  />
                </div>
                {/* Lo pactado con el proveedor. La moneda rige TODOS los
                    importes de los dos papeles, y la condición sale en sus
                    Observaciones. Se guardan con el mismo botón que las notas:
                    son la misma cabecera. */}
                <div className="space-y-2">
                  <Label htmlFor="quotation-currency">Moneda</Label>
                  <CurrencySelect
                    id="quotation-currency"
                    value={currencyDraft}
                    onValueChange={setCurrencyDraft}
                    disabled={savingNotes}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="quotation-payment-terms">
                    Condición de pago
                  </Label>
                  <Input
                    id="quotation-payment-terms"
                    value={paymentTermsDraft}
                    onChange={(e) => setPaymentTermsDraft(e.target.value)}
                    placeholder="Ej: 50% adelanto, 50% contra entrega"
                    disabled={savingNotes}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                  {/* Las notas sí se editan: van a las Observaciones de los
                      dos papeles, y se saben después de crear la cotización. */}
                  <Label>Notas</Label>
                  <Textarea
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    placeholder="Ej: Entregar en dos lotes. El hilo lo pone el taller."
                    rows={3}
                    disabled={savingNotes}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-muted-foreground text-xs">
                      Se imprimen en las Observaciones de la Orden de Compra y de la
                      Orden de Servicio.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleSaveNotes}
                      disabled={!notesDirty || savingNotes}
                    >
                      {savingNotes ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Guardar cambios"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Servicios */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Tabs value={serviceKind} onValueChange={handleServiceTabChange}>
                  <TabsList>
                    <TabsTrigger value="SERVICE">Orden de Servicios</TabsTrigger>
                    <TabsTrigger value="MATERIAL">Orden de Compra</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Un documento por pestaña, y los dos por cotización: la de
                      compra lleva todas las líneas de material y la de servicio
                      todos los servicios. Sin líneas no se ofrece -- un papel
                      vacío no se manda a ningún proveedor. */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    disabled={services.length === 0 || printingOrder}
                    onClick={
                      serviceKind === "MATERIAL"
                        ? handlePrintPurchaseOrder
                        : handlePrintServiceOrder
                    }
                  >
                    {printingOrder ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    {serviceKind === "MATERIAL"
                      ? "Orden de Compra"
                      : "Orden de Servicio"}
                  </Button>
                  {!viewOnly && (
                    <Button size="sm" className="gap-2" onClick={() => setAddServiceOpen(true)}>
                      <Plus className="h-4 w-4" />
                      {serviceKind === "SERVICE"
                        ? "Agregar servicio"
                        : "Agregar material"}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="flex flex-row gap-2">
                  <Input
                    placeholder="Buscar por descripción..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        guardSelection(() => onSearchChange(searchInput));
                    }}
                  />
                  <Button
                    className="flex-shrink-0"
                    size="icon"
                    variant="outline"
                    type="button"
                    onClick={() =>
                      guardSelection(() => onSearchChange(searchInput))
                    }
                  >
                    <Search />
                  </Button>
                </div>
                {!viewOnly && selectedServiceRows.size > 0 && (
                  <>
                    <span className="text-sm text-muted-foreground">
                      {selectedServiceRows.size} seleccionado(s)
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Cambios masivos
                          <ChevronDown className="ml-1 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={openBulkSituationModal}>
                          Cambiar estado
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={openBulkIngresoModal}>
                          Ingreso de mercadería
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    {!viewOnly && (
                      <TableHead className="w-10">
                        <Checkbox
                          checked={allPageServicesSelected}
                          onCheckedChange={toggleAllServices}
                        />
                      </TableHead>
                    )}
                    <TableHead>#</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Cantidad Mala</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Situación</TableHead>
                    <TableHead className="text-right">Precio Uni.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>IGV</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingServices ? (
                    <TableRow>
                      <TableCell
                        colSpan={viewOnly ? 9 : 10}
                        className="text-center py-8"
                      >
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : services.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={viewOnly ? 9 : 10}
                        className="text-center py-8 text-muted-foreground"
                      >
                        {serviceKind === "SERVICE"
                          ? "Esta cotización no tiene líneas de servicio"
                          : "Esta cotización no tiene líneas de compra"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    services.map((service, index) => {
                      const s = service.last_situation;
                      return (
                        <TableRow key={service.id}>
                          {!viewOnly && (
                            <TableCell>
                              <Checkbox
                                checked={selectedServiceRows.has(service.id)}
                                onCheckedChange={() =>
                                  toggleServiceSelection(service)
                                }
                              />
                            </TableCell>
                          )}
                          <TableCell className="font-medium text-muted-foreground">
                            {index + 1}
                          </TableCell>
                          <TableCell>{service.description}</TableCell>
                          <TableCell className="text-right">
                            {/* Lo PEDIDO: de la orden si la línea está
                                vinculada, y si no lo tecleado. `s.quantity` de
                                la situación vigente es otra cosa — lo último
                                registrado, que tras un avance ya no es lo que
                                se pidió. */}
                            {service.requested_quantity !== null &&
                            service.requested_quantity !== undefined
                              ? service.requested_quantity
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {s?.bad_quantity !== null &&
                            s?.bad_quantity !== undefined
                              ? s.bad_quantity
                              : "—"}
                          </TableCell>
                          <TableCell>{s?.measurement_unit || "—"}</TableCell>
                          <TableCell>{s?.situation_name || "—"}</TableCell>
                          <TableCell className="text-right">
                            {/* Entre lo PEDIDO: repartir el precio entre lo
                                que sobrevivió a la merma inflaba el unitario. */}
                            {formatUnitPrice(s?.price, service.requested_quantity)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(s?.price)}
                          </TableCell>
                          <TableCell>
                            {s?.price === null || s?.price === undefined ? (
                              <span className="text-muted-foreground">—</span>
                            ) : (
                              /* Solo el rótulo: el indicador dice si el
                                 precio llega con IGV, no reparte nada. */
                              <Badge
                                variant={
                                  service.price_includes_tax == null
                                    ? "outline"
                                    : "secondary"
                                }
                              >
                                {taxLabel(service.price_includes_tax)}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openViewModal(service)}
                                title="Ver detalle"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {!viewOnly && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => openEditModal(service)}
                                  title="Editar"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              <PaginationBar
                pagination={pagination}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
              />
            </CardContent>
          </Card>

          {!viewOnly && (
            <div className="flex justify-end">
              <Button disabled>Guardar cambios</Button>
            </div>
          )}

          {!viewOnly && quotation && (
            <AddQuotationServiceDialog
              open={addServiceOpen}
              onOpenChange={setAddServiceOpen}
              quotationId={quotation.id}
              supplierId={quotation.supplier_id}
              kind={serviceKind}
              onSaved={refetch}
            />
          )}
        </>
      )}

      {/* Modal unificado: Ver / Editar servicio */}
      <Dialog
        open={modalMode !== null}
        onOpenChange={(open) => !open && closeModal()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <DialogTitle>
                {modalMode === "edit"
                  ? "Editar servicio"
                  : "Detalle del servicio"}
              </DialogTitle>
              {modalMode === "view" && selectedService && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-muted hover:bg-muted/80"
                    title="Ver historial"
                    onClick={() => openHistoryModal(selectedService)}
                  >
                    <History className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    title="Ver pagos del servicio"
                    onClick={() => openServicePaymentsModal(selectedService)}
                  >
                    <CreditCard className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>
          {selectedService && (
            <div className="space-y-4">
              <p className="text-sm font-medium">
                {selectedService.description}
              </p>

              {/* Situación */}
              <div className="space-y-2">
                <Label>Situación</Label>
                {modalMode === "edit" ? (
                  loadingSituations ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cargando situaciones...
                    </div>
                  ) : (
                    <Select
                      value={editSituationId}
                      onValueChange={setEditSituationId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una situación" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSituations.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )
                ) : (
                  <Input
                    disabled
                    value={sit?.situation_name ?? "—"}
                    className="bg-muted text-muted-foreground cursor-not-allowed"
                  />
                )}
              </div>

              {/* Cantidad / Cantidad Mala */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    min={0}
                    /* Con orden vinculada el número no vive aquí: lo pone la
                       orden y sigue a la orden cuando cambia. Editarlo sería
                       crear una segunda fuente para el mismo dato. */
                    disabled={modalMode === "view" || quantityFromOrder}
                    value={
                      quantityFromOrder
                        ? (selectedService?.requested_quantity ?? "")
                        : modalMode === "edit"
                          ? editQuantity
                          : (sit?.quantity ?? "")
                    }
                    onChange={(e) => setEditQuantity(e.target.value)}
                    placeholder="0"
                    className={cn(
                      (modalMode === "view" || quantityFromOrder) &&
                        "bg-muted text-muted-foreground cursor-not-allowed",
                    )}
                  />
                  {quantityFromOrder && (
                    <p className="text-muted-foreground text-xs">
                      La fija la orden de producción vinculada.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Cantidad Mala</Label>
                  <Input
                    type="number"
                    min={0}
                    disabled={modalMode === "view"}
                    value={
                      modalMode === "edit"
                        ? editBadQuantity
                        : (sit?.bad_quantity ?? "")
                    }
                    onChange={(e) => setEditBadQuantity(e.target.value)}
                    placeholder="0"
                    className={cn(
                      modalMode === "view" &&
                        "bg-muted text-muted-foreground cursor-not-allowed",
                    )}
                  />
                </div>
              </div>

              {/* Unidad de medida (siempre bloqueada) */}
              <div className="space-y-2">
                <Label>Unidad de medida</Label>
                <Input
                  disabled
                  value={sit?.measurement_unit ?? "—"}
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
              </div>

              {/* Precio */}
              <div className="space-y-2">
                <Label>Precio (Total)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  disabled={modalMode === "view"}
                  value={modalMode === "edit" ? editPrice : (sit?.price ?? "")}
                  onChange={(e) => setEditPrice(e.target.value)}
                  placeholder="0.00"
                  className={cn(
                    modalMode === "view" &&
                      "bg-muted text-muted-foreground cursor-not-allowed",
                  )}
                />
              </div>

              {/* IGV */}
              <div className="space-y-2">
                <Label>IGV</Label>
                {modalMode === "view" ? (
                  <Input
                    disabled
                    value={taxLabel(selectedService?.price_includes_tax)}
                    className="bg-muted text-muted-foreground cursor-not-allowed"
                  />
                ) : (
                  <Select
                    value={editIncludesTax}
                    onValueChange={setEditIncludesTax}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin declarar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">El precio incluye IGV</SelectItem>
                      {/* «+ IGV»: como se dice al pactar, «cien más IGV». */}
                      <SelectItem value="false">+ IGV</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* A qué almacén entra lo que se recibe.

                  Hasta ahora no se preguntaba: el backend lo tomaba del perfil
                  de quien registraba, así que el material entraba siempre al
                  almacén de esa persona -- daba igual a cuál hubiera llegado.
                  Vacío sigue haciendo eso, que es lo que espera quien no toca
                  el campo. */}
              {recibiendoMaterial && (
                <div className="space-y-2">
                  <Label>
                    Almacén de ingreso{" "}
                    <span className="text-muted-foreground text-xs font-normal">
                      · opcional
                    </span>
                  </Label>
                  <Select
                    value={editWarehouseId}
                    onValueChange={setEditWarehouseId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="El almacén de mi perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem
                          key={warehouse.id}
                          value={String(warehouse.id)}
                        >
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Mensaje */}
              <div className="space-y-2">
                <Label>Mensaje</Label>
                <Input
                  disabled={modalMode === "view"}
                  value={
                    modalMode === "edit" ? editMessage : (sit?.message ?? "—")
                  }
                  onChange={(e) => setEditMessage(e.target.value)}
                  placeholder={
                    modalMode === "edit" ? "Mensaje opcional" : undefined
                  }
                  className={cn(
                    modalMode === "view" &&
                      "bg-muted text-muted-foreground cursor-not-allowed",
                  )}
                />
              </div>

              {modalMode === "edit" && (
                <div className="flex justify-between items-center pt-2">
                  {showIngresoButton ? (
                    <Button
                      variant="secondary"
                      onClick={openIngresoModal}
                      disabled={isSaving}
                    >
                      Agregar ingreso
                    </Button>
                  ) : (
                    <span />
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={closeModal}
                      disabled={isSaving}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving || loadingSituations || !hasChanges}
                    >
                      {isSaving && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Guardar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Agregar ingreso */}
      <Dialog
        open={ingresoOpen}
        onOpenChange={(open) => !open && closeIngresoModal()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar ingreso</DialogTitle>
          </DialogHeader>

          {loadingIngreso ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Prenda / variación */}
              <div className="space-y-2">
                <Label>Prenda</Label>
                {ingresoVariationId && selectedService?.code ? (
                  <Input
                    disabled
                    value={ingresoVariationLabel}
                    className="bg-muted text-muted-foreground cursor-not-allowed"
                  />
                ) : (
                  <>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Buscar por SKU o nombre..."
                        value={ingresoVariationLabel || ingresoSearchInput}
                        onChange={(e) => {
                          if (ingresoVariationId) {
                            setIngresoVariationId(null);
                            setIngresoVariationLabel("");
                          }
                          setIngresoSearchInput(e.target.value);
                        }}
                      />
                      <Button
                        variant="outline"
                        onClick={() => setIngresoSearch(ingresoSearchInput)}
                      >
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>
                    {searchingVariations && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Buscando...
                      </div>
                    )}
                    {variationResults.length > 0 && !ingresoVariationId && (
                      <div className="border rounded-md max-h-40 overflow-y-auto">
                        {variationResults.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                            onClick={() => {
                              setIngresoVariationId(v.id);
                              setIngresoVariationLabel(`${v.title} — ${v.sku}`);
                              setIngresoSearch("");
                              setIngresoSearchInput("");
                              setVariationResults([]);
                            }}
                          >
                            <span className="font-medium">{v.title}</span>
                            <span className="text-muted-foreground ml-2 text-xs">
                              {v.sku}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {ingresoVariationId && (
                      <p className="text-sm text-muted-foreground">
                        {ingresoVariationLabel}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Cantidad */}
              <div className="space-y-2">
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  min={1}
                  value={ingresoQuantity}
                  onChange={(e) => setIngresoQuantity(e.target.value)}
                  placeholder="0"
                />
              </div>

              {/* Tipo de stock */}
              <div className="space-y-2">
                <Label>Tipo de stock</Label>
                <Select
                  value={ingresoStockTypeId}
                  onValueChange={setIngresoStockTypeId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {stockTypes.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Almacén (bloqueado) */}
              <div className="space-y-2">
                <Label>Almacén</Label>
                <Input
                  disabled
                  value={userWarehouse?.name ?? "—"}
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={closeIngresoModal}
                  disabled={isCreatingIngreso}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateIngreso}
                  disabled={
                    isCreatingIngreso ||
                    !ingresoVariationId ||
                    !ingresoStockTypeId ||
                    !userWarehouse
                  }
                >
                  {isCreatingIngreso && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Confirmar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Historial de situaciones */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Historial de situaciones</DialogTitle>
          </DialogHeader>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : historyItems.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Sin historial registrado
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Situación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead>Mensaje</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyItems.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell>{item.situation_name}</TableCell>
                      <TableCell>{item.status_name}</TableCell>
                      <TableCell className="text-right">
                        {item.quantity !== null ? item.quantity : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.price !== null
                          ? `S/ ${Number(item.price).toFixed(2)}`
                          : "—"}
                      </TableCell>
                      <TableCell
                        className="max-w-[160px] truncate"
                        title={item.message ?? ""}
                      >
                        {item.message || "—"}
                      </TableCell>
                      <TableCell>{item.created_by_name}</TableCell>
                      <TableCell>
                        {format(new Date(item.created_at), "dd/MM/yyyy HH:mm")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Pagos de la cotización */}
      <Dialog
        open={quotationPaymentsOpen}
        onOpenChange={setQuotationPaymentsOpen}
      >
        <DialogContent className="sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Pagos de la cotización</DialogTitle>
          </DialogHeader>
          {loadingQuotationPayments ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : quotationPayments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Sin pagos registrados
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead className="text-right">Servicios</TableHead>
                    <TableHead className="text-right">Precio total</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Código interno</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Comprobante</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotationPayments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-muted-foreground">
                        {p.id}
                      </TableCell>
                      <TableCell className="text-right">
                        {p.services_count}
                      </TableCell>
                      <TableCell className="text-right">
                        {p.total_price !== null
                          ? `S/ ${Number(p.total_price).toFixed(2)}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {p.date
                          ? format(new Date(p.date), "dd/MM/yyyy HH:mm")
                          : "—"}
                      </TableCell>
                      <TableCell>{p.supplier_name}</TableCell>
                      <TableCell>{p.document || "—"}</TableCell>
                      <TableCell>{p.code || "—"}</TableCell>
                      <TableCell
                        className="max-w-[200px] truncate"
                        title={p.description ?? ""}
                      >
                        {p.description || "—"}
                      </TableCell>
                      {/* El comprobante se sube al pagar; aquí es donde se
                          comprueba. Sin enlace no se pinta nada: un "—" ya
                          dice que no hay. */}
                      <TableCell>
                        {p.voucher_url ? (
                          <a
                            href={p.voucher_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
                          >
                            Ver
                          </a>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Pagos del servicio */}
      <Dialog open={servicePaymentsOpen} onOpenChange={setServicePaymentsOpen}>
        <DialogContent className="sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Pagos del servicio</DialogTitle>
          </DialogHeader>
          {loadingServicePayments ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : servicePayments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Sin pagos registrados para este servicio
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead className="text-right">Servicios</TableHead>
                    <TableHead className="text-right">Precio total</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Código interno</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Comprobante</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {servicePayments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-muted-foreground">
                        {p.id}
                      </TableCell>
                      <TableCell className="text-right">
                        {p.services_count}
                      </TableCell>
                      <TableCell className="text-right">
                        {p.total_price !== null
                          ? `S/ ${Number(p.total_price).toFixed(2)}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {p.date
                          ? format(new Date(p.date), "dd/MM/yyyy HH:mm")
                          : "—"}
                      </TableCell>
                      <TableCell>{p.supplier_name}</TableCell>
                      <TableCell>{p.document || "—"}</TableCell>
                      <TableCell>{p.code || "—"}</TableCell>
                      <TableCell
                        className="max-w-[200px] truncate"
                        title={p.description ?? ""}
                      >
                        {p.description || "—"}
                      </TableCell>
                      {/* El comprobante se sube al pagar; aquí es donde se
                          comprueba. Sin enlace no se pinta nada: un "—" ya
                          dice que no hay. */}
                      <TableCell>
                        {p.voucher_url ? (
                          <a
                            href={p.voucher_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
                          >
                            Ver
                          </a>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Selección de situación masiva */}
      <Dialog
        open={bulkSituationModalOpen}
        onOpenChange={(open) => {
          if (!open && !isBulkSaving) setBulkSituationModalOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cambiar estado masivo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Se cambiará el estado de{" "}
              <span className="font-semibold text-foreground">
                {selectedServiceRows.size}
              </span>{" "}
              servicio(s) seleccionado(s).
            </p>
            {loadingBulkSituations ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Situación</Label>
                <Select
                  value={bulkSituationId}
                  onValueChange={setBulkSituationId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar situación" />
                  </SelectTrigger>
                  <SelectContent>
                    {bulkSituations.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setBulkSituationModalOpen(false)}
                disabled={isBulkSaving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleBulkSituationSave}
                disabled={
                  !bulkSituationId || isBulkSaving || loadingBulkSituations
                }
              >
                {isBulkSaving && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Aplicar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Confirmación recepción REC-PHY masiva */}
      <Dialog
        open={bulkRecvConfirmOpen}
        onOpenChange={(open) => {
          if (!open && !isBulkSaving) setBulkRecvConfirmOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar recepción masiva</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Esta información de recepción será enviada a{" "}
              <span className="font-semibold text-foreground">
                {quotation?.supplier_name}
              </span>{" "}
              para{" "}
              <span className="font-semibold text-foreground">
                {pendingBulkParams?.services.length ?? 0}
              </span>{" "}
              servicio(s).
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setBulkRecvConfirmOpen(false)}
                disabled={isBulkSaving}
              >
                Cancelar
              </Button>
              <Button onClick={handleConfirmedBulkSave} disabled={isBulkSaving}>
                {isBulkSaving && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Aceptar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Ingreso masivo de mercadería */}
      <Dialog
        open={bulkIngresoOpen}
        onOpenChange={(open) => {
          if (!open && !isBulkIngresoLoading) setBulkIngresoOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ingreso masivo de mercadería</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Se ingresará el stock faltante calculado para los servicios
              seleccionados.
            </p>

            {loadingBulkPreview ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {(() => {
                  const toProcess = bulkIngresoPreview.filter(
                    (r) => r.status === "will_process",
                  );
                  const toSkip = bulkIngresoPreview.filter(
                    (r) => r.status === "skipped",
                  );
                  return (
                    <>
                      {toProcess.length > 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Se ingresará el stock faltante de{" "}
                          <span className="font-semibold text-foreground">
                            {toProcess.length}
                          </span>{" "}
                          producto(s).
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          No hay productos con stock faltante para ingresar.
                        </p>
                      )}

                      {toSkip.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2 text-muted-foreground">
                            No se procesarán ({toSkip.length})
                          </p>
                          <div className="border rounded-md overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Servicio</TableHead>
                                  <TableHead>Razón</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {toSkip.map((r) => {
                                  const svc = services.find(
                                    (s) =>
                                      Number(s.id) === r.supplier_service_id,
                                  );
                                  const reasonLabels: Record<string, string> = {
                                    sin_sku: "Sin código SKU",
                                    variacion_no_encontrada:
                                      "Variación no encontrada",
                                    stock_completo: "Stock completo",
                                    sin_situacion: "Sin situación activa",
                                    servicio_no_encontrado:
                                      "Servicio no encontrado",
                                  };
                                  const reasonLabel =
                                    reasonLabels[r.reason ?? ""] ??
                                    r.reason ??
                                    "—";
                                  return (
                                    <TableRow key={r.supplier_service_id}>
                                      <TableCell className="text-sm">
                                        {svc?.description ??
                                          `ID ${r.supplier_service_id}`}
                                      </TableCell>
                                      <TableCell className="text-sm text-muted-foreground">
                                        {reasonLabel}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}

                      {toProcess.length > 0 && (
                        <div className="space-y-1">
                          <Label>Tipo de stock</Label>
                          <Select
                            value={bulkIngresoStockTypeId}
                            onValueChange={setBulkIngresoStockTypeId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un tipo de stock" />
                            </SelectTrigger>
                            <SelectContent>
                              {stockTypes.map((st) => (
                                <SelectItem key={st.id} value={String(st.id)}>
                                  {st.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setBulkIngresoOpen(false)}
                disabled={isBulkIngresoLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleBulkIngreso}
                disabled={
                  loadingBulkPreview ||
                  !bulkIngresoStockTypeId ||
                  isBulkIngresoLoading ||
                  bulkIngresoPreview.filter((r) => r.status === "will_process")
                    .length === 0
                }
              >
                {isBulkIngresoLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Confirmación recepción REC-PHY */}
      <Dialog
        open={recvConfirmOpen}
        onOpenChange={(open) => {
          if (!open && !isConfirmSaving) setRecvConfirmOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar recepción</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Esta información de recepción será enviada a{" "}
              <span className="font-semibold text-foreground">
                {quotation?.supplier_name}
              </span>
              .
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setRecvConfirmOpen(false)}
                disabled={isConfirmSaving}
              >
                Cancelar
              </Button>
              <Button onClick={handleConfirmedSave} disabled={isConfirmSaving}>
                {isConfirmSaving && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Aceptar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <QuotationConsumptionsDialog
        open={consumptionsOpen}
        onOpenChange={setConsumptionsOpen}
        quotationId={quotation?.id ?? null}
        quotationLabel={quotation?.code ?? null}
      />

      <DeselectConfirmDialog {...deselectDialogProps} />
    </div>
  );
};

export default QuotationDetail;
