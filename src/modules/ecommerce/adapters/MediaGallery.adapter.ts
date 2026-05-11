import type { PaginationState } from "@/shared/components/pagination/Pagination";
import type {
  MediaGalleryApiItem,
  MediaGalleryApiResponse,
  MediaGalleryItem,
} from "../types/MediaGallery.types";

export const adaptMediaGalleryItem = (item: MediaGalleryApiItem): MediaGalleryItem => ({
  id: item.id,
  name: item.name,
  url: item.url,
  mimetype: item.mimetype,
  createdAt: item.created_at,
  createdBy: item.created_by,
});

export const adaptMediaGalleryResponse = (
  response: MediaGalleryApiResponse
): { items: MediaGalleryItem[]; pagination: PaginationState } => ({
  items: (response.data || []).map(adaptMediaGalleryItem),
  pagination: {
    p_page: response.page.p_page,
    p_size: response.page.p_size,
    total: response.page.total,
  },
});
