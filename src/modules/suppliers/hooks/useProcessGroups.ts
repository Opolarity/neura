import {
  createProcessGroupApi,
  deleteProcessGroupApi,
  processGroupsListApi,
  updateProcessGroupApi,
} from "../services/processes.service";
import { useProcessCatalog } from "./useProcessCatalog";

/**
 * Pantalla "Procesos" = tabla `process_group`.
 *
 * El proceso es la etapa de fabricación ("Corte", "Confección") que agrupa
 * operaciones. No se pasa `groupListApi` porque un proceso no cuelga de otro:
 * la jerarquía está entre las dos tablas, no dentro de esta.
 */
export const useProcessGroups = () =>
  useProcessCatalog({
    entityLabel: "Proceso",
    listApi: processGroupsListApi,
    createApi: createProcessGroupApi,
    updateApi: updateProcessGroupApi,
    deleteApi: deleteProcessGroupApi,
  });
