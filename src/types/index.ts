// Export all types from a single entry point
export * from './category';
export * from './term';
export * from './price';
export * from './warehouse';
export * from './product';


export type Type = {
  id: number;
  created_at: string;
  name: string;
  module_id: number;
  code: string;
};


export type Status = {
  id: number;
  created_at: string;
  name: string;
  module_id: number;
  code: string;
};
