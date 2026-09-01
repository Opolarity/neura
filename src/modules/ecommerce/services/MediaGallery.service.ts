import { buildEndpoint } from "@/shared/utils/utils";
import type { MediaGalleryApiResponse, MediaGalleryFilters } from "../types/MediaGallery.types";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";

export const getVisualEdits = async (
  filters: Partial<MediaGalleryFilters> = {}
): Promise<MediaGalleryApiResponse> => {
  const endpoint = buildEndpoint("get-visual-edits", filters);

  const data = await invokeFunction(endpoint, {
    method: "GET",
  });

  return (
    data ?? {
      data: [],
      page: { p_page: 1, p_size: 20, total: 0 },
    }
  );
};
