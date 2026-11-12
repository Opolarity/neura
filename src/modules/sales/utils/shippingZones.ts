// Filas de costo con varias ubicaciones por columna.
//
// En la BD cada fila de `shipping_costs` tiene una sola ubicación (país,
// departamento, provincia o distrito). En la pantalla una fila elige varias en
// cada columna: al guardar se expande a una fila por ubicación y al editar las
// filas con el mismo nombre y costo se vuelven a juntar. Así el ecommerce, el
// POS y el bot siguen leyendo `shipping_costs` como siempre.
//
// Regla de expansión: dentro de cada ubicación elegida manda la más específica.
// Si en Estado está Lima y en Ciudad no hay ninguna provincia de Lima, la fila
// vale para todo Lima; si hay alguna, vale solo para esas provincias (y lo mismo
// con los distritos dentro de cada provincia).

import type {
  City,
  Countrie,
  LocationCatalog,
  LocationLevel,
  LocationOption,
  Neighborhood,
  ShippingCost,
  ShippingZone,
  State,
} from "../types/Shipping.types";

type CostRow = Omit<ShippingCost, "id" | "cost"> & { cost: number };

/** Normaliza para buscar sin tildes ni mayúsculas. */
export const normalizeSearch = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

const option = (
  id: number,
  label: string,
  hint: string,
  parentId: number | null,
): LocationOption => ({
  id,
  label,
  hint,
  parentId,
  // Se busca solo por el nombre: con el padre incluido, "lima" traería todas
  // las provincias y distritos de Lima.
  search: normalizeSearch(label),
});

/**
 * Catálogo de ubicaciones por nivel. Las ubicaciones de las filas guardadas que
 * ya no están en el catálogo se agregan con su id, para no perderlas al guardar.
 */
export const buildLocationCatalog = (
  countries: Countrie[],
  states: State[],
  cities: City[],
  neighborhoods: Neighborhood[],
  savedCosts: ShippingCost[] = [],
): LocationCatalog => {
  const catalog: LocationCatalog = {
    country: new Map(),
    state: new Map(),
    city: new Map(),
    neighborhood: new Map(),
  };

  for (const country of countries) {
    catalog.country.set(country.id, option(country.id, country.name, "", null));
  }
  for (const state of states) {
    catalog.state.set(
      state.id,
      option(state.id, state.name, "", state.country_id ?? null),
    );
  }
  for (const city of cities) {
    const state = city.state_id != null ? catalog.state.get(city.state_id) : undefined;
    catalog.city.set(
      city.id,
      option(city.id, city.name, state?.label ?? "", city.state_id ?? null),
    );
  }
  for (const neighborhood of neighborhoods) {
    const city =
      neighborhood.city_id != null ? catalog.city.get(neighborhood.city_id) : undefined;
    const hint = [city?.label, city?.hint].filter(Boolean).join(", ");
    catalog.neighborhood.set(
      neighborhood.id,
      option(neighborhood.id, neighborhood.name, hint, neighborhood.city_id ?? null),
    );
  }

  const ensure = (level: LocationLevel, id: number | null, parentId: number | null) => {
    if (id === null || catalog[level].has(id)) return;
    catalog[level].set(id, option(id, `#${id}`, "no está en el catálogo", parentId));
  };
  for (const cost of savedCosts) {
    ensure("country", cost.country_id, null);
    ensure("state", cost.state_id, cost.country_id);
    ensure("city", cost.city_id, cost.state_id);
    ensure("neighborhood", cost.neighborhood_id, cost.city_id);
  }

  return catalog;
};

/** Quita lo que quedó elegido debajo de un padre que ya no está elegido. */
export const pruneZone = (zone: ShippingZone, catalog: LocationCatalog): ShippingZone => {
  const keep = (level: LocationLevel, ids: number[], parents: number[]) => {
    const parentSet = new Set(parents);
    return ids.filter((id) => {
      const parentId = catalog[level].get(id)?.parentId;
      return parentId != null && parentSet.has(parentId);
    });
  };
  const state_ids = keep("state", zone.state_ids, zone.country_ids);
  const city_ids = keep("city", zone.city_ids, state_ids);
  const neighborhood_ids = keep("neighborhood", zone.neighborhood_ids, city_ids);
  return { ...zone, state_ids, city_ids, neighborhood_ids };
};

const childrenOf = (
  level: LocationLevel,
  selected: number[],
  parentId: number,
  catalog: LocationCatalog,
) => selected.filter((id) => catalog[level].get(id)?.parentId === parentId);

/** Una fila de `shipping_costs` por ubicación más específica de la fila. */
export const expandZoneToCosts = (
  zone: ShippingZone,
  catalog: LocationCatalog,
): CostRow[] => {
  const base = { name: zone.name.trim(), cost: Number(zone.cost) };
  const rows: CostRow[] = [];

  for (const country_id of zone.country_ids) {
    const states = childrenOf("state", zone.state_ids, country_id, catalog);
    if (states.length === 0) {
      rows.push({ ...base, country_id, state_id: null, city_id: null, neighborhood_id: null });
      continue;
    }
    for (const state_id of states) {
      const cities = childrenOf("city", zone.city_ids, state_id, catalog);
      if (cities.length === 0) {
        rows.push({ ...base, country_id, state_id, city_id: null, neighborhood_id: null });
        continue;
      }
      for (const city_id of cities) {
        const districts = childrenOf("neighborhood", zone.neighborhood_ids, city_id, catalog);
        if (districts.length === 0) {
          rows.push({ ...base, country_id, state_id, city_id, neighborhood_id: null });
          continue;
        }
        for (const neighborhood_id of districts) {
          rows.push({ ...base, country_id, state_id, city_id, neighborhood_id });
        }
      }
    }
  }

  return rows;
};

