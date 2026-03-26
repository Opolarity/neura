export interface TypesApiResponse {
    types: Array<{
        id: number;
        name: string;
        code: string;
    }>;
}
export interface Types {
    id: number;
    name: string;
    code: string;
}

//LOCATION
export interface CountryResponse {
  id: number;
  name: string;
  phone_code: string | null;
  created_at: string;
}
export interface StateResponse {
  id: number;
  name: string;
  country_id: number;
  created_at: string;
}
export interface CityResponse {
  id: number;
  name: string;
  country_id: number;
  state_id: number;
  created_at: string;
}
export interface NeighborhoodResponse {
  id: number;
  name: string;
  country_id: number;
  state_id: number;
  city_id: number;
  created_at: string;
}