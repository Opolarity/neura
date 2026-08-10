export interface Brand {
  id: number;
  code: string;
  name: string;
  /** Siempre 'brand': marcas y etiquetas comparten la tabla `tags`. */
  type: string;
  created_at: string;
  products_count: number;
}

export interface BrandsPage {
  page: number;
  size: number;
  total: number;
}

export interface GetBrandsResponse {
  data: Brand[];
  page: BrandsPage;
}

export interface CreateBrandPayload {
  name: string;
  code: string;
}

export interface EditBrandPayload extends CreateBrandPayload{
  id: number
}
