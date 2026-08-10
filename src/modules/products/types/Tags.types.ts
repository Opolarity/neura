export interface Tag {
  id: number;
  code: string;
  name: string;
  type: string;
  created_at: string;
  products_count: number;
}

export interface TagsPage {
  page: number;
  size: number;
  total: number;
}

export interface GetTagsResponse {
  data: Tag[];
  page: TagsPage;
}

export interface CreateTagPayload {
  name: string;
  code: string;
}

export interface EditTagPayload extends CreateTagPayload {
  id: number
} 