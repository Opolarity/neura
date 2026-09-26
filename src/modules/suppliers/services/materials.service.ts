import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/query";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import {
  CreateMaterialData,
  MaterialStockPayload,
  Material,
  MaterialClass,
  MaterialsFilters,
  SupplierOption,
  MaterialStockEntry,
  MaterialPriceHistoryRow,
  MeasurementUnit,
  UpdateMaterialData,
} from "../types/materials.types";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";
import { MaterialOption } from "../types/services.types";

/**
 * Código del módulo del dominio de materiales. De él cuelgan dos catálogos
 * distintos: las CLASES (`classes`: TELA, AVIOS) y las UNIDADES DE MEDIDA
 * (`types`: MTR, KG…). Son tablas distintas, así que comparten módulo sin
 * pisarse.
 */
const MATERIALS_MODULE_CODE = "MAT";

interface MaterialsListResponse {
  data: Material[];
  pagination: PaginationState;
}

export const materialsListApi = async (
  filters: MaterialsFilters
): Promise<MaterialsListResponse> => {
  const {
    page = 1,
    size = 20,
    search,
    material_class_id,
    supplier_id,
    material_id,
  } = filters;

  const endpoint = buildEndpoint("get-materials", {
    page,
    size,
    search,
    material_class_id,
    supplier_id,
    material_id,
  });

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) throw error;

  const raw = data?.materialsdata ?? { data: [], page: { page, size, total: 0 } };

  const materials: Material[] = (raw.data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name ?? "",
    quantity: Number(row.quantity ?? 0),
    measurementUnit: row.measurement_unit ?? "",
    unitCost: row.unit_cost === null || row.unit_cost === undefined ? null : Number(row.unit_cost),
    unitCostMax:
      row.unit_cost_max === null || row.unit_cost_max === undefined ? null : Number(row.unit_cost_max),
    variationsCount: Number(row.variations_count ?? 0),
    suppliersCount: Number(row.suppliers_count ?? 0),
    variations: (Array.isArray(row.variations) ? row.variations : []).map((v: any) => ({
      id: Number(v.id),
      code: v.code ?? "",
      label: v.label ?? row.name ?? "",
      termsLabel: v.terms_label ?? null,
      terms: (Array.isArray(v.terms) ? v.terms : []).map((t: any) => ({
        id: Number(t.id),
        name: t.name ?? "",
        groupId: Number(t.material_term_group_id),
        groupName: t.material_term_group_name ?? "",
      })),
      unitCost: v.unit_cost === null || v.unit_cost === undefined ? null : Number(v.unit_cost),
      supplierId: v.supplier_id ?? null,
      supplierName: v.supplier_name ?? null,
      isActive: v.is_active !== false,
      stock: Number(v.stock ?? 0),
      stockEntries: (Array.isArray(v.stock_entries) ? v.stock_entries : []).map((e: any) => ({
        warehouseId: Number(e.warehouse_id),
        stockTypeId: Number(e.stock_type_id),
        stock: Number(e.stock ?? 0),
      })),
    })),
    materialClassId: row.material_class_id,
    materialClassName: row.material_class_name ?? "",
    materialRootClassId: row.material_root_class_id ?? row.material_class_id,
    materialRootClassName:
      row.material_root_class_name ?? row.material_class_name ?? "",
    supplierId: row.supplier_id ?? null,
    supplierName: row.supplier_name ?? "",
    lastServiceReference: row.last_service_reference ?? null,
    images: Array.isArray(row.images) ? row.images.filter(Boolean) : [],
    createdAt: row.created_at ?? "",
  }));

  return {
    data: materials,
    pagination: {
      p_page: raw.page?.page ?? page,
      p_size: raw.page?.size ?? size,
      total: raw.page?.total ?? 0,
    },
  };
};

export const createMaterialApi = async (
  materialData: CreateMaterialData
): Promise<MaterialOption> => {
  const { data, error } = await supabase.functions.invoke("create-material", {
    method: "POST",
    body: materialData,
  });

  if (error) throw error;

  const row = data?.data ?? {};

  return {
    id: row.id,
    name: row.name ?? materialData.name,
    unitCost: row.unit_cost === null || row.unit_cost === undefined ? null : Number(row.unit_cost),
    measurementUnit: row.measurement_unit ?? materialData.measurement_unit,
    // La clase la conoce el alta; el nombre no siempre vuelve en la respuesta,
    // así que lo completa quien llama con el catálogo que ya tiene cargado.
    materialClassId: row.material_class_id ?? materialData.material_class_id ?? null,
    materialClassName: row.material_class_name ?? null,
  };
};

