import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AttendanceHeaderProps {
  /** Con attendance.manage: corregir o registrar marcas a mano. */
  canManage: boolean;
  onCreate: () => void;
}

/** Header de Asistencia › Marcas: el título y "Registrar marca" (exportar va en la barra de la tabla). */
const AttendanceHeader = ({ canManage, onCreate }: AttendanceHeaderProps) => (
  <div className="flex justify-between items-center">
    <h1 className="text-2xl font-bold text-foreground">Marcas</h1>
    {canManage && (
      <Button onClick={onCreate} className="gap-2">
        <Plus className="w-4 h-4" />
        Registrar marca
      </Button>
    )}
  </div>
);

export default AttendanceHeader;
