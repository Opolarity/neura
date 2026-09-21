import { useState, useEffect, useCallback } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import {
  ProductionPlanFilters,
  ProductionPlanProcessColumn,
  ProductionPlanRoutes,
  ProductionPlanRow,
} from "../types/productionPlan.types";
import { productionPlanApi } from "../services/productionPlan.service";
import { generateProductionPlanExcel } from "../utils/generateProductionPlanExcel";

/**
 * Con lo que abre el Plan Maestro cuando nadie ha filtrado nada.
 *
 * Se exporta porque el indicador de «hay filtros puestos» lo compara: con
 * PENDIENTE de fabrica, el boton se veria encendido desde el primer render y
 * dejaria de significar nada.
 */
export const ESTADO_POR_DEFECTO = "PENDING" as const;

interface UseProductionPlanOptions {
  /**
   * Acota la rejilla a UNA orden. Es lo que hace que la pestaña Avances de la
   * orden sea el mismo Plan Maestro con solo sus datos: el filtro va fijo y no
   * se ofrece cambiarlo.
   */
  productionOrderId?: number | null;
  /** Filas por página al abrir. Dentro de una orden caben menos. */
  pageSize?: number;
}

/**
 * Si estos filtros acotan algo.
 *
 * Cualquiera vale -- buscar un codigo acota tanto como elegir una categoria --
 * y por eso la busqueda cuenta: exigir ademas un estado obligaria a acordarse
 * de en cual quedo la prenda que se busca, que es justo lo que no se sabe.
 */
const acotaAlgo = (f: ProductionPlanFilters): boolean =>
  Boolean(
    f.status ||
      f.production_order_status ||
      f.category_id ||
      f.production_order_class_id ||
      f.promised_from ||
      f.promised_to ||
      (f.search ?? "").trim(),
  );

