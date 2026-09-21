import {
  createProcessApi,
  deleteProcessApi,
  processesListApi,
  processGroupsListApi,
  updateProcessApi,
} from "../services/processes.service";
import { useProcessCatalog } from "./useProcessCatalog";

export const useProcesses = () =>
  useProcessCatalog({
    entityLabel: "Proceso",
    listApi: processesListApi,
    createApi: createProcessApi,
    updateApi: updateProcessApi,
    deleteApi: deleteProcessApi,
    // Una operación pertenece a un GRUPO (etapa): el selector del formulario
    // se llena con el catálogo de grupos. El catálogo de grupos no lo pasa.
    groupListApi: processGroupsListApi,
  });
