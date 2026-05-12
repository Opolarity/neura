import { supabase } from "@/integrations/supabase/client";
import { buildEndpoint } from "@/shared/utils/utils";
import type { MediaGalleryApiResponse, MediaGalleryFilters } from "../types/MediaGallery.types";

export const getVisualEdits = async (
  filters: Partial<MediaGalleryFilters> = {}
): Promise<MediaGalleryApiResponse> => {
  const endpoint = buildEndpoint("get-visual-edits", filters);

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) {
    console.error("Invoke error:", error);
    throw error;
  }

  return (
    data ?? {
      data: [],
      page: { p_page: 1, p_size: 20, total: 0 },
    }
  );
};
