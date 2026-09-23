import type { BadgeProps } from "@/components/ui/badge";
import { formatDateTime } from "@/shared/utils/date";
import type {
  AuditAction,
  AuditActorSource,
  AuditData,
  AuditEntity,
  AuditFieldChange,
} from "../types/AuditLog.types";

// Diccionario de la vista Auditoría. El ERP no tiene i18n: estos textos siguen
// los que ya se ven en cada pantalla (Ventas, Productos, Clientes, Caja…).

export const AUDIT_TABLE_LABELS: Record<string, string> = {
  orders: "Venta",
  order_products: "Producto de venta",
  order_payment: "Pago de venta",
  order_situations: "Estado de venta",
  movements: "Movimiento de caja",
  stock_movements: "Movimiento de stock",
  products: "Producto",
  variations: "Variación",
  product_stock: "Stock",
  price_list: "Lista de precios",
  price_rules: "Regla de precio",
  profiles: "Perfil de usuario",
  user_roles: "Rol de usuario",
  roles: "Rol",
  role_permissions: "Permiso de rol",
  accounts: "Cliente",
  customer_profile: "Perfil de cliente",
};

export const tableLabel = (table: string): string => AUDIT_TABLE_LABELS[table] ?? table;

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  INSERT: "Creó",
  UPDATE: "Modificó",
  DELETE: "Eliminó",
};

export const AUDIT_ACTION_VARIANT: Record<AuditAction, BadgeProps["variant"]> = {
  INSERT: "success",
  UPDATE: "info",
  DELETE: "destructive-soft",
};

export const AUDIT_SOURCE_LABELS: Record<AuditActorSource, string> = {
  jwt: "Usuario ERP",
  sp: "Proceso interno",
  cron: "Tarea programada",
  chatbot: "Chatbot",
  ecommerce: "Ecommerce",
  franchise: "Franquicia",
  service: "Servicio",
  anon: "Anónimo",
  direct: "Directo en base",
};

// El origen no es un estado: va en outline, salvo "directo en base", que es un
// cambio hecho fuera de la aplicación y conviene que resalte.
export const AUDIT_SOURCE_VARIANT: Record<AuditActorSource, BadgeProps["variant"]> = {
  jwt: "outline",
  sp: "outline",
  cron: "outline",
  chatbot: "outline",
  ecommerce: "outline",
  franchise: "outline",
  service: "outline",
  anon: "outline",
  direct: "warning",
};

export const AUDIT_ENTITY_LABELS: Record<AuditEntity, string> = {
  venta: "Venta",
  producto: "Producto",
  cliente: "Cliente",
  usuario: "Usuario",
};

export const AUDIT_ENTITY_ID_HINT: Record<AuditEntity, string> = {
  venta: "Número de venta, p. ej. 175878",
  producto: "ID del producto",
  cliente: "ID del cliente",
  usuario: "ID (UUID) del usuario",
};

