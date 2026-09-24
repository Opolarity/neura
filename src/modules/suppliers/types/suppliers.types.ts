/** Una clase tal y como viaja en el listado: `sp_get_suppliers` ya manda el id. */
export interface SupplierClassRef {
  id: number;
  name: string;
}

export interface Supplier {
  id: number;
  fullName: string;
  documentType: string;
  documentNumber: string;
  phone: number | null;
  email: string;
  /** Dirección del taller: el punto de llegada de su guía de remisión. */
  address: string;
  classes: SupplierClassRef[];
}

export interface SuppliersFilters {
  search?: string | null;
  page?: number;
  size?: number;
}

export interface SupplierClass {
  id: number;
  name: string;
  code?: string;
}

export interface AccountSearchResult {
  id: number;
  name: string;
  middle_name: string | null;
  last_name: string | null;
  last_name2: string | null;
  document_type_id: number;
  document_number: string;
}

/**
 * Lo que necesita `sp_create_supplier` para dar de alta un proveedor entero.
 *
 * Es UNA sola llamada a propósito: la cuenta, el perfil y las clases entran en
 * la misma transacción, y si el documento ya está registrado el SP reutiliza
 * esa cuenta en vez de intentar crearla otra vez.
 */
export interface CreateSupplierData {
  document_type_id: number;
  document_number: string;
  name: string;
  /** `suppliers_profile.phone` es numérico en la base. */
  phone: number;
  last_name?: string;
  middle_name?: string;
  last_name2?: string;
  /** Opcional: no todo proveedor tiene correo. */
  email?: string;
  address?: string;
  /** Type del módulo SPL: Materia prima, Taller o Todo servicio. */
  supplier_type_id?: number | null;
  class_ids: number[];
}

/**
 * Lo editable de un proveedor ya creado.
 *
 * El nombre y el documento NO estan aqui a proposito: son de `accounts`, y esa
 * cuenta puede ser ademas cliente o usuario del ERP. Renombrarla desde la
 * pantalla de proveedores cambiaria como se ve en las otras.
 */
export interface UpdateSupplierData {
  phone: number;
  email?: string;
  /** A dónde se le manda la mercadería. Va en la guía de remisión. */
  address?: string;
  classIds: number[];
}
