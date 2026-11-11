import {
  createProcessApi,
  deleteProcessApi,
  processesListApi,
  updateProcessApi,
} from "../services/processes.service";
import { useProcessCatalog } from "./useProcessCatalog";

/**
 * Pantalla "Operaciones" = tabla `processes`.
 *
 * Es lo que el esquema llama operación de fabricación (tender, pegar bolsillo,
 * voltear prenda). Desde el pase de multicliente (2026-11) se agrupan por una OPERACIÓN PADRE
 * (un solo nivel), ya no por Proceso: el Proceso es la etapa de la receta y
 * de la orden, en la que puede ir cualquier operación.
 */
export const useProcesses = () =>
  useProcessCatalog({
    entityLabel: "Operación",
    entityLabelPlural: "Operaciones",
    isFeminine: true,
    listApi: processesListApi,
    createApi: createProcessApi,
    updateApi: updateProcessApi,
    deleteApi: deleteProcessApi,
    // El padre sale del mismo catálogo: el formulario ofrece las que no
    // cuelgan de otra. La pantalla de Procesos no lo pasa.
    parentListApi: processesListApi,
  });
