export interface MovementClassApiItem {
  id: number;
  name: string;
  code: string | null;
}

export interface MovementClassApiResponse {
  data: MovementClassApiItem[];
  page: {
    page: number;
    size: number;
    total: number;
  };
}

export interface MovementClass {
  id: number;
  name: string;
  code: string | null;
}

export interface MovementClassFilters {
  page?: number;
  size?: number;
}

export interface MovementClassPayload {
  id?: number;
  name: string;
  code: string;
}
