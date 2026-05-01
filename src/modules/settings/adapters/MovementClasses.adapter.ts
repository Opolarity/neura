import { MovementClassApiResponse } from "../types/MovementClasses.types";

export function getMovementClassesAdapter(response: MovementClassApiResponse) {
  const data = response.data.map((item) => ({
    id: item.id,
    name: item.name,
    code: item.code,
  }));

  const pagination = {
    p_page: response.page.page,
    p_size: response.page.size,
    total: response.page.total,
  };

  return { data, pagination };
}
