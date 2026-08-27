import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  SupportFilterOption,
  SupportRequestType,
  SupportRequestsFacets,
} from "../../types/Support.types";

interface SupportRequestsFilterBarProps {
  /** Término tal cual lo escribe el usuario (sin debounce). */
  search: string;
  requestType: SupportRequestType | null;
  reporterName: string | null;
  status: string | null;
  originHost: string | null;
  facets: SupportRequestsFacets;
  hasActiveFilters: boolean;
  onSearchChange: (value: string) => void;
  onRequestTypeChange: (value: SupportRequestType | null) => void;
  onReporterNameChange: (value: string | null) => void;
  onStatusChange: (value: string | null) => void;
  onOriginHostChange: (value: string | null) => void;
  onClearFilters: () => void;
  disabled?: boolean;
}

/**
 * Un buscador de texto libre y cuatro filtros: tipo (lista fija del contrato) y
 * reportante / estado / origen, cuyas opciones vienen de la API (`facets`). No
 * se codifican aquí: los estados son configurables en OPOLARITY y los orígenes
 * dependen de desde dónde se creó cada solicitud.
 *
 * La búsqueda se resuelve en el servidor, no sobre la página ya cargada: con
 * paginación de servidor, filtrar en el cliente solo encontraría lo que está a
 * la vista. Cruza título, código de solicitud (`S-n`) y código de la tarea
 * vinculada (`T-n`), y el prefijo lo compara ya concatenado la API, así que
 * "S-21", "s-21" y "21" encuentran lo mismo.
 *
 * "" ES un valor válido (solicitudes sin reportante o sin origen), así que el
 * "Todos" del select no puede ser la cadena vacía: se usa el centinela ALL.
 */
const ALL = "__all__";

/** Centinela para el valor "" (sin reportante / sin origen). */
const EMPTY_VALUE = "__empty__";

const FilterSelect = ({
  value,
  options,
  placeholder,
  allLabel,
  width,
  disabled,
  onChange,
}: {
  value: string | null;
  options: SupportFilterOption[];
  placeholder: string;
  allLabel: string;
  width: string;
  disabled?: boolean;
  onChange: (value: string | null) => void;
}) => (
  <Select
    value={value ?? ALL}
    disabled={disabled || options.length === 0}
    onValueChange={(val) => onChange(val === ALL ? null : val)}
  >
    <SelectTrigger className={width}>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value={ALL}>{allLabel}</SelectItem>
      {options.map((option) => (
        // El value del item nunca puede ser "": Select lo trata como vacío
        <SelectItem
          key={option.value || EMPTY_VALUE}
          value={option.value || EMPTY_VALUE}
        >
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export const SupportRequestsFilterBar = ({
  search,
  requestType,
  reporterName,
  status,
  originHost,
  facets,
  hasActiveFilters,
  onSearchChange,
  onRequestTypeChange,
  onReporterNameChange,
  onStatusChange,
  onOriginHostChange,
  onClearFilters,
  disabled,
}: SupportRequestsFilterBarProps) => {
  // El centinela solo vive dentro del Select: hacia afuera se maneja "" y null
  const fromSentinel = (value: string | null) =>
    value === EMPTY_VALUE ? "" : value;
  const toSentinel = (value: string | null) =>
    value === "" ? EMPTY_VALUE : value;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* El buscador NO se deshabilita mientras carga, a diferencia de los
          selects: cada término dispara una consulta, y bloquear el campo en
          vuelo le robaría el foco al usuario a media palabra. */}
      <div className="relative w-[280px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar por nombre, S-21 o T-45..."
          aria-label="Buscar por nombre, código de solicitud o código de tarea"
          className="pl-9"
        />
      </div>

      <Select
        value={requestType ?? ALL}
        disabled={disabled}
        onValueChange={(val) =>
          onRequestTypeChange(val === ALL ? null : (val as SupportRequestType))
        }
      >
        <SelectTrigger className="w-[190px]">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos los tipos</SelectItem>
          <SelectItem value="ticket">Problemas (tickets)</SelectItem>
          <SelectItem value="suggestion">Sugerencias</SelectItem>
        </SelectContent>
      </Select>

      <FilterSelect
        value={toSentinel(reporterName)}
        options={facets.reporters}
        placeholder="Creada por"
        allLabel="Todos los creadores"
        width="w-[200px]"
        disabled={disabled}
        onChange={(val) => onReporterNameChange(fromSentinel(val))}
      />

      <FilterSelect
        value={toSentinel(status)}
        options={facets.statuses}
        placeholder="Estado"
        allLabel="Todos los estados"
        width="w-[190px]"
        disabled={disabled}
        onChange={(val) => onStatusChange(fromSentinel(val))}
      />

      <FilterSelect
        value={toSentinel(originHost)}
        options={facets.origins}
        placeholder="Origen"
        allLabel="Todos los orígenes"
        width="w-[190px]"
        disabled={disabled}
        onChange={(val) => onOriginHostChange(fromSentinel(val))}
      />

      {hasActiveFilters && (
        <Button variant="ghost" onClick={onClearFilters} disabled={disabled}>
          <X className="w-4 h-4 mr-2" />
          Limpiar filtros
        </Button>
      )}
    </div>
  );
};
