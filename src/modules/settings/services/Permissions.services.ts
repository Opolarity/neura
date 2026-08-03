import { supabase } from "@/integrations/supabase/client";
import { PermissionsCatalogApiResponse } from "../types/Permissions.types";

export const permissionsCatalogApi =
  async (): Promise<PermissionsCatalogApiResponse> => {
    const { data, error } = await supabase.functions.invoke("get-permissions", {
      method: "GET",
    });

    if (error) {
      console.error("Invoke error in permissionsCatalogApi:", error);
      throw error;
    }

    return data ?? { permissions: [] };
  };
