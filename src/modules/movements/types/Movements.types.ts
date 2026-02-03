// =============================================================================
// TIPOS PARA LA RESPUESTA DE LA API (get-movements)
// =============================================================================

interface MovementsData {
  data: Array<{
    id: number;
    amount: number;
    movement_date: string;
    description: string | null;
    type: string;
    class: string;
    payment_method: string;
    business_account: string;
    branches: string;
    user: string;
  }>;
  page: {
    page: number;
    size: number;
    total: number;
  };
}

export interface MovementApiResponse {
  movements: MovementsData | { movements: MovementsData };
}

// =============================================================================
// TIPOS INTERNOS DE LA APLICACION (transformados por el adapter)
// =============================================================================

export type MovementTypeValue = "Ingreso" | "Egreso";

export interface Movement {
  id: number;
  date: string;
  rawDate: string;
  type: MovementTypeValue;
  category: string;
  description: string;
  paymentMethod: string;
  businessAccount: string;
  branch: string;
  user: string;
  amount: number;
  formattedAmount: string;
}

// =============================================================================
// TIPOS PARA FILTROS
// =============================================================================

export interface MovementFilters {
  search?: string | null;
  page?: number;
  size?: number;
  type?: number | null;
  class?: number | null;
  bussines_account?: number | null;
  payment_method?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  branches?: number | null;
  order?: string | null;
}

// =============================================================================
// TIPOS PARA PAGINACION
// =============================================================================

export interface PaginationState {
  p_page: number | null;
  p_size: number | null;
  total: number | null;
}

// =============================================================================
// TIPOS PARA DATOS DE SELECCION (dropdowns)
// =============================================================================

export interface MovementType {
  id: number;
  name: string;
}

export interface MovementCategory {
  id: number;
  name: string;
}

export interface PaymentMethod {
  id: number;
  name: string;
}

export interface BusinessAccount {
  id: number;
  name: string;
}

// =============================================================================
// TIPOS PARA RESUMEN
// =============================================================================

export interface MovementSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

// =============================================================================
// TIPOS PARA FORMULARIOS
// =============================================================================

export interface MovementFormData {
  amount: string;
  movement_date: string;
  description?: string;
  payment_method_id: string;
  movement_class_id: string;
  user_id?: string;
}

export interface PaymentMethodWithAccount {
  id: number;
  name: string;
  business_account_id: number;
  business_accounts: {
    name: string;
  };
}

export interface MovementClass {
  id: number;
  name: string;
  code: string;
}

export interface CurrentUserProfile {
  UID: string;
  name: string;
  last_name: string;
}

// =============================================================================
// TIPOS PARA CREAR MOVIMIENTOS (Edge Function)
// =============================================================================

export interface CreateMovementPayload {
  amount: number;
  movement_date: string;
  description?: string;
  payment_method_id: number;
  movement_type_id: number;
  movement_class_id: number;
}

export interface CreateMovementResponse {
  success: boolean;
  movement: any;
}
