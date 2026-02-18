import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import {
  createShippingMethodApi,
  getCitiesByStateIdApi,
  getCountries,
  getDistrictsByCityIdApi,
  getShippingById,
  updateShippingMethodApi,
} from "../services/Shipping.service";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Trash } from "lucide-react";
import { Countrie, ShippingCost, State } from "../types/Shipping.types";
import { getStatesByCountryIdApi } from "@/shared/services/service";
import { shippingDetailsAdapter } from "../adapters/Shipping.adapter";

import { useToast } from "@/hooks/use-toast";

let tempId = 0;

const CreateShipping = () => {
  const { toast } = useToast();
  const [shippingId, setShippingId] = useState<number | null>(null);
  const [shippingName, setShippingName] = useState<string>("");
  const [shippingCode, setShippingCode] = useState<string>("");
  const [shippingCosts, setShippingCosts] = useState<ShippingCost[]>([]);
  const [countries, setCountries] = useState<Countrie[]>([]);
  const [loadingCreate, setLoadingCreate] = useState<boolean>(false);
  const { id } = useParams();

  const navigate = useNavigate();

  const handleShippingName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingName(e.target.value);
  };

  const handleShippingCode = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingCode(e.target.value);
  };

  const addCost = () => {
    tempId += 1;
    setShippingCosts([
      ...shippingCosts,
      {
        id: tempId,
        name: "",
        cost: "",
        country_id: null,
        state_id: null,
        city_id: null,
        neighborhood_id: null,
        states: [],
        cities: [],
        neighborhoods: [],
      },
    ]);
  };

  const deleteCost = (id: number) => {
    setShippingCosts((prev) => prev.filter((item) => item.id !== id));
  };

  const handleName = (e: React.ChangeEvent<HTMLInputElement>, id: number) => {
    setShippingCosts((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, name: e.target.value } : item,
      ),
    );
  };

  const handleCost = (e: React.ChangeEvent<HTMLInputElement>, id: number) => {
    setShippingCosts((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, cost: e.target.value === "" ? "" : Number(e.target.value) } : item,
      ),
    );
  };

  const validateForm = (): boolean => {
    if (!shippingName.trim()) {
      toast({
        title: "Error",
        description: "El nombre del método de envío es obligatorio",
        variant: "destructive",
      });
      return false;
    }

    if (shippingCosts.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos una configuración de costo",
        variant: "destructive",
      });
      return false;
    }

    const hasInvalidCost = shippingCosts.some(
      (c) => c.cost === "" || Number(c.cost) < 0 || !c.name.trim()
    );

    if (hasInvalidCost) {
      toast({
        title: "Error",
        description: "Todas las configuraciones deben tener un nombre y un costo válido (no negativo)",
        variant: "destructive",
      });
      return false;
    }

    return true;
  }

  const handleCountry = async (value: string, cost: ShippingCost) => {
    if (value === "none") {
      setShippingCosts((prev) =>
        prev.map((item) =>
          item.id === cost.id
            ? {
              ...item,
              country_id: null,
              state_id: null,
              city_id: null,
              neighborhood_id: null,
              states: [],
              cities: [],
              neighborhoods: [],
            }
            : item,
        ),
      );
      return;
    }

    setShippingCosts((prev) =>
      prev.map((item) =>
        item.id === cost.id
          ? {
            ...item,
            country_id: Number(value),
            state_id: null,
            city_id: null,
            neighborhood_id: null,
            states: [],
            cities: [],
            neighborhoods: [],
          }
          : item,
      ),
    );
  };

  const handleOpenCountries = async (open: boolean) => {
    if (!open && countries.length > 0) return;
    try {
      const res = await getCountries();
      setCountries(res);
    } catch (error) {
      console.log(error);
    }
  };

  const handleState = async (value: string, cost: ShippingCost) => {
    if (value === "none") {
      setShippingCosts((prev) =>
        prev.map((item) =>
          item.id === cost.id
            ? {
              ...item,
              state_id: null,
              city_id: null,
              neighborhood_id: null,
              cities: [],
              neighborhoods: [],
            }
            : item,
        ),
      );
      return;
    }
    setShippingCosts((prev) =>
      prev.map((item) =>
        item.id === cost.id ? { ...item, state_id: Number(value) } : item,
      ),
    );
  };

  const handleOpenStates = async (open: boolean, cost: ShippingCost) => {
    if (!open && cost.states.length > 0) return;

    try {
      const states = await getStatesByCountryIdApi(cost.country_id);
      console.log(states);

      setShippingCosts((prev) =>
        prev.map((item) => (item.id === cost.id ? { ...item, states } : item)),
      );
    } catch (error) {
      console.log(error);
    }
  };

  const handleCity = async (value: string, cost: ShippingCost) => {
    if (value === "none") {
      setShippingCosts((prev) =>
        prev.map((item) =>
          item.id === cost.id
            ? {
              ...item,
              city_id: null,
              neighborhood_id: null,
              neighborhoods: [],
            }
            : item,
        ),
      );
      return;
    }

    setShippingCosts((prev) =>
      prev.map((item) =>
        item.id === cost.id ? { ...item, city_id: Number(value) } : item,
      ),
    );
  };

  const handleOpenCities = async (open: boolean, cost: ShippingCost) => {
    if (!open && cost.cities.length > 0) return;

    try {
      const cities = await getCitiesByStateIdApi(
        cost.country_id,
        cost.state_id,
      );
      console.log(cities);

      setShippingCosts((prev) =>
        prev.map((item) => (item.id === cost.id ? { ...item, cities } : item)),
      );
    } catch (error) {
      console.log(error);
    }
  };

  const handleDistrict = async (value: string, cost: ShippingCost) => {
    if (value === "none") {
      setShippingCosts((prev) =>
        prev.map((item) =>
          item.id === cost.id
            ? {
              ...item,
              neighborhood_id: null,
            }
            : item,
        ),
      );
      return;
    }
    setShippingCosts((prev) =>
      prev.map((item) =>
        item.id === cost.id
          ? { ...item, neighborhood_id: Number(value) }
          : item,
      ),
    );
  };

  const handleOpenDistricts = async (open: boolean, cost: ShippingCost) => {
    if (!open && cost.neighborhoods.length > 0) return;

    try {
      const districts = await getDistrictsByCityIdApi(
        cost.country_id,
        cost.state_id,
        cost.city_id,
      );
      console.log(districts);

      setShippingCosts((prev) =>
        prev.map((item) =>
          item.id === cost.id ? { ...item, neighborhoods: districts } : item,
        ),
      );
    } catch (error) {
      console.log(error);
    }
  };

  const handleCreateShipping = async () => {
    if (!validateForm()) return;

    setLoadingCreate(true);
    try {
      if (id) {
        await updateShippingMethodApi({
          id: Number(id),
          name: shippingName,
          code: shippingCode,
          costs: shippingCosts.map((cost) => ({
            name: cost.name,
            cost: Number(cost.cost),
            country_id: cost.country_id,
            state_id: cost.state_id,
            city_id: cost.city_id,
            neighborhood_id: cost.neighborhood_id,
          })),
        });
        toast({
          title: "Éxito",
          description: "Método de envío actualizado correctamente",
        });
      } else {
        await createShippingMethodApi({
          name: shippingName,
          code: shippingCode,
          cost: shippingCosts.map((cost) => ({
            name: cost.name,
            cost: Number(cost.cost),
            country_id: cost.country_id,
            state_id: cost.state_id,
            city_id: cost.city_id,
            neighborhood_id: cost.neighborhood_id,
          })),
        });
        toast({
          title: "Éxito",
          description: "Método de envío creado correctamente",
        });
      }

      navigate("/shipping");
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al guardar el método de envío",
        variant: "destructive",
      });
    } finally {
      setLoadingCreate(false);
    }
  };

  const loadShippingById = async (id: string) => {
    try {
      const data = await getShippingById(id);
      const dataAdapter = shippingDetailsAdapter(data);
      console.log(dataAdapter);
      setShippingId(dataAdapter.id);
      setShippingName(dataAdapter.name);
      setShippingCode(dataAdapter.code);
      setShippingCosts(dataAdapter.costs);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (id) {
      loadShippingById(id);
    }
  }, [id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">
          {id ? "Actualizar Método de Envío" : "Crear Método de Envío"}
        </h1>
        <div className="flex gap-3">
          <Link to="/shipping">
            <Button variant="outline">Cancelar</Button>
          </Link>

          <Button onClick={handleCreateShipping} disabled={loadingCreate}>
            {id ? "Actualizar" : "Crear"}
          </Button>
        </div>
      </div>

      <Card className="flex flex-col gap-4 p-6">
        <div className="flex flex-row gap-2">
          <div className="flex-1 flex flex-col gap-2">
            <Label>Método de Envío</Label>
            <Input
              value={shippingName}
              onChange={handleShippingName}
              placeholder="Método de Envío..."
            />
          </div>

          <div className="flex-1 flex flex-col gap-2">
            <Label>Código</Label>
            <Input
              value={shippingCode}
              onChange={handleShippingCode}
              placeholder="Código..."
            />
          </div>
        </div>

        <div className="flex flex-row gap-2 items-end">
          <Button onClick={addCost} type="button">
            Agregar Costo
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>País</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Distrito</TableHead>
              <TableHead>Costo</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shippingCosts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  No hay costos
                </TableCell>
              </TableRow>
            ) : (
              shippingCosts.map((cost) => (
                <TableRow key={cost.id}>
                  <TableCell>
                    <Input
                      value={cost.name}
                      onChange={(e) => handleName(e, cost.id)}
                      type="text"
                      placeholder="Nombre"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={
                        cost.country_id !== null
                          ? cost.country_id.toString()
                          : "none"
                      }
                      onValueChange={(value) => handleCountry(value, cost)}
                      onOpenChange={handleOpenCountries}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un país" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Seleccione un país</SelectItem>
                        {countries.map((country) => (
                          <SelectItem
                            key={country.id}
                            value={country.id.toString()}
                          >
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={
                        cost.state_id !== null
                          ? cost.state_id.toString()
                          : "none"
                      }
                      onValueChange={(value) => handleState(value, cost)}
                      onOpenChange={(open) => handleOpenStates(open, cost)}
                      disabled={
                        cost.country_id === null && cost.states.length === 0
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          Seleccione un estado
                        </SelectItem>
                        {cost.states.map((state) => (
                          <SelectItem
                            key={state.id}
                            value={state.id.toString()}
                          >
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={
                        cost.city_id !== null
                          ? cost.city_id?.toString()
                          : "none"
                      }
                      onValueChange={(value) => handleCity(value, cost)}
                      onOpenChange={(open) => handleOpenCities(open, cost)}
                      disabled={
                        cost.state_id === null && cost.cities.length === 0
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione una ciudad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          Seleccione una ciudad
                        </SelectItem>
                        {cost.cities.map((city) => (
                          <SelectItem key={city.id} value={city.id.toString()}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={
                        cost.neighborhood_id !== null
                          ? cost.neighborhood_id?.toString()
                          : "none"
                      }
                      onValueChange={(value) => handleDistrict(value, cost)}
                      onOpenChange={(open) => handleOpenDistricts(open, cost)}
                      disabled={
                        cost.city_id === null && cost.neighborhoods.length === 0
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Distrito" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          Seleccione un distrito
                        </SelectItem>
                        {cost.neighborhoods.map((neighborhood) => (
                          <SelectItem
                            key={neighborhood.id}
                            value={neighborhood.id.toString()}
                          >
                            {neighborhood.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={cost.cost}
                      onChange={(e) => handleCost(e, cost.id)}
                      type="number"
                      placeholder="Costo"
                      min={0}
                      onKeyDown={(e) => e.key === "-" && e.preventDefault()}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => deleteCost(cost.id)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default CreateShipping;
