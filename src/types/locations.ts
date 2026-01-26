export type Country = {
  id: number;
  name: string;
  phone_code?: string | null;
};

export type State = {
  id: number;
  name: string;
  country?: Country;
};

export type City = {
  id: number;
  name: string;
  country?: Country;
  state?: State;
};

export type Neighborhood = {
  id: number;
  name: string;
  country?: Country;
  state?: State;
  city?: City;
};

