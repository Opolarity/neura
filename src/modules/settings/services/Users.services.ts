import { supabase } from "@/integrations/supabase/client";
import { UsersApiResponse, UsersFilters } from "../types/Users.types";

export const UsersApi = async (
  filters: UsersFilters,
): Promise<UsersApiResponse> => {
  const queryParams = new URLSearchParams(
    Object.entries(filters)
      .filter(
        ([, value]) => value !== undefined && value !== null && value !== "",
      )
      .map(([key, value]) => [key, String(value)]),
  );

  const endpoint = queryParams.toString()
    ? `get-users?${queryParams.toString()}`
    : "get-users";

  const { data, error } = await supabase.functions.invoke(endpoint, {
    method: "GET",
  });

  if (error) {
    console.error("Invoke error in usersApi:", error);
    throw error;
  }

  return (
    data ?? {
      rolesdata: {
        data: [],
        page: { page: 1, size: 20, total: 0 },
      },
    }
  );
};
