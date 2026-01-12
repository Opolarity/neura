// Products - Pagination
export const totalPages = (total: number, pageSize: number) =>
  Math.ceil(total / pageSize) || 1;

export const startRecord = (total: number, pageSize: number, page: number) =>
  total === 0 ? 0 : (page - 1) * pageSize + 1;

export const endRecord = (total: number, pageSize: number, page: number) =>
  Math.min(page * pageSize, total);