/** Lo que manda la ficha: el material y, si se editaron, sus variaciones. */
export interface SaveMaterialPayload {
  material: {
    id?: number;
    name: string;
    material_class_id: number;
    measurement_unit: string;
    images?: string[];
  };
  /**
   * La lista completa de variaciones: las que falten se desactivan. Null =
   * no tocarlas (solo se guarda el material).
   */
  variations: Array<{
    id?: number | null;
    term_ids: number[];
    unit_cost: number | null;
    supplier_id: number | null;
    stock?: MaterialStockPayload[];
  }> | null;
}

/**
 * Guarda la ficha entera en una transacción (sp_save_material): el material,
 * sus variaciones con términos, costo y proveedor, y el stock de cada una.
 */
export const saveMaterialApi = async (
  payload: SaveMaterialPayload
): Promise<{ id: number; variations: Array<{ id: number; code: string; label: string; is_active: boolean }> }> => {
  const response = await invokeFunction<{ data?: { id: number; variations: Array<{ id: number; code: string; label: string; is_active: boolean }> } }>(
    "save-material",
    { method: "POST", body: payload }
  );
  if (!response?.data) throw new Error("No se pudo guardar el material");
  return response.data;
};

export const updateMaterialApi = async (
  materialData: UpdateMaterialData
): Promise<void> => {
  const { error } = await supabase.functions.invoke("update-material", {
    method: "POST",
    body: materialData,
  });

  if (error) throw error;
};

/** Clases del módulo de materiales (classes filtradas por modules.code = 'MAT'). */
export const materialClassesApi = async (): Promise<MaterialClass[]> => {
  const { data: moduleData, error: moduleError } = await (supabase as any)
    .from("modules")
    .select("id")
    .eq("code", MATERIALS_MODULE_CODE)
    .single();

  if (moduleError) throw moduleError;

  const { data, error } = await (supabase as any)
    .from("classes")
    .select("id, name, code, parent_class_id")
    .eq("module_id", moduleData.id)
    // Una clase eliminada es una baja logica: no se ofrece en ningun selector.
    // Los materiales viejos no pueden colgar de ella (sp_delete_material_class
    // no deja eliminar una clase con materiales).
    .eq("is_active", true)
    .order("name");

  if (error) throw error;
  return data ?? [];
};

/**
 * Alta de una clase de material, opcionalmente colgando de otra.
 *
 * Es el ÚNICO sitio del ERP que inserta en `classes`: los demás servicios que
 * tocan esa tabla solo leen.
 */
export const createMaterialClassApi = async (
  name: string,
  parentClassId?: number | null
): Promise<MaterialClass> => {
  const { data: moduleData, error: moduleError } = await (supabase as any)
    .from("modules")
    .select("id")
    .eq("code", MATERIALS_MODULE_CODE)
    .single();

  if (moduleError) throw moduleError;

  const { data, error } = await (supabase as any)
    .from("classes")
    .insert({
      name,
      module_id: moduleData.id,
      // Sin code A PROPOSITO. En el modulo MAT el code marca raiz canonica
      // (MAT-TELA, MAT-AVIOS); estampar 'MAT' en cada clase nueva volveria a
      // llenar la columna del ruido que 202610010053 limpia. La familia de una
      // clase se resuelve subiendo por parent_class_id, no por el code.
      code: null,
      // null explícito cuando no cuelga de ninguna: es lo que la columna ya
      // esperaba y lo que tienen todas las de hoy.
      parent_class_id: parentClassId ?? null,
    })
    .select("id, name, code, parent_class_id")
    .single();

  if (error) throw error;
  return data;
};

/**
 * Renombrar una clase o cambiarle el padre.
 *
 * Se edita desde donde se crea -- el propio material -- porque es ahi donde se
 * descubre el error: uno la crea a mitad de dar de alta un material, la
 * escribe mal o la cuelga de la familia equivocada, y sin esto habria que
 * salir a Materiales, buscarla y volver.
 *
 * El `code` NO se toca: en el modulo MAT marca las raices canonicas
 * (MAT-TELA, MAT-AVIOS) y renombrar una clase no la convierte en otra familia.
 */
export const updateMaterialClassApi = async (
  id: number,
  name: string,
  parentClassId?: number | null
): Promise<MaterialClass> => {
  const { data, error } = await plano
    .from("classes")
    .update({ name, parent_class_id: parentClassId ?? null })
    .eq("id", id)
    .select("id, name, code, parent_class_id")
    .single<MaterialClass>();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("La clase no se pudo guardar");
  return data;
};

