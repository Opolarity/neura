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
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  createShippingMethodApi,
  getChannels,
  getPickupBranches,
  getShippingById,
  updateShippingMethodApi,
} from "../services/Shipping.service";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CourierOriginCombobox } from "../components/shipping/couriers/CourierOriginCombobox";
import { ShalomConnectDialog } from "../components/shipping/couriers/ShalomConnectDialog";
import { useCourierSettings } from "../hooks/useCourierSettings";
import { getCourierCatalog } from "../services/Couriers.service";
import { COURIER_NAMES } from "../types/Couriers.types";
import {
  type CourierMethodCode,
  LocationLevel,
  LocationOption,
  ShippingCost,
  PICKUP_CODE,
  ShippingZone,
} from "../types/Shipping.types";
import { shippingDetailsAdapter } from "../adapters/Shipping.adapter";
import { useShippingLocations } from "../hooks/useShippingLocations";
import { PageLoader } from "@/shared/components/page-loader";
import { LocationMultiSelect } from "../components/shipping/LocationMultiSelect";
import {
  buildLocationCatalog,
  emptyZone,
  expandZonesToCosts,
  findDuplicateLocations,
  groupCostsIntoZones,
  normalizeSearch,
  pruneZone,
} from "../utils/shippingZones";

import { useToast } from "@/hooks/use-toast";
import { toastError } from "@/shared/utils/toastError";

type ZoneIdsField = "country_ids" | "state_ids" | "city_ids" | "neighborhood_ids";

const COLUMNS: {
  field: ZoneIdsField;
  level: LocationLevel;
  parentField: ZoneIdsField | null;
  placeholder: string;
  ariaLabel: string;
}[] = [
  { field: "country_ids", level: "country", parentField: null, placeholder: "Países", ariaLabel: "Elegir países" },
  { field: "state_ids", level: "state", parentField: "country_ids", placeholder: "Estados", ariaLabel: "Elegir estados" },
  { field: "city_ids", level: "city", parentField: "state_ids", placeholder: "Ciudades", ariaLabel: "Elegir ciudades" },
  { field: "neighborhood_ids", level: "neighborhood", parentField: "city_ids", placeholder: "Distritos", ariaLabel: "Elegir distritos" },
];

