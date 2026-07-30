import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SupportRequestType } from "../../types/Support.types";

interface SupportRequestsFilterBarProps {
  requestType: SupportRequestType | null;
  onRequestTypeChange: (value: SupportRequestType | null) => void;
  disabled?: boolean;
}

/**
 * Solo filtro por tipo: la API externa no ofrece búsqueda por texto, y los
 * nombres de estado son configurables en OPOLARITY (un select de estados
 * hardcodeado envejecería mal).
 */
export const SupportRequestsFilterBar = ({
  requestType,
  onRequestTypeChange,
  disabled,
}: SupportRequestsFilterBarProps) => {
  return (
    <div className="flex flex-wrap gap-3">
      <Select
        value={requestType ?? "all"}
        disabled={disabled}
        onValueChange={(val) =>
          onRequestTypeChange(val === "all" ? null : (val as SupportRequestType))
        }
      >
        <SelectTrigger className="w-[190px]">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los tipos</SelectItem>
          <SelectItem value="ticket">Problemas (tickets)</SelectItem>
          <SelectItem value="suggestion">Sugerencias</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