export const expandZonesToCosts = (zones: ShippingZone[], catalog: LocationCatalog) =>
  zones.flatMap((zone) => expandZoneToCosts(zone, catalog));

const rowKey = (row: Pick<ShippingCost, "country_id" | "state_id" | "city_id" | "neighborhood_id">) =>
  [row.country_id, row.state_id, row.city_id, row.neighborhood_id].join("/");

const pushUnique = (list: number[], id: number | null) => {
  if (id !== null && !list.includes(id)) list.push(id);
};

let zoneKey = 0;
export const newZoneKey = () => {
  zoneKey += 1;
  return `zone-${zoneKey}`;
};

export const emptyZone = (countries: number[] = []): ShippingZone => ({
  key: newZoneKey(),
  name: "",
  cost: "",
  country_ids: [...countries],
  state_ids: [],
  city_ids: [],
  neighborhood_ids: [],
});

/**
 * Junta las filas guardadas por nombre + costo. Una fila solo entra a una zona
 * si, al volver a expandirla, salen exactamente las mismas filas: p. ej. "todo
 * Lima" y "Miraflores" con el mismo costo quedan en filas separadas, porque
 * juntas se guardarían solo como Miraflores.
 */
export const groupCostsIntoZones = (
  costs: ShippingCost[],
  catalog: LocationCatalog,
): ShippingZone[] => {
  const zones: { zone: ShippingZone; rows: Set<string>; group: string }[] = [];

  for (const cost of costs) {
    if (cost.country_id === null) continue;
    const group = `${cost.name.trim()}|${Number(cost.cost)}`;
    const key = rowKey(cost);

    const fits = (candidate: ShippingZone, rows: Set<string>) => {
      const expected = new Set([...rows, key]);
      const expanded = expandZoneToCosts(candidate, catalog).map(rowKey);
      return expanded.length === expected.size && expanded.every((k) => expected.has(k));
    };

    let placed = false;
    for (const entry of zones) {
      if (entry.group !== group) continue;
      if (entry.rows.has(key)) {
        placed = true;
        break;
      }
      const candidate: ShippingZone = {
        ...entry.zone,
        country_ids: [...entry.zone.country_ids],
        state_ids: [...entry.zone.state_ids],
        city_ids: [...entry.zone.city_ids],
        neighborhood_ids: [...entry.zone.neighborhood_ids],
      };
      pushUnique(candidate.country_ids, cost.country_id);
      pushUnique(candidate.state_ids, cost.state_id);
      pushUnique(candidate.city_ids, cost.city_id);
      pushUnique(candidate.neighborhood_ids, cost.neighborhood_id);
      if (fits(candidate, entry.rows)) {
        entry.zone = candidate;
        entry.rows.add(key);
        placed = true;
        break;
      }
    }

    if (!placed) {
      const zone: ShippingZone = {
        key: newZoneKey(),
        name: cost.name.trim(),
        cost: cost.cost === "" ? "" : Number(cost.cost),
        country_ids: [cost.country_id],
        state_ids: cost.state_id !== null ? [cost.state_id] : [],
        city_ids: cost.city_id !== null ? [cost.city_id] : [],
        neighborhood_ids: cost.neighborhood_id !== null ? [cost.neighborhood_id] : [],
      };
      zones.push({ zone, rows: new Set([key]), group });
    }
  }

  return zones.map((entry) => entry.zone);
};

/** Nombre legible de la ubicación más específica de una fila expandida. */
export const costRowLabel = (row: CostRow, catalog: LocationCatalog) => {
  const pick = (level: LocationLevel, id: number | null) =>
    id !== null ? catalog[level].get(id) : undefined;
  const found =
    pick("neighborhood", row.neighborhood_id) ??
    pick("city", row.city_id) ??
    pick("state", row.state_id) ??
    pick("country", row.country_id);
  if (!found) return "Ubicación";
  return found.hint ? `${found.label} (${found.hint})` : found.label;
};

/** Ubicaciones que quedan en más de una fila, con los nombres de esas filas. */
export const findDuplicateLocations = (
  zones: ShippingZone[],
  catalog: LocationCatalog,
): { label: string; zones: string[] }[] => {
  const seen = new Map<string, { label: string; zones: string[] }>();
  zones.forEach((zone, index) => {
    for (const row of expandZoneToCosts(zone, catalog)) {
      const key = rowKey(row);
      const entry = seen.get(key) ?? { label: costRowLabel(row, catalog), zones: [] };
      entry.zones.push(zone.name.trim() || `fila ${index + 1}`);
      seen.set(key, entry);
    }
  });
  return [...seen.values()].filter((entry) => entry.zones.length > 1);
};
