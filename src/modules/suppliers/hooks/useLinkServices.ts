import { useCallback, useEffect, useState } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { useDebounce } from "@/shared/hooks/useDebounce";
import {
  fetchQuotationByIdServices,
  fetchQuotationsList,
} from "@/modules/quotations/services/Quotations.service";
import { quotationListAdapter } from "@/modules/quotations/adapters/Quotations.adapter";
import { QuotationListItem } from "@/modules/quotations/types/Quotations.types";
import { createServiceLinkApi } from "../services/productionOrderServices.service";
import { toQuotationServiceOption } from "../adapters/productionOrderServices.adapter";
import { QuotationServiceOption } from "../types/productionOrderServices.types";

const QUOTATIONS_PAGE_SIZE = 10;
const SERVICES_PAGE_SIZE = 100;

interface UseLinkServicesOptions {
  productionOrderId: number | null;
  /** El diálogo solo busca cuando está abierto. */
  open: boolean;
  onLinked?: () => void;
}

/**
 * Vincular servicios a una orden, en dos pasos.
 *
 * Paso 1: elegir una cotización. Paso 2: marcar cuáles de SUS servicios entran
 * a la orden. Para servicios de otra cotización se vuelve atrás y se repite —
 * así es como la orden acaba con servicios de varias sin que se vincule nunca
 * una cotización entera.
 */
export const useLinkServices = ({
  productionOrderId,
  open,
  onLinked,
}: UseLinkServicesOptions) => {
  const [search, setSearch] = useState("");
  const [quotations, setQuotations] = useState<QuotationListItem[]>([]);
  const [loadingQuotations, setLoadingQuotations] = useState(false);

  const [selectedQuotation, setSelectedQuotation] =
    useState<QuotationListItem | null>(null);
  const [services, setServices] = useState<QuotationServiceOption[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [linking, setLinking] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  // Cerrar y reabrir vuelve al paso 1: dejar una cotización a medio marcar
  // colgada entre aperturas es una trampa para vincular lo que no era.
  useEffect(() => {
    if (open) return;
    setSearch("");
    setSelectedQuotation(null);
    setServices([]);
    setChecked(new Set());
  }, [open]);

  const loadQuotations = useCallback(async () => {
    if (!open || selectedQuotation) return;

    try {
      setLoadingQuotations(true);
      const response = await fetchQuotationsList({
        search: debouncedSearch.trim() || null,
        order: "recent",
        page: 1,
        size: QUOTATIONS_PAGE_SIZE,
      });
      setQuotations(quotationListAdapter(response?.data?.data ?? []));
    } catch (error: any) {
      toast({
        title: "Error al cargar cotizaciones: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingQuotations(false);
    }
  }, [open, selectedQuotation, debouncedSearch]);

  useEffect(() => {
    loadQuotations();
  }, [loadQuotations]);

  const loadServices = useCallback(
    async (quotationId: number) => {
      try {
        setLoadingServices(true);
        const response = await fetchQuotationByIdServices({
          id: quotationId,
          search: null,
          page: 1,
          size: SERVICES_PAGE_SIZE,
        });
        setServices((response?.data ?? []).map(toQuotationServiceOption));
      } catch (error: any) {
        toast({
          title: "Error al cargar los servicios de la cotización: " + error.message,
          variant: "destructive",
        });
      } finally {
        setLoadingServices(false);
      }
    },
    []
  );

  const openQuotation = (quotation: QuotationListItem) => {
    setSelectedQuotation(quotation);
    setChecked(new Set());
    setServices([]);
    loadServices(quotation.id);
  };

  const backToQuotations = () => {
    setSelectedQuotation(null);
    setServices([]);
    setChecked(new Set());
  };

  /**
   * Marcable = es una línea de servicio y no está ya en otra orden. Las que ya
   * están en ESTA orden tampoco se marcan: volver a mandarlas no rompe nada
   * (el SP es idempotente) pero da a entender que hacen algo.
   */
  const isSelectable = (service: QuotationServiceOption) =>
    service.materialId === null && service.productionOrderId === null;

  const toggle = (serviceId: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) next.delete(serviceId);
      else next.add(serviceId);
      return next;
    });
  };

  const toggleAll = () => {
    const selectable = services.filter(isSelectable).map((s) => s.id);
    setChecked((prev) =>
      selectable.every((id) => prev.has(id)) ? new Set() : new Set(selectable)
    );
  };

  const link = async () => {
    if (productionOrderId === null || checked.size === 0) return;

    try {
      setLinking(true);
      const result = await createServiceLinkApi(
        productionOrderId,
        Array.from(checked)
      );

      if (result.linked === 0) {
        // Idempotente: repetir la llamada no duplica, solo no hace nada.
        toast({
          title: "Esos servicios ya estaban vinculados a esta orden",
          variant: "info",
        });
      } else {
        toast({
          title: `${result.linked} servicio(s) vinculados a la orden`,
          variant: "success",
        });
      }
      onLinked?.();
    } catch (error: any) {
      // El SP aborta con el nombre del servicio y de la orden que ya lo tiene.
      toast({
        title: error.message ?? "No se pudieron vincular los servicios",
        variant: "destructive",
      });
    } finally {
      setLinking(false);
    }
  };

  return {
    search,
    setSearch,
    quotations,
    loadingQuotations,
    selectedQuotation,
    openQuotation,
    backToQuotations,
    services,
    loadingServices,
    checked,
    isSelectable,
    toggle,
    toggleAll,
    linking,
    link,
  };
};
