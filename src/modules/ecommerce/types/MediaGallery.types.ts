export interface MediaGalleryItem {
  id: number;
  name: string;
  url: string;
  mimetype: string | null;
  createdAt: string;
  createdBy: string;
}

export interface MediaGalleryApiItem {
  id: number;
  name: string;
  url: string;
  mimetype: string | null;
  created_at: string;
  created_by: string;
}

export interface MediaGalleryApiResponse {
  data: MediaGalleryApiItem[];
  page: {
    p_page: number;
    p_size: number;
    total: number;
  };
}

export interface MediaGalleryFilters {
  page: number;
  size: number;
  startDate: string | null;
  endDate: string | null;
}
