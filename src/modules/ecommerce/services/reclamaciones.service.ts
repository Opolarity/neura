import { supabase } from "@/integrations/supabase/client";

export interface Reclamacion {
  id: number;
  email: string;
  incident_date: string;
  amount_claim: number;
  claim_type: string;
  detail?: string;
  order_id?: string | null;
}

export interface ReclamacionDetalle extends Reclamacion {
  requester_name?: string;
  requester_last_name?: string;
  requester_last_name2?: string;
  requester_phone?: string;
  requester_document_type?: string;
  requester_document_type_id?: string | number;
  requester_document_number?: string;
  requester_country?: string;
  requester_country_id?: string | number;
  requester_department?: string;
  requester_state?: string;
  requester_state_id?: string | number;
  requester_city?: string;
  requester_city_id?: string | number;
  requester_district?: string;
  requester_neighborhood_id?: string | number;
  requester_address?: string;
  requester_age?: boolean | string;
  representative_name?: string;
  representative_email?: string;
  representative_phone?: string;
  representative_document_type?: string;
  representative_document_type_id?: string | number;
  representative_document_number?: string;
  representative_country?: string;
  representative_department?: string;
  representative_city?: string;
  representative_district?: string;
  representative_address?: string;
  complaint_description?: string;
  claimant_request?: string;
  good?: string;
  terms?: boolean | string;
  created_at?: string;
  raw?: Record<string, unknown>;
}

type RawReclamacion = Partial<{
  id: number | string;
  email: string;
  correo: string;
  nombres: string;
  nombre: string;
  name: string;
  last_name: string;
  last_name2: string;
  nombre_reclamante: string;
  nombres_reclamante: string;
  cliente_nombre: string;
  cliente_nombres: string;
  full_name: string;
  telefono: string;
  celular: string;
  phone: string;
  telefono_reclamante: string;
  celular_reclamante: string;
  cliente_telefono: string;
  tipo_documento: string;
  document_type: string;
  document_type_id: string | number;
  numero_documento: string;
  document_number: string;
  pais: string;
  country: string;
  country_name: string;
  country_id: string | number;
  departamento: string;
  department: string;
  state_id: string | number;
  state_name: string;
  ciudad: string;
  city: string;
  city_id: string | number;
  distrito: string;
  district: string;
  neighborhood_id: string | number;
  direccion: string;
  address: string;
  correo_reclamante: string;
  email_reclamante: string;
  cliente_correo: string;
  cliente_email: string;
  name_apoderado: string;
  apoderado_nombres: string;
  apoderado_nombre: string;
  representative_name: string;
  apoderado_correo: string;
  apoderado_email: string;
  representative_email: string;
  apoderado_telefono: string;
  apoderado_phone: string;
  representative_phone: string;
  apoderado_tipo_documento: string;
  apoderado_document_type_name: string;
  representative_document_type: string;
  apoderado_document_type_id: string | number;
  apoderado_numero_documento: string;
  apoderado_document_number: string;
  representative_document_number: string;
  apoderado_pais: string;
  representative_country: string;
  apoderado_departamento: string;
  representative_department: string;
  apoderado_ciudad: string;
  representative_city: string;
  apoderado_distrito: string;
  representative_district: string;
  apoderado_direccion: string;
  representative_address: string;
  age: boolean | string;
  incident_date: string;
  fecha_incidente: string;
  amount_claim: number | string;
  monto: number | string;
  claim_type: string;
  tipo_reclamo: string;
  tipo_queja_reclamo: string;
  detail: string;
  detalle: string;
  claim_description: string;
  good: string;
  descripcion_reclamo: string;
  descripcion: string;
  complaining_request: string;
  pedido_reclamante: string;
  solicitud_reclamante: string;
  terms: boolean | string;
  order_id: number | string | null;
  orden_id: number | string | null;
  created_at: string;
}>;

