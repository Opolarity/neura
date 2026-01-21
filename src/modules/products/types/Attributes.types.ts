export interface TermItem {
  id: number;
  name: string;
  products: number;
}

export interface AttributeGroup {
  group_id: number;
  group_name: string;
  terms: TermItem[];
}

export interface AttributesApiResponse {
  page: {
    page: number;
    size: number;
    total: number;
  };
  data: AttributeGroup[];
}

export interface AttributeRow {
  id: number;
  type: 'group' | 'term';
  name: string;
  products: number;
  groupId?: number;
  groupName?: string;
}

export interface AttributeFilters {
  search: string | null;
  minProducts: number | null;
  maxProducts: number | null;
  group: number | null;
  order: string | null;
  page: number;
  size: number;
}

export interface AttributePaginationState {
  p_page: number;
  p_size: number;
  total: number;
}

// Form values para crear/editar term_group
export interface AttributeFormValues {
  id?: number;
  code: string;
  name: string;
  description?: string | null;
}

// Form values para crear/editar term
export interface TermFormValues {
  id?: number;
  name: string;
  term_group_id: number | null;
}

// Para el selector de grupos
export interface TermGroupOption {
  id: number;
  code: string;
  name: string;
}