export const useProductionPlan = ({
  productionOrderId = null,
  pageSize = 20,
}: UseProductionPlanOptions = {}) => {
  const [rows, setRows] = useState<ProductionPlanRow[]>([]);
  const [exporting, setExporting] = useState(false);
  /** La ruta de cada orden de la página, por id. Baja con el plan. */
  const [routes, setRoutes] = useState<ProductionPlanRoutes>({});
  /** Las columnas de proceso de la tabla. Las decide el backend. */
  const [processes, setProcesses] = useState<ProductionPlanProcessColumn[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: pageSize,
    total: 0,
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  // Ningun filtro viene puesto. La lista abre entera: el backend la ordena
  // Pendiente -> En progreso -> Culminado y, dentro de cada estado, por entrega
  // mas proxima, asi que lo que falta por producir esta arriba sin acotar
  // nada. Acotar por mes, estado o clase es decision del usuario en el modal.
  const [filters, setFilters] = useState<ProductionPlanFilters>({
    search: "",
    // El plan arranca por lo PENDIENTE, no por todo.
    //
    // Sin filtro traia el historico entero de cada tenant: la primera pantalla
    // era la mas cara del modulo y ademas la menos util -- lo culminado no se
    // planifica. Ver todo sigue siendo posible, pero es una decision del
    // usuario en el modal, no lo que pasa por defecto.
    //
    // En la pestana de una orden no aplica: ahi se mira ESA orden entera,
    // incluidas sus prendas ya terminadas, y acotarla dejaria la mitad fuera.
    status: productionOrderId ? null : ESTADO_POR_DEFECTO,
    production_order_status: null,
    category_id: null,
    production_order_class_id: null,
    promised_from: null,
    promised_to: null,
    production_order_id: productionOrderId,
    page: 1,
    size: pageSize,
  });

  /**
   * El Plan Maestro no se mira entero.
   *
   * Quitar todos los filtros pedia el historico completo del tenant: la
   * consulta mas cara del modulo, y la menos util -- lo culminado hace meses
   * no se planifica. Asi que cuando no queda nada que acote, se vuelve a lo
   * PENDIENTE y se dice por que; callarselo dejaria un filtro puesto que
   * nadie eligio.
   *
   * Dentro de una orden no aplica: ahi la orden ES el filtro, y su pestana de
   * avances tiene que poder enseñar tambien las prendas ya terminadas.
   */
  const conFiltroMinimo = (
    next: ProductionPlanFilters,
  ): ProductionPlanFilters => {
    if (next.production_order_id || acotaAlgo(next)) return next;

    toast({
      title: "El Plan Maestro necesita al menos un filtro",
      description:
        "Se vuelve a lo pendiente. Buscar, o acotar por estado, categoría, clase o entrega, sirve igual.",
    });
    return { ...next, status: ESTADO_POR_DEFECTO };
  };

  // Si cambia la orden que se está mirando, el filtro la sigue. No se toca
  // nada más: los demás filtros del modal siguen siendo del usuario.
  useEffect(() => {
    setFilters((prev) =>
      prev.production_order_id === productionOrderId
        ? prev
        : { ...prev, production_order_id: productionOrderId },
    );
  }, [productionOrderId]);

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      const response = await productionPlanApi({
        ...filters,
        page: pagination.p_page,
        size: pagination.p_size,
      });
      setRows(response.data);
      setRoutes(response.routes);
      setProcesses(response.processes);
      setPagination(response.pagination);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error al cargar el plan maestro de producción",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.p_page, pagination.p_size]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  /**
   * Descargar el plan a Excel.
   *
   * Pide TODO lo filtrado, no la página que se está viendo: bajar 20 filas
   * cuando el filtro da 300 sería una trampa -- el fichero parecería completo
   * y no lo estaría. Por eso va su propia llamada y no se reutiliza `rows`.
   *
   * El tope es el total que ya devolvió el SP, así que no se pide a ciegas: si
   * la lista está vacía no se llama ni se genera fichero.
   */
  const handleExport = useCallback(async () => {
    if (pagination.total === 0) {
      toast({ title: "No hay nada que exportar con estos filtros" });
      return;
    }

    try {
      setExporting(true);
      const response = await productionPlanApi({
        ...filters,
        page: 1,
        size: pagination.total,
      });

      generateProductionPlanExcel(
        response.data,
        // Las columnas de proceso, las mismas que pinta la tabla: salen del
        // backend y no de la ruta de cada orden, para que dos rutas distintas
        // no den dos tablas que no se pueden apilar.
        response.processes,
        // El día, para no pisar la descarga anterior al bajar dos veces.
        new Date().toISOString().slice(0, 10),
      );
    } catch (error) {
      console.error(error);
      toast({
        title: "No se pudo generar el Excel del plan maestro",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  }, [filters, pagination.total]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    // Borrar la busqueda tambien puede dejar la lista sin acotar: si era el
    // unico filtro, al vaciarla se vuelve a lo pendiente.
    //
    // El calculo va FUERA del updater: conFiltroMinimo avisa con un toast, y
    // un updater de setState puede ejecutarse dos veces -- en StrictMode
    // siempre lo hace -- y saldrian dos avisos por un solo cambio.
    setFilters(conFiltroMinimo({ ...filters, search: value }));
    setPagination((prev) => ({ ...prev, p_page: 1 }));
  };

  /** Aplica los filtros del modal: entrega, estados, categoría y clase. */
  const handleApplyFilters = (applied: ProductionPlanFilters) => {
    // Igual que en la busqueda: fuera del updater, porque avisa con un toast.
    setFilters(
      conFiltroMinimo({
        ...filters,
        status: applied.status ?? null,
        // Faltaba: el modal lo mandaba y aqui se caia, asi que elegir "Estado
        // de la orden" encendia el boton de Filtrar --hasActiveFilters si lo
        // mira-- pero no filtraba nada.
        production_order_status: applied.production_order_status ?? null,
        category_id: applied.category_id ?? null,
        production_order_class_id: applied.production_order_class_id ?? null,
        promised_from: applied.promised_from ?? null,
        promised_to: applied.promised_to ?? null,
      }),
    );
    setPagination((prev) => ({ ...prev, p_page: 1 }));
  };

  // Los del modal. Faltaba category_id desde antes: filtrar por categoria no
  // encendia el indicador, asi que el filtro quedaba puesto sin que nada lo
  // dijera. El rango de entrega tambien cuenta: es la unica senal de que la
  // lista esta acotada, y el boton en morado es lo que lo dice.
  // El estado cuenta como filtro solo si NO es el de fabrica: si contara
  // siempre, el boton nace en morado y deja de avisar de nada.
  const hasActiveFilters = Boolean(
    (filters.status && filters.status !== ESTADO_POR_DEFECTO) ||
      filters.production_order_status ||
      filters.production_order_class_id ||
      filters.category_id ||
      filters.promised_from ||
      filters.promised_to,
  );

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, p_page: page }));
  };

  const handlePageSizeChange = (size: number) => {
    setPagination((prev) => ({ ...prev, p_size: size, p_page: 1 }));
  };

  return {
    rows,
    routes,
    processes,
    pagination,
    loading,
    search,
    filters,
    hasActiveFilters,
    exporting,
    handleExport,
    handleSearchChange,
    handleApplyFilters,
    handlePageChange,
    handlePageSizeChange,
    reload: fetchRows,
  };
};
