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

export interface CreateAccountData {
  name: string;
  middle_name?: string;
  last_name: string;
  last_name2?: string;
  document_type_id: number;
  document_number: string;
}

export interface CreateSupplierProfileData {
  id: number;
  email?: string;
  phone: number;
  address?: string;
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