// Nombres de columna frecuentes. Una columna que no esté aquí se muestra con su
// nombre técnico: mejor eso que inventar un label.
export const AUDIT_FIELD_LABELS: Record<string, string> = {
  id: "ID",
  created_at: "Creado",
  updated_at: "Actualizado",
  created_by: "Creado por",
  updated_by: "Actualizado por",
  user_id: "Usuario",
  is_active: "Activo",
  active: "Activo",
  // ventas
  date: "Fecha",
  subtotal: "Subtotal",
  discount: "Descuento",
  total: "Total",
  shipping_cost: "Costo de envío",
  shipping_method_id: "Método de envío",
  shipping_method_code: "Método de envío",
  customer_name: "Nombre del cliente",
  customer_lastname: "Apellido del cliente",
  document_type: "Tipo de documento",
  document_number: "Número de documento",
  email: "Email",
  phone: "Celular",
  phone_whatsapp: "WhatsApp",
  address: "Dirección",
  address_reference: "Referencia",
  reception_person: "Persona que recibe",
  reception_phone: "Teléfono de contacto",
  country_id: "País",
  state_id: "Departamento",
  city_id: "Provincia",
  neighborhood_id: "Distrito",
  sale_type_id: "Canal de venta",
  price_list_code: "Lista de precios",
  price_list_id: "Lista de precios",
  branch_id: "Sucursal",
  warehouse_id: "Almacén",
  warehouses_id: "Almacén",
  consignament: "Consignación",
  sended_to_franchise_at: "Enviado a franquicia",
  sended_to_franchise_by: "Enviado a franquicia por",
  change: "Vuelto",
  order_id: "Venta",
  // líneas de venta
  product_variation_id: "Variación",
  product_name: "Producto",
  quantity: "Cantidad",
  product_price: "Precio",
  product_discount: "Descuento",
  unit_cost: "Costo unitario",
  stock_movement_id: "Movimiento de stock",
  // pagos y caja
  payment_method_id: "Método de pago",
  amount: "Monto",
  completed: "Completado",
  voucher_url: "Comprobantes",
  movement_id: "Movimiento de caja",
  business_account_id: "Cuenta de destino",
  business_acount_id: "Cuenta de destino",
  gateway_confirmation_code: "Código de confirmación",
  movement_type_id: "Tipo de movimiento",
  movement_class_id: "Motivo",
  movement_date: "Fecha del movimiento",
  description: "Descripción",
  files_url: "Adjuntos",
  // estados
  status_id: "Estado",
  situation_id: "Situación",
  last_row: "Último estado",
  // stock
  stock: "Stock",
  stock_type_id: "Tipo de inventario",
  movement_type: "Tipo de movimiento",
  vinculated_movement_id: "Movimiento vinculado",
  // productos
  title: "Nombre del producto",
  short_description: "Descripción corta",
  is_variable: "Es variable",
  web: "Visible en la web",
  sku: "SKU",
  product_cost: "Costo",
  product_id: "Producto",
  promotional_text: "Texto promocional",
  sizes_image_url: "Imagen de tallas",
  exhibition_start_date: "Inicio de exhibición",
  exhibition_end_date: "Fin de exhibición",
  // precios
  name: "Nombre",
  code: "Código",
  priority: "Prioridad",
  valid_from: "Válida desde",
  valid_to: "Válida hasta",
  // clientes y usuarios
  middle_name: "Segundo nombre",
  last_name: "Primer apellido",
  last_name2: "Segundo apellido",
  document_type_id: "Tipo de documento",
  points: "Puntos",
  amount_spent: "Monto gastado",
  orders_quantity: "Compras",
  account_id: "Cliente",
  user_name: "Usuario",
  role_id: "Rol",
  admin: "Administrador",
  permission_id: "Permiso",
};

export const fieldLabel = (field: string): string => AUDIT_FIELD_LABELS[field] ?? field;

const MONEY_FIELDS = new Set([
  "subtotal",
  "discount",
  "total",
  "shipping_cost",
  "change",
  "product_price",
  "product_discount",
  "unit_cost",
  "amount",
  "product_cost",
  "amount_spent",
  "price",
  "sale_price",
  "paid_by_franchise",
]);

const isDateField = (field: string): boolean =>
  field.endsWith("_at") ||
  field.endsWith("_date") ||
  field === "date" ||
  field === "valid_from" ||
  field === "valid_to";

const EMPTY = "vacío";

/** Valor legible de una columna de audit_log (montos, fechas en Lima, sí/no…). */
export const formatAuditValue = (field: string, value: unknown): string => {
  if (value === null || value === undefined || value === "") return EMPTY;
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (Array.isArray(value)) return value.length === 0 ? EMPTY : value.map(String).join(", ");
  if (typeof value === "object") return JSON.stringify(value);

  if (MONEY_FIELDS.has(field)) {
    const n = Number(value);
    if (Number.isFinite(n)) {
      return `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  }

  if (typeof value === "string" && isDateField(field) && !Number.isNaN(Date.parse(value))) {
    return formatDateTime(value);
  }

  return String(value);
};

const sortedKeys = (data: AuditData): string[] => {
  const keys = Object.keys(data);
  return keys.sort((a, b) => (a === "id" ? -1 : b === "id" ? 1 : 0));
};

/**
 * Filas "Campo / Antes / Después".
 * UPDATE: solo lo que cambió. INSERT: los valores creados. DELETE: los eliminados.
 * En INSERT y DELETE se omiten las columnas vacías para no llenar el panel de ruido.
 */
export const buildFieldChanges = (
  action: AuditAction,
  changedFields: string[],
  oldData: AuditData | null,
  newData: AuditData | null,
): AuditFieldChange[] => {
  if (action === "UPDATE") {
    return changedFields.map((field) => ({
      field,
      label: fieldLabel(field),
      before: formatAuditValue(field, oldData?.[field]),
      after: formatAuditValue(field, newData?.[field]),
    }));
  }

  const data = (action === "INSERT" ? newData : oldData) ?? {};
  return sortedKeys(data)
    .filter((field) => formatAuditValue(field, data[field]) !== EMPTY)
    .map((field) => {
      const value = formatAuditValue(field, data[field]);
      return {
        field,
        label: fieldLabel(field),
        before: action === "DELETE" ? value : "—",
        after: action === "INSERT" ? value : "—",
      };
    });
};
