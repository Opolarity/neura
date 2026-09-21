import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { toast } from "@/shared/hooks/use-toast";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { ComboboxOption } from "../components/EntityCombobox";
import {
  ProcessStep,
  ProcessStepPayload,
  ProcessGroupState,
  ProductionOrderItemOption,
  ServiceProcesses,
} from "../types/productionOrderProcesses.types";
import {
  productionOrderProcessesApi,
  updateProductionOrderProcessesApi,
} from "../services/productionOrderProcesses.service";
import {
  processGroupsListApi,
  processesListApi,
} from "../services/processes.service";
import { updateSupplierServiceApi } from "../services/supplierServices.service";

interface UseProductionOrderProcessesOptions {
  productionOrderId: number | null;
  /** El modal solo carga cuando está abierto. */
  open: boolean;
  onSaved?: () => void;
}

const toOptions = (items: { id: number; name: string }[]): ComboboxOption[] =>
  items.map((item) => ({ id: item.id, label: item.name }));

export const useProductionOrderProcesses = ({
  productionOrderId,
  open,
  onSaved,
}: UseProductionOrderProcessesOptions) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<ServiceProcesses[]>([]);
  /** Id del servicio → la fecha pactada con la que se cargó. */
  const fechasCargadas = useRef<Map<number, string | null>>(new Map());
  // Solo lectura: el avance por proceso lo calcula el backend.
  const [processes, setProcesses] = useState<ProcessGroupState[]>([]);
  const [items, setItems] = useState<ProductionOrderItemOption[]>([]);

  const [processOptions, setProcessOptions] = useState<ComboboxOption[]>([]);
  const [groupOptions, setGroupOptions] = useState<ComboboxOption[]>([]);

  const [processSearch, setProcessSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const debouncedProcessSearch = useDebounce(processSearch, 300);
  const debouncedGroupSearch = useDebounce(groupSearch, 300);

  const loadProcesses = useCallback(async () => {
    if (!open || productionOrderId === null) return;

    try {
      setLoading(true);
      const detail = await productionOrderProcessesApi(productionOrderId);
      setServices(detail.services);
      // Las fechas tal como llegaron: al guardar solo se mandan las que
      // cambiaron. Un servicio que nadie tocó no tiene por qué pasar por el SP.
      fechasCargadas.current = new Map(
        detail.services.map((service) => [
          service.supplierServiceId,
          service.promisedDate ?? null,
        ]),
      );
      setProcesses(detail.processes);
      setItems(detail.items);
    } catch (error: any) {
      toast({ title: "Error al cargar los procesos: " + error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [open, productionOrderId]);

  useEffect(() => {
    loadProcesses();
  }, [loadProcesses]);

  // Catálogos: solo activos, que es lo que tiene sentido asignar.
  useEffect(() => {
    if (!open) return;

    Promise.all([
      processesListApi({ search: debouncedProcessSearch || null, is_active: true, size: 100 }),
      processGroupsListApi({ search: debouncedGroupSearch || null, is_active: true, size: 100 }),
    ])
      .then(([processes, groups]) => {
        setProcessOptions(toOptions(processes.data));
        setGroupOptions(toOptions(groups.data));
      })
      .catch(() => toast({ title: "Error al cargar los catálogos de procesos", variant: "destructive" }));
  }, [open, debouncedProcessSearch, debouncedGroupSearch]);

  /**
   * Los pasos de la ruta que aún no tienen servicio.
   *
   * No vienen en `services` —esa lista se arma desde `supplier_services`, y
   * estos no tienen ninguno— sino dentro de la ruta, que el backend lee con
   * `LEFT JOIN`. Se recuperan de ahí para poder devolverles su `id` al
   * guardar y no recrearlos en cada pasada.
   */
  const looseSteps = useMemo(
    () =>
      processes
        .filter((process) => process.processGroupId !== null)
        .flatMap((process) =>
          process.steps
            .filter((step) => step.supplierServiceId === null)
            .map((step) => ({
              infoId: step.id,
              processGroupId: process.processGroupId as number,
              processId: process.processId,
              productionOrderItemIds: step.productionOrderItemIds,
            })),
        ),
    [processes],
  );

  /** Aplica un cambio a un paso concreto de un servicio. */
  const updateStep = (
    serviceId: number,
    stepIndex: number,
    patch: Partial<ProcessStep>
  ) => {
    setServices((prev) =>
      prev.map((service) =>
        service.supplierServiceId !== serviceId
          ? service
          : {
              ...service,
              steps: service.steps.map((step, i) =>
                i === stepIndex ? { ...step, ...patch } : step
              ),
            }
      )
    );
  };

  const addStep = (serviceId: number) => {
    setServices((prev) =>
      prev.map((service) =>
        service.supplierServiceId !== serviceId
          ? service
          : {
              ...service,
              steps: [
                ...service.steps,
                {
                  // El orden sigue al último paso del servicio.
                  order:
                    service.steps.reduce((max, s) => Math.max(max, s.order), 0) + 1,
                  productionOrderItemIds: [],
                  processId: null,
                  processName: null,
                  processGroupId: null,
                  processGroupName: null,
                },
              ],
            }
      )
    );
  };

  const removeStep = (serviceId: number, stepIndex: number) => {
    setServices((prev) =>
      prev.map((service) =>
        service.supplierServiceId !== serviceId
          ? service
          : {
              ...service,
              steps: service.steps.filter((_, i) => i !== stepIndex),
            }
      )
    );
  };

  /**
   * @param processOrder Los procesos en el orden en que se recorre la ruta.
   *   Es lo que decide el `order` de cada paso: la POSICIÓN DEL PROCESO, no la
   *   del paso dentro de su servicio, que es lo que se mandaba antes y hacía
   *   que todos valieran 1.
   */
  /**
   * La fecha pactada de un servicio, editada desde la ruta.
   *
   * Es la misma que se pone al cotizar (`supplier_services.promised_date`),
   * no una del paso: aquí se corrige, que es donde se está mirando el
   * calendario de la orden.
   */
  const setServicePromisedDate = (
    supplierServiceId: number,
    promisedDate: string | null,
  ) =>
    setServices((prev) =>
      prev.map((service) =>
        service.supplierServiceId === supplierServiceId
          ? { ...service, promisedDate }
          : service,
      ),
    );

  const handleSave = async (processOrder: number[] = []) => {
    if (productionOrderId === null) return;

    // El backend lo valida igualmente, pero avisar aquí evita el viaje y da
    // un mensaje más concreto.
    const emptyService = services.find((service) => service.steps.length === 0);
    if (emptyService) {
      toast({
        title: `El servicio "${emptyService.serviceDescription}" se quedaría sin pasos. Cada servicio necesita al menos uno.`,
        variant: "destructive",
      });
      return;
    }

    const supplierRows: ProcessStepPayload[] = services.flatMap((service) =>
      service.steps.map((step, index) => ({
        // Los pasos ya guardados viajan con su id para que el SP los
        // actualice en el sitio en vez de borrarlos y recrearlos: es lo
        // que mantiene vivos los vínculos ítem ↔ paso. Los nuevos van sin
        // id y se insertan.
        ...(step.id === undefined ? {} : { id: step.id }),
        supplier_service_id: service.supplierServiceId,
        // La lista entera: el SP reemplaza los vínculos del paso con esto, así
        // que mandar uno solo borraría los demás.
        production_order_item_ids: step.productionOrderItemIds,
        process_id: step.processId,
        process_group_id: step.processGroupId,
        // La posición del PROCESO en la ruta. Los pasos de un mismo
        // proceso comparten número a propósito: son una etapa, no dos. Un
        // paso todavía sin proceso va al final, donde no estorba; el SP
        // normaliza igualmente antes de guardar.
        order:
          step.processGroupId === null
            ? processOrder.length + 1
            : processOrder.indexOf(step.processGroupId) + 1 ||
              processOrder.length + 1,
      }))
    );

    // ---- Los procesos de la ruta que todavía no tienen servicio -------
    //
    // Es lo que hace que la ruta se pueda armar antes de cotizar: se colocan
    // los procesos, se guardan, y el servicio se les cuelga después desde el
    // botón «Cotizar» de la propia fila. Antes esto se perdía al guardar —solo
    // sobrevivían los procesos que ya tenían un servicio detrás— y para meter
    // un proceso en la ruta había que cotizarlo primero, que era circular.
    //
    // El paso conserva su `id` si ya existía, como los demás: sin él el SP lo
    // daría por borrado y recreado, y una fila nueva cada vez que se guarda es
    // una fila que `sp_create_supplier_service` ya no reconoce como el hueco
    // que tiene que rellenar.
    const conServicio = new Set(
      services.flatMap((service) =>
        service.steps
          .map((step) => step.processGroupId)
          .filter((id): id is number => id !== null),
      ),
    );

    const looseRows: ProcessStepPayload[] = processOrder
      .filter((groupId) => !conServicio.has(groupId))
      .map((groupId, index) => {
        const existente = looseSteps.find(
          (step) => step.processGroupId === groupId,
        );

        return {
          ...(existente?.infoId === undefined ? {} : { id: existente.infoId }),
          supplier_service_id: null,
          // Vacía = todas las prendas. Qué prendas cubre el paso se decide al
          // cotizarlo, que es cuando hay algo que repartir.
          production_order_item_ids: existente?.productionOrderItemIds ?? [],
          // El eje es el GRUPO (etapa); la operación (proceso) es opcional.
          process_id: existente?.processId ?? null,
          process_group_id: groupId,
          order: processOrder.indexOf(groupId) + 1 || index + 1,
        };
      });

    const rows: ProcessStepPayload[] = [...supplierRows, ...looseRows];

    try {
      setSaving(true);
      await updateProductionOrderProcessesApi(productionOrderId, rows);

      // Las fechas van por su propio camino: son de `supplier_services` y no
      // de la ruta, así que las guarda el SP del servicio. Después de la ruta
      // y no antes: si la ruta falla, no se queda una fecha suelta de un
      // reparto que no llegó a existir.
      const cambiadas = services.filter(
        (service) =>
          (service.promisedDate ?? null) !==
          (fechasCargadas.current.get(service.supplierServiceId) ?? null),
      );

      for (const service of cambiadas) {
        await updateSupplierServiceApi({
          id: service.supplierServiceId,
          promised_date: service.promisedDate || null,
        });
        fechasCargadas.current.set(
          service.supplierServiceId,
          service.promisedDate ?? null,
        );
      }

      toast({ title: "Procesos guardados exitosamente", variant: "success" });
      onSaved?.();
    } catch (error: any) {
      toast({ title: "Error al guardar los procesos: " + error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    saving,
    services,
    processes,
    items,
    processOptions,
    groupOptions,
    processSearch,
    setProcessSearch,
    groupSearch,
    setGroupSearch,
    updateStep,
    addStep,
    removeStep,
    handleSave,
    setServicePromisedDate,
    /**
     * Relee los procesos sin remontar la sección. Hace falta al registrar un
     * avance: la situación del servicio cambia y con ella `is_done`, pero
     * remontar descartaría la asignación de procesos que aún no se ha guardado.
     */
    reload: loadProcesses,
  };
};
