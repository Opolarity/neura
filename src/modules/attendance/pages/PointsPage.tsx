import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import PointsHeader from "../components/points/PointsHeader";
import { PointsTable } from "../components/points/PointsTable";
import { PointFormDialog } from "../components/points/PointFormDialog";
import { usePoints } from "../hooks/useAttendanceConfig";
import { useClientPagination } from "../hooks/useClientPagination";
import { AttendancePoint } from "../types/attendance.types";

/**
 * Puntos de marcación (attendance_points.list): dónde se puede marcar. Cada
 * punto tiene su ubicación y radio (y opcionalmente foto obligatoria).
 * Los equipos (kioscos y relojes de huella) tienen su propia pantalla:
 * Asistencia › Equipos de marcación.
 */
const PointsPage = () => {
  const p = usePoints();
  const page = useClientPagination(p.items);
  const [editing, setEditing] = useState<AttendancePoint | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const abrir = (point: AttendancePoint | null) => {
    setEditing(point);
    setFormOpen(true);
  };

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <PointsHeader onCreate={() => abrir(null)} />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          <PointsTable items={page.pageItems} loading={p.loading} onEdit={abrir} />
        </CardContent>
        <CardFooter className="!p-0">
          <PaginationBar
            pagination={page.pagination}
            onPageChange={page.onPageChange}
            onPageSizeChange={page.onPageSizeChange}
          />
        </CardFooter>
      </Card>

      <PointFormDialog open={formOpen} onOpenChange={setFormOpen} point={editing} saving={p.saving} onSave={p.save} />
    </div>
  );
};

export default PointsPage;
