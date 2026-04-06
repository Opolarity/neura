import { LocationValue } from "./types";
import { CountryField } from "./components/CountryField";
import { StateField } from "./components/StateField";
import { CityField } from "./components/CityField";
import { NeighborhoodField } from "./components/NeighborhoodField";

type BaseFieldProps = {
  label?: string;
  placeholder?: string;
  labelClassName?: string;
  invalid?: boolean;
};

type FieldRenderer = (props?: BaseFieldProps) => React.ReactNode;

type Props = {
  value?: LocationValue;
  onChange: (v: LocationValue) => void;
  children?: (fields: {
    Country: FieldRenderer;
    State: FieldRenderer;
    City: FieldRenderer;
    Neighborhood: FieldRenderer;
  }) => React.ReactNode;
};

export default function LocationSelector({
  value = {
    countryId: null,
    stateId: null,
    cityId: null,
    neighborhoodId: null,
  },
  onChange,
  children,
}: Props) {
  const handleCountryChange = (countryId: string | null) => {
    onChange({
      countryId,
      stateId: null,
      cityId: null,
      neighborhoodId: null,
    });
  };

  const handleStateChange = (stateId: string | null) => {
    onChange({
      ...value,
      stateId,
      cityId: null,
      neighborhoodId: null,
    });
  };

  const handleCityChange = (cityId: string | null) => {
    onChange({
      ...value,
      cityId,
      neighborhoodId: null,
    });
  };

  const handleNeighborhoodChange = (neighborhoodId: string | null) => {
    onChange({
      ...value,
      neighborhoodId,
    });
  };

  const fields = {
    Country: (props = {}) => (
      <CountryField
        value={value.countryId}
        onChange={handleCountryChange}
        {...props}
      />
    ),
    State: (props = {}) => (
      <StateField
        countryId={value.countryId}
        value={value.stateId}
        onChange={handleStateChange}
        {...props}
      />
    ),
    City: (props = {}) => (
      <CityField
        stateId={value.stateId}
        value={value.cityId}
        onChange={handleCityChange}
        {...props}
      />
    ),
    Neighborhood: (props = {}) => (
      <NeighborhoodField
        cityId={value.cityId}
        value={value.neighborhoodId}
        onChange={handleNeighborhoodChange}
        {...props}
      />
    ),
  };

  if (children) {
    return <>{children(fields)}</>;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        {fields.Country({ label: "País", placeholder: "Selecciona" })}
        {fields.State({ label: "Departamento", placeholder: "Selecciona" })}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {fields.City({ label: "Ciudad", placeholder: "Selecciona" })}
        {fields.Neighborhood({ label: "Distrito", placeholder: "Selecciona" })}
      </div>
    </>
  );
}
/*
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
*/
