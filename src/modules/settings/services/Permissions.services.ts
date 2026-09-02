import { PermissionsCatalogApiResponse } from "../types/Permissions.types";
import { invokeFunction } from "@/integrations/supabase/invokeFunction";

export const permissionsCatalogApi =
  async (): Promise<PermissionsCatalogApiResponse> => {
    const data = await invokeFunction("get-permissions", {
      method: "GET",
    });

    return data ?? { permissions: [] };
  };
