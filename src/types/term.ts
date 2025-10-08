export type TermGroup = {
  id: number;
  name: string;
  code: string;
};

export type Term = {
  id: number;
  name: string;
  term_group_id: number;
};
