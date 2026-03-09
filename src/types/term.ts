export type TermGroup = {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  is_active?: boolean;
};

export type Term = {
  id: number;
  name: string;
  term_group_id: number;
  is_active?: boolean;
};
