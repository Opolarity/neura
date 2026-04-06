import { useState } from "react";
import { LocationValue } from "./types";
import { CountryField } from "./components/CountryField";
import { StateField } from "./components/StateField";
import { CityField } from "./components/CityField";
import { NeighborhoodField } from "./components/NeighborhoodField";

type ControlledProps = {
  value: LocationValue;
  onChange: (v: LocationValue) => void;
  defaultValue?: never;
};

type UncontrolledProps = {
  defaultValue?: LocationValue;
  value?: never;
  onChange?: (v: LocationValue) => void;
};

type BaseProps = {
  children?: (fields: {
    Country: FieldRenderer;
    State: FieldRenderer;
    City: FieldRenderer;
    Neighborhood: FieldRenderer;
  }) => React.ReactNode;
};

type Props = BaseProps & (ControlledProps | UncontrolledProps);

type BaseFieldProps = {
  label?: string;
  placeholder?: string;
  labelClassName?: string;
  invalid?: boolean;
};

type FieldRenderer = (props?: BaseFieldProps) => React.ReactNode;

const initialValue: LocationValue = {
  countryId: null,
  stateId: null,
  cityId: null,
  neighborhoodId: null,
};

export default function LocationSelector({
  value,
  defaultValue,
  onChange,
  children,
}: Props) {
  // Internal State
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<LocationValue>(
    defaultValue ?? initialValue,
  );
  const currentValue = isControlled ? (value ?? initialValue) : internalValue;

  const updateValue = (newValue: LocationValue) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  const handleCountryChange = (countryId: string | null) => {
    updateValue({
      countryId,
      stateId: null,
      cityId: null,
      neighborhoodId: null,
    });
  };

  const handleStateChange = (stateId: string | null) => {
    updateValue({
      ...currentValue,
      stateId,
      cityId: null,
      neighborhoodId: null,
    });
  };

  const handleCityChange = (cityId: string | null) => {
    updateValue({
      ...currentValue,
      cityId,
      neighborhoodId: null,
    });
  };

  const handleNeighborhoodChange = (neighborhoodId: string | null) => {
    updateValue({
      ...currentValue,
      neighborhoodId,
    });
  };

  const fields = {
    Country: (props = {}) => (
      <CountryField
        value={currentValue.countryId}
        onChange={handleCountryChange}
        {...props}
      />
    ),
    State: (props = {}) => (
      <StateField
        countryId={currentValue.countryId}
        value={currentValue.stateId}
        onChange={handleStateChange}
        {...props}
      />
    ),
    City: (props = {}) => (
      <CityField
        stateId={currentValue.stateId}
        value={currentValue.cityId}
        onChange={handleCityChange}
        {...props}
      />
    ),
    Neighborhood: (props = {}) => (
      <NeighborhoodField
        cityId={currentValue.cityId}
        value={currentValue.neighborhoodId}
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
