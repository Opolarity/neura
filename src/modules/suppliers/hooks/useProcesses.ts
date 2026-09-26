import {
  createProcessApi,
  deleteProcessApi,
  processesListApi,
  processGroupsListApi,
  updateProcessApi,
} from "../services/processes.service";
import { useProcessCatalog } from "./useProcessCatalog";

/**
 * Pantalla "Operaciones" = tabla `processes`.
 *
 * Es lo que el esquema llama operación de fabricación (corte, costura,
 * bordado). Cada una pertenece a un PROCESO (`process_group`), que es la otra
 * pantalla del par.
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
    // Una operación pertenece a un PROCESO: el selector del formulario se llena
    // con ese catálogo. La pantalla de Procesos no lo pasa.
    groupListApi: processGroupsListApi,
  });
