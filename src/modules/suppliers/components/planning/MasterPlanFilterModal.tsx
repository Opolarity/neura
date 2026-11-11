import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangeFilter } from "@/shared/components/date-range";
import { CutState, MasterPlanLinesFilters, MasterPlanStateFilter } from "../../types/planning.types";
import { CUT_STATES, MASTER_PLAN_FILTERS } from "../../utils/planningStatus";

const ALL = "all";

interface MasterPlanFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: MasterPlanLinesFilters) => void;
  filters: MasterPlanLinesFilters;
}

/**
 * Los filtros del Plan de producción, en el modal de siempre: rango de fechas de
 * emisión, estado de la OP, estado del corte y semana de corte.
 */
export const MasterPlanFilterModal = ({ isOpen, onClose, onApply, filters }: MasterPlanFilterModalProps) => {
  const [local, setLocal] = useState<MasterPlanLinesFilters>(filters);
  const [week, setWeek] = useState(filters.week === null ? "" : String(filters.week));

  useEffect(() => {
    setLocal(filters);
    setWeek(filters.week === null ? "" : String(filters.week));
  }, [filters]);

  const handleApply = () => {
    const semana = Number(week);
    onApply({
      ...local,
      week: week.trim() !== "" && Number.isInteger(semana) && semana >= 1 && semana <= 53 ? semana : null,
    });
    onClose();
  };

  const handleClear = () => {
    setLocal({ ...local, state: null, cutState: null, week: null, dateFrom: null, dateTo: null });
    setWeek("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filtrar Plan de producción</DialogTitle>
        </DialogHeader>

        <div className="max-h-[50vh]">
          <ScrollArea className="h-full">
            <div className="space-y-4 py-4 pl-1 pr-4">
              <DateRangeFilter
                startLabel="Fecha inicial"
                endLabel="Fecha final"
                startDate={local.dateFrom}
                endDate={local.dateTo}
                showPresets={false}
                onChange={({ startDate, endDate }) =>
                  setLocal({ ...local, dateFrom: startDate, dateTo: endDate })
                }
              />

              <div className="space-y-2">
                <Label htmlFor="master-plan-state">Estado</Label>
                <Select
                  value={local.state ?? ALL}
                  onValueChange={(value) =>
                    setLocal({ ...local, state: value === ALL ? null : (value as MasterPlanStateFilter) })
                  }
                >
                  <SelectTrigger id="master-plan-state">
                    <SelectValue placeholder="Seleccione estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Todos los estados</SelectItem>
                    {MASTER_PLAN_FILTERS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="master-plan-cut">Estado corte</Label>
                <Select
                  value={local.cutState ?? ALL}
                  onValueChange={(value) =>
                    setLocal({ ...local, cutState: value === ALL ? null : (value as CutState) })
                  }
                >
                  <SelectTrigger id="master-plan-cut">
                    <SelectValue placeholder="Seleccione estado de corte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Todos</SelectItem>
                    {(Object.keys(CUT_STATES) as CutState[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {CUT_STATES[k].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="master-plan-week">Semana de corte</Label>
                <Input
                  id="master-plan-week"
                  type="number"
                  min={1}
                  max={53}
                  value={week}
                  onChange={(e) => setWeek(e.target.value)}
                  placeholder="1 a 53"
                />
              </div>
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-end">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClear}>
              Limpiar
            </Button>
            <Button onClick={handleApply}>Aplicar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
