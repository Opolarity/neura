// Fila cruda de la tabla customer_levels (snake_case), tal como llega de Supabase.
export interface CustomerLevelRow {
  id: number;
  sort_order: number;
  name: string;
  min_points: number;
  max_points: number | null;
  color: string | null;
  image_url: string | null;
  subtitle: string | null;
  active: boolean;
}

// Tipo de UI (camelCase). El descuento no vive aqui: lo pone la regla de precio
// que elige el nivel.
export interface CustomerLevel {
  id: number;
  sortOrder: number;
  name: string;
  minPoints: number;
  maxPoints: number | null; // null = nivel mas alto (sin tope)
  color: string | null;
  imageUrl: string | null;
  subtitle: string | null;
  active: boolean;
}

// Lo que el formulario envia al guardar. id undefined = alta.
export interface CustomerLevelPayload {
  id?: number;
  name: string;
  minPoints: number;
  maxPoints: number | null;
  color: string | null;
  imageUrl: string | null;
  subtitle: string | null;
  active: boolean;
  sortOrder?: number | null; // null/undefined = el RPC lo pone al final
}
