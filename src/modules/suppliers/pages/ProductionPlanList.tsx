import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductionPlanHeader from "../components/production-plan/ProductionPlanHeader";
import { ProductionPlanGrid } from "../components/production-plan/ProductionPlanGrid";
import { ProductionPlanRow } from "../types/productionPlan.types";

/**
 * El Plan Maestro Producción: todas las órdenes vivas, una fila por variación.
 *
 * La rejilla y todo lo que se hace desde ella viven en `ProductionPlanGrid`,
 * que comparte con la pestaña Avances de la orden. Aquí solo queda el título y
 * el contador, que son de la pantalla.
 */
const ProductionPlanList = () => {
  const navigate = useNavigate();
  /** Lo dice la rejilla al cargar; el header lo pinta. */
  const [total, setTotal] = useState(0);
  /**
   * La descarga vive en la rejilla -- es donde están los filtros -- y el botón
   * en el header. Sube igual que el total, por el mismo motivo.
   */
  const [exportacion, setExportacion] = useState<{
    exportar: () => void;
    exportando: boolean;
  }>({ exportar: () => {}, exportando: false });

  const openOrder = (row: ProductionPlanRow) =>
    navigate(`/suppliers/production-orders/${row.productionOrderId}`);

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <ProductionPlanHeader
        total={total}
        onExport={exportacion.exportar}
        exporting={exportacion.exportando}
      />

      <ProductionPlanGrid
        onOpenOrder={openOrder}
        onTotalChange={setTotal}
        onExportChange={setExportacion}
      />
    </div>
  );
};

export default ProductionPlanList;
