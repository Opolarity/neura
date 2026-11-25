import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HolidaysHeaderProps {
  onCreate: () => void;
}

/** Header de Asistencia › Feriados: el título y «Agregar feriado». */
const HolidaysHeader = ({ onCreate }: HolidaysHeaderProps) => (
  <div className="flex justify-between items-center">
    <h1 className="text-2xl font-bold text-foreground">Feriados</h1>
    <Button onClick={onCreate} className="gap-2">
      <Plus className="w-4 h-4" />
      Agregar feriado
    </Button>
  </div>
);

export default HolidaysHeader;
