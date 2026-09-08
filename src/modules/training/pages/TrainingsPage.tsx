import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import WalkingBear from "@/shared/components/walking-bear/WalkingBear";
import { useTrainings } from "../hooks/useTrainings";
import { TrainingsHeader } from "../components/TrainingsHeader";
import { TrainingsTable } from "../components/TrainingsTable";
import { TrainingsErrorState } from "../components/TrainingsErrorState";
import { ScheduleTrainingDialog } from "../components/ScheduleTrainingDialog";
import { TrainingDetailSheet } from "../components/TrainingDetailSheet";
import type { TrainingBooking, TrainingScope } from "../types/Training.types";

const TrainingsPage = () => {
  const {
    bookings,
    loading,
    errorState,
    filters,
    pagination,
    dialogOpen,
    refresh,
    onScopeChange,
    onPageChange,
    onPageSizeChange,
    openSchedule,
    onDialogOpenChange,
  } = useTrainings();

  // El detalle se abre con la fila que ya tenemos: la API no expone un
  // endpoint de detalle y el listado ya trae todo lo que muestra el panel.
  const [detail, setDetail] = useState<TrainingBooking | null>(null);

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <TrainingsHeader onSchedule={openSchedule} />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        {/* Con la pantalla en error no hay listado que filtrar: las pestañas
            solo sugerirían que cambiar de scope arregla algo. */}
        {!errorState && (
          <CardHeader className="!p-4">
            <Tabs
              value={filters.scope}
              onValueChange={(value) => onScopeChange(value as TrainingScope)}
            >
              <TabsList>
                <TabsTrigger value="upcoming">Próximas</TabsTrigger>
                <TabsTrigger value="past">Realizadas</TabsTrigger>
                <TabsTrigger value="cancelled">Canceladas</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
        )}

        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          {errorState ? (
            <>
              <TrainingsErrorState
                code={errorState.code}
                message={errorState.message}
                onRetry={refresh}
                retrying={loading}
              />
              {/* Sin paginación no hay dónde esconder al oso, así que aquí va
                  en flujo normal debajo de la alerta — no absolute. */}
              <WalkingBear />
            </>
          ) : (
            <TrainingsTable
              bookings={bookings}
              loading={loading}
              scope={filters.scope}
              onSchedule={openSchedule}
              onViewDetail={setDetail}
            />
          )}
        </CardContent>

        {!errorState && pagination.total > 0 && (
          <CardFooter className="!p-0">
            {/* El oso camina por detrás de la barra de paginación. El contenedor
                lleva isolate a propósito: sin un stacking context propio, el
                z-index negativo lo mandaría detrás del fondo de la Card y
                desaparecería. Con él, el -z-10 solo lo deja por debajo de la
                barra, que no tiene fondo y lo deja ver. Así no hay que tocar
                PaginationBar ni Pagination. */}
            <div className="relative w-full isolate">
              <div className="absolute inset-x-0 bottom-0 -z-10">
                <WalkingBear />
              </div>
              <PaginationBar
                pagination={pagination}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
              />
            </div>
          </CardFooter>
        )}
      </Card>

      <ScheduleTrainingDialog
        open={dialogOpen}
        onOpenChange={onDialogOpenChange}
        onScheduled={refresh}
      />

      <TrainingDetailSheet
        booking={detail}
        onClose={() => setDetail(null)}
        onChanged={refresh}
      />
    </div>
  );
};

export default TrainingsPage;
