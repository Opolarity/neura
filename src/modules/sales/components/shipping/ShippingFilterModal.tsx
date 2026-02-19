import { Dialog } from "@radix-ui/react-dialog";
import { ShippingFilters } from "../../types/Shipping.types";
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { CountriesApi, getCitiesByStateIdApi, getNeighborhoodsByCityIdApi, getStatesByCountryIdApi } from "@/shared/services/service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";





interface ShippingFilterModalProps {
    
  filters: ShippingFilters;
  isOpen: boolean;
  onClose?: () => void;
  onApply?: (filters: ShippingFilters) => void;
}


const ShippingFilterModal = ({
  filters,
  isOpen,
  onClose,
  onApply,
}: ShippingFilterModalProps) => {
  const [internalFilters, setInternalFilters] =
    useState<ShippingFilters>(filters);
    const [countries, setCountries] = useState<{ id: number; name: string }[]>([]);
    const [states, setStates] = useState<{ id: number; name: string }[]>([]);
    const [cities, setCities] = useState<{ id: number; name: string }[]>([]);
    const [neighborhoods, setNeighborhoods] = useState<{ id: number; name: string }[]>([]);

          const loadLocations = async () => {
            try {
              const dataCategories = await CountriesApi();
              setCountries(dataCategories);
              const dataStates = await getStatesByCountryIdApi(internalFilters.countrie ?? 0);
              setStates(dataStates);
              const dataCities = await getCitiesByStateIdApi(internalFilters.state ?? 0, internalFilters.countrie ?? 0);
              setCities(dataCities);
              const dataNeighborhoods = await getNeighborhoodsByCityIdApi(internalFilters.city ?? 0, internalFilters.state ?? 0, internalFilters.countrie ?? 0);
              setNeighborhoods(dataNeighborhoods);  
            } catch (error) {
              console.error("Error loading categories:", error);
            }
          };

  useEffect(() => {

    if (isOpen) {
      setInternalFilters(filters);

        loadLocations();
    }
  }, [isOpen, filters]);

    useEffect(() => {
        loadLocations();
  }, [internalFilters]);

  const handleCountryChange = (value: string) => {
    const newFilters = {
      ...internalFilters,
      countrie: value === "none" ? null : Number(value),
    };

    setInternalFilters(newFilters);

  };

  const handleStateChange = (value: string) => {
    const newFilters = {
      ...internalFilters,
      state: value === "none" ? null : Number(value),
    };
    setInternalFilters(newFilters);
  };

    const handleCityChange = (value: string) => {
    const newFilters = {
      ...internalFilters,
      city: value === "none" ? null : Number(value),
    };
    setInternalFilters(newFilters);
  };

    const handleNeighborhoodChange = (value: string) => {
    setInternalFilters((prev) => ({
      ...prev,
      neighborhood: value === "none" ? null : Number(value),
    }));
  };

  const parsePositive = (raw: string) => {
    if (!raw) return null;
    const clean = raw.replace(/-/g, "");
    return clean ? Number(clean) : null;
  };

  const handleMinCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalFilters((prev) => ({ ...prev, mincost: parsePositive(e.target.value) }));
  };

  const handleMaxCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalFilters((prev) => ({ ...prev, maxcost: parsePositive(e.target.value) }));
  };

  const handleClear = () => {
    setInternalFilters({
      page: 1,
      size: filters.size,
      search: null,
      mincost: null,
      maxcost: null,
      countrie: null,
      state: null,
      city: null,
      neighborhood: null,
      order: null,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filtrar</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">País</Label>
            <div className="flex gap-2">
              <Select
                value={
                  internalFilters?.countrie
                    ? String(internalFilters.countrie)
                    : "none"
                }
                onValueChange={handleCountryChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los países" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todos los países</SelectItem>
                  {countries.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Departamento</Label>
            <div className="flex gap-2">
              <Select
                value={
                  internalFilters?.state
                    ? String(internalFilters.state)
                    : "none"
                }
                onValueChange={handleStateChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los departamentos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todos los departamentos</SelectItem>
                  {states.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Provincia</Label>
            <div className="flex gap-2">
              <Select
                value={
                  internalFilters?.city
                    ? String(internalFilters.city)
                    : "none"
                }
                onValueChange={handleCityChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos las provincias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todas las provincias</SelectItem>
                  {cities.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Distrito</Label>
            <div className="flex gap-2">
              <Select
                value={
                  internalFilters?.neighborhood
                    ? String(internalFilters.neighborhood)
                    : "none"
                }
                onValueChange={handleNeighborhoodChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los distritos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todos los distritos</SelectItem>
                  {neighborhoods.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Precio</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Mínimo"
                min={0}
                value={internalFilters.mincost ?? ""}
                onKeyDown={(e) => e.key === "-" && e.preventDefault()}
                onChange={handleMinCostChange}
              />
              <Input
                type="number"
                placeholder="Máximo"
                min={0}
                value={internalFilters.maxcost ?? ""}
                onKeyDown={(e) => e.key === "-" && e.preventDefault()}
                onChange={handleMaxCostChange}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClear}>
            Limpiar
          </Button>
          <Button onClick={() => onApply && onApply(internalFilters)}>
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShippingFilterModal;
