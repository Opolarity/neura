import { PaginationState } from "@/shared/components/pagination/Pagination";
import { Users, UsersApiResponse } from "../types/Users.types";

export const UsersAdapter = (response: UsersApiResponse) => {
  const formattedUsers: Users[] = response.usersdata.data.map((item): Users => {
    const nameParts = [
      item.name,
      item.middle_name,
      item.last_name,
      item.last_name2,
    ].filter(Boolean);

    return {
      id: item.id,
      name: nameParts.join(" "),
      document_number: item.document_number,
      warehouse: item.warehouse,
      branches: item.branches,
      role: item.role,
      created_at: item.created_at,
    };
  });

  const pagination: PaginationState = {
    p_page: response.usersdata.page.page,
    p_size: response.usersdata.page.size,
    total: response.usersdata.page.total,
  };

  return { data: formattedUsers, pagination };
};
