import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
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
      <TrainingsHeader
        onSchedule={openSchedule}
        onRefresh={refresh}
        refreshing={loading}
      />

      <Card className="flex flex-col min-h-0 overflow-hidden">
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

        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          {errorState ? (
            <TrainingsErrorState
              code={errorState.code}
              message={errorState.message}
              onRetry={refresh}
              retrying={loading}
            />
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
            <PaginationBar
              pagination={pagination}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
            />
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
