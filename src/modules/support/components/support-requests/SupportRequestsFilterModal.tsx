import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  SupportFilterOption,
  SupportModalFilters,
  SupportRequestType,
  SupportRequestsFacets,
} from "../../types/Support.types";

interface SupportRequestsFilterModalProps {
  isOpen: boolean;
  filters: SupportModalFilters;
  facets: SupportRequestsFacets;
  onClose: () => void;
  onApply: (filters: SupportModalFilters) => void;
}

/**
 * Cuatro filtros: tipo (lista fija del contrato) y reportante / estado / origen,
 * cuyas opciones vienen de la API (`facets`). No se codifican aquí: los estados
 * son configurables en OPOLARITY y los orígenes dependen de desde dónde se creó
 * cada solicitud.
 *
 * "" ES un valor válido (solicitudes sin reportante o sin origen), así que el
 * "Todos" del select no puede ser la cadena vacía: se usa el centinela ALL.
 */
const ALL = "__all__";

/** Centinela para el valor "" (sin reportante / sin origen). */
const EMPTY_VALUE = "__empty__";

const EMPTY_FILTERS: SupportModalFilters = {
  requestType: null,
  reporterName: null,
  status: null,
  originHost: null,
};

const FilterSelect = ({
  value,
  options,
  placeholder,
  allLabel,
  onChange,
}: {
  value: string | null;
  options: SupportFilterOption[];
  placeholder: string;
  allLabel: string;
  onChange: (value: string | null) => void;
}) => (
  <Select
    value={value ?? ALL}
    disabled={options.length === 0}
    onValueChange={(val) => onChange(val === ALL ? null : val)}
  >
    <SelectTrigger>
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

const SupportRequestsFilterModal = ({
  isOpen,
  filters,
  facets,
  onClose,
  onApply,
}: SupportRequestsFilterModalProps) => {
  const [internalFilters, setInternalFilters] =
    useState<SupportModalFilters>(filters);

  useEffect(() => {
    if (isOpen) {
      setInternalFilters(filters);
    }
  }, [isOpen, filters]);

  // El centinela solo vive dentro del Select: hacia afuera se maneja "" y null
  const fromSentinel = (value: string | null) =>
    value === EMPTY_VALUE ? "" : value;
  const toSentinel = (value: string | null) =>
    value === "" ? EMPTY_VALUE : value;

  const handleClear = () => setInternalFilters(EMPTY_FILTERS);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filtrar Tickets</DialogTitle>
        </DialogHeader>

        {/* Tope de altura + scroll interno: las opciones de reportante, estado y
            origen las manda la API y crecen con el uso; sin esto el modal se
            estira hasta salirse de la pantalla y deja el footer fuera de
            alcance. El max-h va en un contenedor propio, no en el ScrollArea.
            El pr-4 aparta el contenido de la barra de scroll, que si no roza el
            borde derecho de los selects. */}
        <div className="max-h-[50vh]">
          <ScrollArea className="h-full">
            <div className="space-y-4 py-4 pl-1 pr-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tipo</Label>
                <Select
                  value={internalFilters.requestType ?? ALL}
                  onValueChange={(val) =>
                    setInternalFilters((prev) => ({
                      ...prev,
                      requestType:
                        val === ALL ? null : (val as SupportRequestType),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Todos los tipos</SelectItem>
                    <SelectItem value="ticket">Problemas (tickets)</SelectItem>
                    <SelectItem value="suggestion">Sugerencias</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Creada por</Label>
                <FilterSelect
                  value={toSentinel(internalFilters.reporterName)}
                  options={facets.reporters}
                  placeholder="Creada por"
                  allLabel="Todos los creadores"
                  onChange={(val) =>
                    setInternalFilters((prev) => ({
                      ...prev,
                      reporterName: fromSentinel(val),
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Estado</Label>
                <FilterSelect
                  value={toSentinel(internalFilters.status)}
                  options={facets.statuses}
                  placeholder="Estado"
                  allLabel="Todos los estados"
                  onChange={(val) =>
                    setInternalFilters((prev) => ({
                      ...prev,
                      status: fromSentinel(val),
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Origen</Label>
                <FilterSelect
                  value={toSentinel(internalFilters.originHost)}
                  options={facets.origins}
                  placeholder="Origen"
                  allLabel="Todos los orígenes"
                  onChange={(val) =>
                    setInternalFilters((prev) => ({
                      ...prev,
                      originHost: fromSentinel(val),
                    }))
                  }
                />
              </div>
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClear}>
            Limpiar
          </Button>
          <Button onClick={() => onApply(internalFilters)}>Aplicar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SupportRequestsFilterModal;