/**
 * Eliminar una clase de material: baja logica (`classes.is_active = false`).
 *
 * La valida la base: si aun tiene materiales o clases activas dentro, el SP la
 * rechaza con un mensaje que dice que mover primero.
 */
export const deleteMaterialClassApi = async (id: number): Promise<void> => {
  const { error } = await (supabase as any).rpc("sp_delete_material_class", {
    p_class_id: id,
  });

  if (error) throw new Error(error.message);
};

/** Proveedores disponibles para asignar al material. */
export const supplierOptionsApi = async (
  search?: string | null
): Promise<SupplierOption[]> => {
  const endpoint = buildEndpoint("get-suppliers", { page: 1, size: 100, search });

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) throw error;

  const rows = data?.suppliersdata?.data ?? [];

  return rows.map((row: any) => ({
    id: row.id,
    name: [row.name, row.middle_name, row.last_name, row.last_name2]
      .filter(Boolean)
      .join(" "),
  }));
};

/** Unidades de medida de material (`types` del módulo MAT). */
export const measurementUnitsApi = async (): Promise<MeasurementUnit[]> => {
  const { data, error } = await (supabase as any)
    .from("types")
    .select("id, code, name, modules!inner(code)")
    .eq("modules.code", MATERIALS_MODULE_CODE)
    .eq("is_active", true)
    .order("name");

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    code: row.code,
    name: row.name ?? "",
  }));
};

/**
 * El desglose de stock de un material, por almacen y tipo.
 *
 * Lectura directa: RLS ya acota por tenant y aqui no hay ninguna regla de
 * negocio que justifique un SP -- son las filas de una tabla tal cual.
 */
export const materialStockApi = async (
  materialId: number
): Promise<MaterialStockEntry[]> => {
  const { data, error } = await (supabase as any)
    .from("material_stock")
    .select("warehouse_id, stock_type_id, stock")
    .eq("material_id", materialId);

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    warehouseId: row.warehouse_id,
    stockTypeId: row.stock_type_id,
    stock: Number(row.stock ?? 0),
  }));
};

interface MaterialPriceHistoryResponse {
  data: MaterialPriceHistoryRow[];
  pagination: PaginationState;
}

/** Qué se ha pagado por el material y a quién, una fila por cotización. */
export const materialPriceHistoryApi = async (
  materialId: number,
  page = 1,
  size = 20
): Promise<MaterialPriceHistoryResponse> => {
  const endpoint = buildEndpoint("get-material-price-history", {
    material_id: materialId,
    page,
    size,
  });

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) throw error;

  const raw = data?.historydata ?? { data: [], page: { page, size, total: 0 } };

  return {
    data: (raw.data ?? []).map((row: any) => ({
      serviceId: row.service_id,
      serviceCode: row.service_code ?? null,
      serviceDescription: row.service_description ?? "",
      quotationId: row.quotation_id,
      quotationCode: row.quotation_code ?? null,
      quotationDescription: row.quotation_description ?? "",
      supplierId: row.supplier_id ?? null,
      supplierName: row.supplier_name ?? "",
      quantity: row.quantity === null || row.quantity === undefined ? null : Number(row.quantity),
      price: row.price === null || row.price === undefined ? null : Number(row.price),
      unitCost:
        row.unit_cost === null || row.unit_cost === undefined ? null : Number(row.unit_cost),
      measurementUnit: row.measurement_unit ?? "",
      situationName: row.situation_name ?? "",
      createdAt: row.created_at ?? "",
      isCurrent: row.is_current === true,
    })),
    pagination: {
      p_page: raw.page?.page ?? page,
      p_size: raw.page?.size ?? size,
      total: raw.page?.total ?? 0,
    },
  };
};

/** Un material por su id, con la MISMA forma que el listado. */
export const materialByIdApi = async (id: number): Promise<Material | null> => {
  const { data } = await materialsListApi({ material_id: id, page: 1, size: 1 });
  return data[0] ?? null;
};

/** El proveedor habitual de un material, para precargar la compra. */
export interface MaterialSupplier {
  materialId: number;
  supplierId: number | null;
  supplierName: string | null;
}

/**
 * Un `from(...).select(...).in(...)` sin los tipos generados.
 *
 * Los de Supabase se ahogan en estas dos consultas —«type instantiation is
 * excessively deep»: el union de tablas es enorme y `.in()` lo multiplica— y
 * el compilador se rinde antes de comprobar nada. Se acota el escape a la
 * forma exacta que se usa, en vez de tirar de `any`: lo que devuelve cada
 * consulta se declara abajo, fila a fila.
 */