const toNumber = (value: number | string | null | undefined, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getText = (...values: Array<unknown>) => {
  const match = values.find(
    (value) => typeof value === "string" && value.trim().length > 0,
  );
  return typeof match === "string" ? match : "";
};

const normalizeClaimType = (item: RawReclamacion) => {
  const rawType =
    item.claim_type || item.tipo_reclamo || item.tipo_queja_reclamo;
  if (!rawType) {
    const fallbackDetail = item.detail || item.detalle || "";
    const fallbackNormalized = fallbackDetail.trim().toLowerCase();
    if (fallbackNormalized === "queja") return "Queja";
    if (
      fallbackNormalized === "reclamacion" ||
      fallbackNormalized === "reclamación" ||
      fallbackNormalized === "reclamo"
    ) {
      return "Reclamo";
    }
    return "Reclamo";
  }

  const normalized = rawType.trim().toLowerCase();
  if (normalized === "queja") return "Queja";
  if (
    normalized === "Reclamacion" ||
    normalized === "Reclamación" ||
    normalized === "Reclamo"
  ) {
    return "Reclamo";
  }

  return "Reclamo";
};

const normalizeReclamacion = (item: RawReclamacion): Reclamacion => ({
  id: toNumber(item.id),
  email: item.email || item.correo || "-",
  incident_date:
    item.incident_date || item.fecha_incidente || item.created_at || "",
  amount_claim: toNumber(item.amount_claim ?? item.monto),
  claim_type: normalizeClaimType(item),
  detail: item.detail || item.detalle || "",
  order_id:
    item.order_id != null
      ? String(item.order_id)
      : item.orden_id != null
        ? String(item.orden_id)
        : null,
});

const normalizeReclamacionDetalle = (
  item: RawReclamacion,
): ReclamacionDetalle => ({
  ...normalizeReclamacion(item),
  requester_name: getText(
    item.nombres,
    item.nombre,
    item.name,
    item.nombre_reclamante,
    item.nombres_reclamante,
    item.cliente_nombre,
    item.cliente_nombres,
    item.full_name,
  ),
  requester_last_name: getText(item.last_name),
  requester_last_name2: getText(item.last_name2),
  requester_phone: getText(
    item.telefono,
    item.celular,
    item.phone,
    item.telefono_reclamante,
    item.celular_reclamante,
    item.cliente_telefono,
  ),
  requester_document_type: getText(item.tipo_documento, item.document_type),
  requester_document_type_id:
    item.document_type_id ?? item.apoderado_document_type_id ?? undefined,
  requester_document_number: getText(
    item.numero_documento,
    item.document_number,
  ),
  requester_country: getText(item.country_name, item.pais, item.country),
  requester_country_id: item.country_id ?? undefined,
  requester_department: getText(item.departamento, item.department),
  requester_state: getText(item.state_name),
  requester_state_id: item.state_id ?? undefined,
  requester_city: getText(item.ciudad, item.city),
  requester_city_id: item.city_id ?? undefined,
  requester_district: getText(item.distrito, item.district),
  requester_neighborhood_id: item.neighborhood_id ?? undefined,
  requester_address: getText(item.direccion, item.address),
  requester_age: item.age ?? undefined,
  representative_name: getText(
    item.name_apoderado,
    item.apoderado_nombres,
    item.apoderado_nombre,
    item.representative_name,
  ),
  representative_email: getText(
    item.apoderado_email,
    item.apoderado_correo,
    item.representative_email,
  ),
  representative_phone: getText(
    item.apoderado_phone,
    item.apoderado_telefono,
    item.representative_phone,
  ),
  representative_document_type: getText(
    item.apoderado_document_type_name,
    item.apoderado_tipo_documento,
    item.representative_document_type,
  ),
  representative_document_type_id: item.apoderado_document_type_id ?? undefined,
  representative_document_number: getText(
    item.apoderado_document_number,
    item.apoderado_numero_documento,
    item.representative_document_number,
  ),
  representative_country: getText(
    item.apoderado_pais,
    item.representative_country,
  ),
  representative_department: getText(
    item.apoderado_departamento,
    item.representative_department,
  ),
  representative_city: getText(item.apoderado_ciudad, item.representative_city),
  representative_district: getText(
    item.apoderado_distrito,
    item.representative_district,
  ),
  representative_address: getText(
    item.apoderado_direccion,
    item.representative_address,
  ),
  complaint_description: getText(
    item.claim_description,
    item.descripcion_reclamo,
    item.descripcion,
  ),
  claimant_request: getText(
    item.complaining_request,
    item.pedido_reclamante,
    item.solicitud_reclamante,
  ),
  good: getText(item.good),
  terms: item.terms ?? undefined,
  created_at: item.created_at,
  raw: item as Record<string, unknown>,
});

export const getReclamaciones = async (params?: {
  page?: number;
  size?: number;
  search?: string;
  order_id?: string;
  incident_date?: string;
  amount?: number;
  detail?: string;
}) => {
  const payload = {
    orden_id: params?.order_id,
    search: params?.search?.trim() || undefined,
    fecha_incidente: params?.incident_date,
    monto: params?.amount,
    detalle: params?.detail,
  };

  const { data, error } = await supabase.functions.invoke("get-reclamaciones", {
    body: payload,
  });

  if (error) {
    throw new Error(error.message || "Error al obtener reclamaciones");
  }

  const source = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
      ? data
      : [];
  const allData = source.map((item: RawReclamacion) =>
    normalizeReclamacion(item),
  );

  const page = params?.page || 1;
  const size = params?.size || 20;
  const from = (page - 1) * size;
  const to = from + size;

  return {
    data: allData.slice(from, to),
    total: allData.length,
  };
};

export const getReclamacionById = async (
  id: number,
): Promise<ReclamacionDetalle> => {
  const { data, error } = await supabase.functions.invoke(
    "get-reclamacion-by-id",
    {
      body: { id },
    },
  );

  if (error) {
    throw new Error(error.message || "Error al obtener la reclamacion");
  }

  const rawItem = Array.isArray(data?.data)
    ? data.data[0]
    : data?.data && typeof data.data === "object"
      ? data.data
      : data && typeof data === "object"
        ? data
        : null;

  if (!rawItem) {
    throw new Error("No se encontro la reclamacion");
  }

  return normalizeReclamacionDetalle(rawItem as RawReclamacion);
};
