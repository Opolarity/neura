import React, { useState, useCallback } from "react";
import { LocationContext } from "./LocationContext";

import { CountrySelect } from "./CountrySelect";
import { StateSelect } from "./StateSelect";
import { CitySelect } from "./CitySelect";
import { NeighborhoodSelect } from "./NeighborhoodSelect";

type Props = {
  children: React.ReactNode;
  country_id?: string;
  state_id?: string;
  city_id?: string;
  neighborhood_id?: string;
  onCountryChange?: (v: string) => void;
  onStateChange?: (v: string) => void;
  onCityChange?: (v: string) => void;
  onNeighborhoodChange?: (v: string) => void;
};

function LocationSelector({
  children,
  country_id,
  state_id,
  city_id,
  neighborhood_id,
  onCountryChange,
  onStateChange,
  onCityChange,
  onNeighborhoodChange,
}: Props) {
  const [country, setCountry] = useState(country_id ?? "")
  const [state, setState] = useState(state_id ?? "")
  const [city, setCity] = useState(city_id ?? "")
  const [neighborhood, setNeighborhood] = useState(neighborhood_id ?? "")

  const handleSetCountry = useCallback((v: string) => {
    setCountry(v)
    setState("")
    setCity("")
    setNeighborhood("")
    onCountryChange?.(v)
    onStateChange?.("")
    onCityChange?.("")
    onNeighborhoodChange?.("")
  }, [onCountryChange, onStateChange, onCityChange, onNeighborhoodChange])

  const handleSetState = useCallback((v: string) => {
    setState(v)
    setCity("")
    setNeighborhood("")
    onStateChange?.(v)
    onCityChange?.("")
    onNeighborhoodChange?.("")
  }, [onStateChange, onCityChange, onNeighborhoodChange])

  const handleSetCity = useCallback((v: string) => {
    setCity(v)
    setNeighborhood("")
    onCityChange?.(v)
    onNeighborhoodChange?.("")
  }, [onCityChange, onNeighborhoodChange])

  const handleSetNeighborhood = useCallback((v: string) => {
    setNeighborhood(v)
    onNeighborhoodChange?.(v)
  }, [onNeighborhoodChange])

  return (
    <LocationContext.Provider
      value={{
        country,
        state,
        city,
        neighborhood,
        setCountry: handleSetCountry,
        setState: handleSetState,
        setCity: handleSetCity,
        setNeighborhood: handleSetNeighborhood,
      }}
    >
      <div className="flex flex-col gap-2">{children}</div>
    </LocationContext.Provider>
  );
}

LocationSelector.Country = CountrySelect;
LocationSelector.State = StateSelect;
LocationSelector.City = CitySelect;
LocationSelector.Neighborhood = NeighborhoodSelect;

export default LocationSelector;