type SelectIn = {
  from: (table: string) => {
    select: (columns: string) => {
      in: <T>(
        column: string,
        values: number[]
      ) => Promise<{ data: T[] | null; error: { message: string } | null }>;
    };
    /** `update(...).eq(...).select(...).single()`, la otra forma que se usa. */
    update: (values: Record<string, unknown>) => {
      eq: (
        column: string,
        value: number
      ) => {
        select: (columns: string) => {
          single: <T>() => Promise<{
            data: T | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };
};

/**
 * El cliente sin tipar, resuelto UNA vez.
 *
 * El cast va sobre `supabase` y no sobre `supabase.from(...)`: llamar a `from`
 * con los tipos generados ya dispara la instanciación profunda, así que
 * castear después llega tarde.
 */
const plano = supabase as unknown as SelectIn;

/**
 * Con qué proveedor se compra normalmente cada material.
 *
 * Es lo que precarga el diálogo de compra desde el requerimiento: quien pide
 * jersey se lo pide a quien se lo pide siempre, y obligar a elegirlo de nuevo
 * en cada línea sería pedir un dato que la ficha del material ya tiene.
 *
 * `supplier_id` admite nulo — un material puede no tener proveedor asignado —
 * y entonces la línea nace sin él y hay que elegirlo.
 */
export const materialSuppliersApi = async (
  materialIds: number[]
): Promise<MaterialSupplier[]> => {
  if (materialIds.length === 0) return [];

  // Dos consultas planas y no un embebido `materials → suppliers_profile →
  // accounts`: anidado, los tipos generados directamente no compilan.
  const { data: materiales, error } = await plano
    .from("materials")
    .select("id, supplier_id")
    .in<{ id: number; supplier_id: number | null }>("id", materialIds);

  if (error) throw new Error(error.message);

  const filas = materiales ?? [];

  const supplierIds = [
    ...new Set(
      filas
        .map((fila) => fila.supplier_id)
        .filter((id): id is number => id !== null)
    ),
  ];

  const nombres = new Map<number, string>();

  if (supplierIds.length > 0) {
    // El perfil de proveedor comparte PK con la cuenta: el nombre sale de
    // `accounts` con el mismo id.
    const { data: cuentas, error: errorCuentas } = await plano
      .from("accounts")
      .select("id, name, middle_name, last_name, last_name2")
      .in<{
        id: number;
        name: string | null;
        middle_name: string | null;
        last_name: string | null;
        last_name2: string | null;
      }>("id", supplierIds);

    if (errorCuentas) throw new Error(errorCuentas.message);

    (cuentas ?? []).forEach((cuenta) => {
      const nombre = [
        cuenta.name,
        cuenta.middle_name,
        cuenta.last_name,
        cuenta.last_name2,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();
      if (nombre) nombres.set(cuenta.id, nombre);
    });
  }

  return filas.map((fila) => ({
    materialId: fila.id,
    supplierId: fila.supplier_id,
    supplierName:
      fila.supplier_id !== null
        ? (nombres.get(fila.supplier_id) ?? null)
        : null,
  }));
};

/**
 * Sube una foto del material y devuelve su URL pública.
 *
 * Va al bucket `products`, bajo su propia carpeta: es el único bucket público
 * del ERP y crear otro sería tocar storage en el VPS por una carpeta. La ruta
 * no lleva el id del material a propósito: en el alta todavía no existe, y
 * así la foto se sube en cuanto se elige y el material nace con sus URLs.
 */
export const uploadMaterialImageApi = async (file: File): Promise<string> => {
  const extension = file.name.split(".").pop() || "jpg";
  const path = `materials-images/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from("products")
    .upload(path, file, { upsert: false, contentType: file.type });

  if (error) throw error;

  return supabase.storage.from("products").getPublicUrl(path).data.publicUrl;
};

/**
 * Borra del storage una foto que se quitó del material.
 *
 * Solo las de nuestra carpeta: una URL ajena se ignora. Y a lo mejor: si
 * falla, la foto ya no está en la lista y eso es lo que importa; un fichero
 * huérfano en el bucket no se lo enseña a nadie.
 */
export const removeMaterialImageApi = async (url: string): Promise<void> => {
  const marker = "/products/";
  const index = url.indexOf(marker);
  if (index === -1) return;
  const path = url.slice(index + marker.length);
  if (!path.startsWith("materials-images/")) return;
  try {
    await supabase.storage.from("products").remove([path]);
  } catch {
    // Ver arriba.
  }
};
