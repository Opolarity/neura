import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AttendancePoint } from "../../types/attendance.types";

interface PointSelectProps {
  id: string;
  points: AttendancePoint[];
  /** Id del punto como texto; "" = sin elegir. */
  value: string;
  onChange: (value: string) => void;
}

/** Punto de marcación donde está un reloj (los activos, más el elegido si ya no lo está). */
export const PointSelect = ({ id, points, value, onChange }: PointSelectProps) => {
  const opciones = points.filter((p) => p.isActive || String(p.id) === value);
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id}>
        <SelectValue placeholder="Elige el punto" />
      </SelectTrigger>
      <SelectContent>
        {opciones.map((p) => (
          <SelectItem key={p.id} value={String(p.id)}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
