import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import MasterPlanHeader from "../components/planning/MasterPlanHeader";
import { MasterPlanFilterBar } from "../components/planning/MasterPlanFilterBar";
import { MasterPlanFilterModal } from "../components/planning/MasterPlanFilterModal";
import { MasterPlanLinesTable } from "../components/planning/MasterPlanLinesTable";
import { useMasterPlanLines } from "../hooks/useMasterPlanLines";
import { generateMasterPlanExcel } from "../utils/generateMasterPlanExcel";

/**
 * Plan de producción (pase MC → personalizado, 2026-11-11): la vista macro,
 * con el formato del «Maestro Programa de Producción». Cada línea de corte
 * con sus tallas, su corte, su semana y qué taller hace cada proceso. Solo se
 * mira: lo que se registra se registra en la OP. Reemplaza al Plan maestro
 * operable (/suppliers/production-plan redirige aquí).
 */
const MasterPlan = () => {
  const navigate = useNavigate();
  const plan = useMasterPlanLines();
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const f = plan.filters;
  const hasActiveFilters = Boolean(f.state || f.cutState || f.week !== null || f.dateFrom || f.dateTo);

  const exportar = async () => {
    const todo = await plan.fetchAll();
    if (todo) generateMasterPlanExcel(todo);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <MasterPlanHeader />
      <Card className="flex min-h-0 flex-col overflow-hidden">
        <CardHeader className="!p-4">
          <MasterPlanFilterBar
            search={f.search}
            onSearchChange={(search) => plan.setFilters({ ...f, search })}
            onOpen={() => setFilterModalOpen(true)}
            hasActiveFilters={hasActiveFilters}
            onExport={exportar}
            exporting={plan.exporting}
          />
        </CardHeader>
        <CardContent className="min-h-0 flex-1 overflow-hidden p-0">
          <MasterPlanLinesTable
            plan={plan}
            loading={plan.loading}
            onOpen={(line) => navigate(`/suppliers/production-orders/${line.productionOrderId}`)}
          />
        </CardContent>
        <CardFooter className="!p-0">
          <PaginationBar
            pagination={plan.pagination}
            onPageChange={plan.setPage}
            onPageSizeChange={plan.setPageSize}
          />
        </CardFooter>
      </Card>

      <MasterPlanFilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onApply={plan.setFilters}
        filters={f}
      />
    </div>
  );
};

export default MasterPlan;
