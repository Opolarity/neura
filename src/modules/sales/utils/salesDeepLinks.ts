// Enlaces que abren una pantalla de ventas ya en un estado concreto (un modal
// abierto, un filtro aplicado). Los usa el dashboard para sus alertas; la
// pantalla destino lee el parámetro al montar y lo quita de la URL para que
// recargar o volver atrás no repita la acción.

/** Productos de franquicia: qué bandeja abrir al entrar. */
export const FRANCHISE_MODAL_PARAM = "modal";
export type FranchiseModal = "cantidades" | "pagos";

export const franchiseModalPath = (modal: FranchiseModal) =>
  `/sales/products/franchise?${FRANCHISE_MODAL_PARAM}=${modal}`;

/** Lista de ventas: situación (estado) a filtrar al entrar. */
export const SALES_SITUATION_PARAM = "situation_id";

export const salesBySituationPath = (situationId: number) =>
  `/sales?${SALES_SITUATION_PARAM}=${situationId}`;