const CreateShipping = () => {
  const { toast } = useToast();
  const [shippingName, setShippingName] = useState<string>("");
  const [shippingCode, setShippingCode] = useState<string>("");
  // Olva / Shalom: el método es un courier (cotiza; las zonas solo habilitan).
  const [courierCode, setCourierCode] = useState<CourierMethodCode | null>(null);
  const [courierOriginId, setCourierOriginId] = useState<string | null>(null);
  const [courierOriginLabel, setCourierOriginLabel] = useState<string | null>(null);
  const [courierPackageId, setCourierPackageId] = useState<string | null>(null);
  const [shalomUsername, setShalomUsername] = useState<string | null>(null);
  const [shalomConnectOpen, setShalomConnectOpen] = useState(false);
  // Recojo en tienda (código PICK): sucursal donde se recoge.
  const [branchId, setBranchId] = useState<number | null>(null);
  const [someChannels, setSomeChannels] = useState<boolean>(false);
  const [channelIds, setChannelIds] = useState<number[]>([]);
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [savedCosts, setSavedCosts] = useState<ShippingCost[] | null>(null);
  const [showErrors, setShowErrors] = useState<boolean>(false);
  const [loadingCreate, setLoadingCreate] = useState<boolean>(false);
  const [shippingLoaded, setShippingLoaded] = useState<boolean>(false);
  const { id } = useParams();

  const {
    countries,
    states,
    cities,
    neighborhoods,
    isLoading: loadingLocations,
  } = useShippingLocations();

  const navigate = useNavigate();

  const { connectShalom, isConnecting, disconnectShalom } = useCourierSettings();
  const { data: courierCatalog } = useQuery({
    queryKey: ["courier-catalog", courierCode],
    queryFn: () => getCourierCatalog(courierCode!),
    enabled: courierCode !== null,
    staleTime: Infinity,
  });

  const { data: channels = [] } = useQuery({
    queryKey: ["shipping-channels"],
    queryFn: getChannels,
    staleTime: 5 * 60 * 1000,
  });

  const isPickupMethod =
    courierCode === null && shippingCode.trim().toUpperCase() === PICKUP_CODE;
  const { data: pickupBranches = [] } = useQuery({
    queryKey: ["shipping-pickup-branches"],
    queryFn: getPickupBranches,
    staleTime: 5 * 60 * 1000,
    enabled: isPickupMethod,
  });

  const channelOptions = useMemo<LocationOption[]>(
    () =>
      channels.map((channel) => ({
        id: channel.id,
        label: channel.name,
        hint: "",
        parentId: null,
        search: normalizeSearch(channel.name),
      })),
    [channels],
  );

  const catalog = useMemo(
    () =>
      buildLocationCatalog(countries, states, cities, neighborhoods, savedCosts ?? []),
    [countries, states, cities, neighborhoods, savedCosts],
  );

  // Opciones de cada columna agrupadas por su padre (país → estados, etc.).
  const optionsByParent = useMemo(() => {
    const group = (level: LocationLevel) => {
      const map = new Map<number | null, LocationOption[]>();
      for (const option of catalog[level].values()) {
        const list = map.get(option.parentId) ?? [];
        list.push(option);
        map.set(option.parentId, list);
      }
      return map;
    };
    return {
      country: group("country"),
      state: group("state"),
      city: group("city"),
      neighborhood: group("neighborhood"),
    };
  }, [catalog]);

  // Al editar, las filas guardadas se juntan cuando ya están el método y el catálogo.
  useEffect(() => {
    if (savedCosts && !loadingLocations) {
      setZones(groupCostsIntoZones(savedCosts, catalog));
    }
    // Solo al terminar de cargar: después las filas las maneja el usuario.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedCosts, loadingLocations]);

  const optionsFor = (zone: ShippingZone, column: (typeof COLUMNS)[number]) => {
    if (!column.parentField) return [...catalog.country.values()];
    return zone[column.parentField].flatMap(
      (parentId) => optionsByParent[column.level].get(parentId) ?? [],
    );
  };

  const handleShippingName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingName(e.target.value);
  };

  const handleShippingCode = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingCode(e.target.value);
  };

  const addZone = () => {
    // Con un solo país (Perú) se deja elegido para no tener que marcarlo cada vez.
    const defaultCountries = countries.length === 1 ? [countries[0].id] : [];
    setZones((prev) => [...prev, emptyZone(defaultCountries)]);
  };

  const deleteZone = (key: string) => {
    setZones((prev) => prev.filter((zone) => zone.key !== key));
  };

  const updateZone = (key: string, patch: Partial<ShippingZone>) => {
    setZones((prev) =>
      prev.map((zone) =>
        zone.key === key ? pruneZone({ ...zone, ...patch }, catalog) : zone,
      ),
    );
  };

  const isZoneInvalid = (zone: ShippingZone) => ({
    name: !zone.name.trim(),
    cost: courierCode === null && (zone.cost === "" || Number(zone.cost) < 0),
    country: zone.country_ids.length === 0,
  });

  const validateForm = (): boolean => {
    setShowErrors(true);

    if (!shippingName.trim()) {
      toast({
        title: "Error",
        description: "El nombre del método de envío es obligatorio",
        variant: "destructive",
      });
      return false;
    }

    if (someChannels && channelIds.length === 0) {
      toast({
        title: "Error",
        description: "Elige al menos un canal de venta o desmarca \"Solo para algunos canales\"",
        variant: "destructive",
      });
      return false;
    }

    if (courierCode && !courierOriginId) {
      toast({
        title: "Error",
        description: "Elige la agencia de origen del courier",
        variant: "destructive",
      });
      return false;
    }

    if (isPickupMethod && branchId === null) {
      toast({
        title: "Error",
        description: "Elige la sucursal de recojo",
        variant: "destructive",
      });
      return false;
    }

    if (zones.length === 0 && courierCode === null) {
      toast({
        title: "Error",
        description: "Debe agregar al menos una configuración de costo",
        variant: "destructive",
      });
      return false;
    }

    const incomplete = zones
      .map((zone, index) => ({ zone, index, invalid: isZoneInvalid(zone) }))
      .find(({ invalid }) => invalid.name || invalid.cost || invalid.country);

    if (incomplete) {
      const { zone, index, invalid } = incomplete;
      const missing = [
        invalid.name && "nombre",
        invalid.cost && "costo válido (no negativo)",
        invalid.country && "país",
      ].filter(Boolean);
      toast({
        title: "Error",
        description: `A la fila ${zone.name.trim() || index + 1} le falta: ${missing.join(", ")}`,
        variant: "destructive",
      });
      return false;
    }

    const duplicates = findDuplicateLocations(zones, catalog);
    if (duplicates.length > 0) {
      const { label, zones: zoneNames } = duplicates[0];
      toast({
        title: "Error",
        description: `${label} está en más de una fila: ${zoneNames.join(" y ")}. Déjala solo en una.`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleCreateShipping = async () => {
    if (!validateForm()) return;

    // En un courier las zonas no tienen precio: cotiza el courier.
    const costs = expandZonesToCosts(
      courierCode ? zones.map((zone) => ({ ...zone, cost: 0 })) : zones,
      catalog,
    );
    const channel_ids = someChannels ? channelIds : [];
    // En un courier el código es el del courier (OWN-OLVA / OWN-SHALOM).
    const code = courierCode ?? (isPickupMethod ? PICKUP_CODE : shippingCode);
    const branchFields = { branch_id: isPickupMethod ? branchId : null };
    const courierFields = {
      courier_code: courierCode,
      courier_origin_id: courierCode ? courierOriginId : null,
      courier_package_id: courierCode ? courierPackageId : null,
    };

    setLoadingCreate(true);
    try {
      if (id) {
        await updateShippingMethodApi({
          id: Number(id),
          name: shippingName,
          code,
          channel_ids,
          ...courierFields,
          ...branchFields,
          costs,
        });
        toast({
          title: "Éxito",
          description: "Método de envío actualizado correctamente",
          variant: "success",
        });
      } else {
        await createShippingMethodApi({
          name: shippingName,
          code,
          channel_ids,
          ...courierFields,
          ...branchFields,
          cost: costs,
        });
        toast({
          title: "Éxito",
          description: "Método de envío creado correctamente",
          variant: "success",
        });
      }

      navigate("/shipping");
    } catch (error) {
      console.error(error);
      toastError(error, "Ocurrió un error al guardar el método de envío");
    } finally {
      setLoadingCreate(false);
    }
  };

  const loadShippingById = async (id: string) => {
    try {
      const data = await getShippingById(id);
      const dataAdapter = shippingDetailsAdapter(data);
      setShippingName(dataAdapter.name);
      setShippingCode(dataAdapter.code);
      setSomeChannels(dataAdapter.channelIds.length > 0);
      setChannelIds(dataAdapter.channelIds);
      setSavedCosts(dataAdapter.costs);
      setBranchId(dataAdapter.branchId);
      setCourierCode(dataAdapter.courierCode);
      setCourierOriginId(dataAdapter.courierOriginId);
      setCourierOriginLabel(dataAdapter.courierOriginLabel);
      setCourierPackageId(dataAdapter.courierPackageId);
      setShalomUsername(
        dataAdapter.shalomConnected ? (dataAdapter.shalomUsername ?? "Cuenta conectada") : null,
      );
    } catch (error) {
      console.log(error);
    } finally {
      setShippingLoaded(true);
    }
  };

  useEffect(() => {
    if (id) {
      loadShippingById(id);
    }
  }, [id]);

  if (loadingLocations || (id && !shippingLoaded)) {
    return (
      <div className="relative w-full h-[80vh]">
        <PageLoader message="Cargando datos..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          {courierCode
            ? `${id ? "Actualizar" : "Crear"} método ${COURIER_NAMES[courierCode]}`
            : id
              ? "Actualizar método de envío"
              : "Crear método de envío"}
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="shipping-name" required>Método de Envío</Label>
            <Input
              id="shipping-name"
              value={shippingName}
              onChange={handleShippingName}
              placeholder="Método de Envío..."
              aria-required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="shipping-code">Código</Label>
            <Input
              id="shipping-code"
              value={courierCode ?? shippingCode}
              onChange={handleShippingCode}
              placeholder="Código..."
              disabled={courierCode !== null}
            />
            {!courierCode && (
              <p className="text-xs text-muted-foreground">
                Usa {PICKUP_CODE} para un recojo en tienda.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Canales de venta</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
              <div className="flex h-10 items-center gap-2 whitespace-nowrap">
                <Checkbox
                  id="shipping-channels"
                  checked={someChannels}
                  onCheckedChange={(checked) => {
                    setSomeChannels(checked === true);
                    if (checked !== true) setChannelIds([]);
                  }}
                />
                <Label htmlFor="shipping-channels" className="font-normal">
                  Solo algunos
                </Label>
              </div>
              <LocationMultiSelect
                options={channelOptions}
                value={channelIds}
                onChange={setChannelIds}
                placeholder={someChannels ? "Elige los canales" : "Todos los canales"}
                ariaLabel="Elegir canales de venta"
                disabled={!someChannels}
                invalid={showErrors && someChannels && channelIds.length === 0}
              />
            </div>
          </div>

          {isPickupMethod && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="pickup-branch" required>Sucursal de recojo</Label>
              <Select
                value={branchId !== null ? String(branchId) : undefined}
                onValueChange={(value) => setBranchId(Number(value))}
              >
                <SelectTrigger
                  id="pickup-branch"
                  aria-required
                  className={showErrors && branchId === null ? "border-destructive" : undefined}
                >
                  <SelectValue placeholder="Selecciona la sucursal" />
                </SelectTrigger>
                <SelectContent>
                  {pickupBranches.map((branch) => (
                    <SelectItem key={branch.id} value={String(branch.id)}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {courierCode && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label required>Agencia de origen</Label>
              <CourierOriginCombobox
                options={courierCatalog?.origins ?? []}
                value={courierOriginId}
                fallbackLabel={courierOriginLabel}
                onSelect={setCourierOriginId}
              />
              <p className="text-xs text-muted-foreground">
                Donde dejas los paquetes para {COURIER_NAMES[courierCode]}.
              </p>
            </div>
            {courierCode === "OWN-SHALOM" && (
              <div className="flex flex-col gap-2">
                <Label>Cuenta Shalom Pro</Label>
                {!id ? (
                  <p className="flex h-10 items-center text-sm text-muted-foreground">
                    Guarda el método para conectar la cuenta.
                  </p>
                ) : shalomUsername ? (
                  <div className="flex h-10 items-center gap-3">
                    <Badge variant="success">Conectada: {shalomUsername}</Badge>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        disconnectShalom(undefined, { onSuccess: () => setShalomUsername(null) })
                      }
                    >
                      Desconectar
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    className="self-start"
                    onClick={() => setShalomConnectOpen(true)}
                  >
                    Conectar Shalom Pro
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-row gap-2 items-center justify-between">
          {!isPickupMethod && (
            <p className="text-sm text-muted-foreground">
              {courierCode
                ? "Zonas donde está habilitado (sin zonas: disponible en todo el país). El precio lo cotiza el courier."
                : "Zonas y costos de envío"}
            </p>
          )}
          <Button onClick={addZone} type="button" className="ml-auto">
            Agregar Costo
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[160px]">Nombre</TableHead>
              <TableHead className="min-w-[140px]">País</TableHead>
              <TableHead className="min-w-[160px]">Estado</TableHead>
              <TableHead className="min-w-[160px]">Ciudad</TableHead>
              <TableHead className="min-w-[200px]">Distrito</TableHead>
              {!courierCode && <TableHead className="w-[120px]">Costo</TableHead>}
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {zones.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={courierCode ? 6 : 7}
                  className="text-center text-muted-foreground"
                >
                  {courierCode ? "Sin zonas: disponible en todo el país" : "No hay costos"}
                </TableCell>
              </TableRow>
            ) : (
              zones.map((zone) => {
                const invalid = showErrors
                  ? isZoneInvalid(zone)
                  : { name: false, cost: false, country: false };

                return (
                  <TableRow key={zone.key}>
                    <TableCell className="align-top">
                      <Input
                        value={zone.name}
                        onChange={(e) =>
                          updateZone(zone.key, { name: e.target.value })
                        }
                        type="text"
                        placeholder="Nombre"
                        aria-label="Nombre"
                        className={invalid.name ? "border-destructive" : undefined}
                      />
                    </TableCell>
                    {COLUMNS.map((column) => (
                      <TableCell key={column.field} className="align-top">
                        <LocationMultiSelect
                          options={optionsFor(zone, column)}
                          value={zone[column.field]}
                          onChange={(ids) =>
                            updateZone(zone.key, { [column.field]: ids })
                          }
                          placeholder={column.placeholder}
                          ariaLabel={column.ariaLabel}
                          disabled={
                            column.parentField !== null &&
                            zone[column.parentField].length === 0
                          }
                          invalid={column.level === "country" && invalid.country}
                        />
                      </TableCell>
                    ))}
                    {!courierCode && (
                    <TableCell className="align-top">
                      <Input
                        value={zone.cost}
                        onChange={(e) =>
                          updateZone(zone.key, {
                            cost: e.target.value === "" ? "" : Number(e.target.value),
                          })
                        }
                        type="number"
                        placeholder="Costo"
                        aria-label="Costo"
                        min={0}
                        onKeyDown={(e) => e.key === "-" && e.preventDefault()}
                        className={invalid.cost ? "border-destructive" : undefined}
                      />
                    </TableCell>
                    )}
                    <TableCell className="align-top">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => deleteZone(zone.key)}
                          variant="destructive"
                          size="sm"
                          title="Eliminar costo"
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
      <ShalomConnectDialog
        open={shalomConnectOpen}
        onOpenChange={setShalomConnectOpen}
        isConnecting={isConnecting}
        onConnect={async (username, password) => {
          await connectShalom({ username, password });
          setShalomUsername(username);
        }}
      />
    </div>
  );
};

export default CreateShipping;
