import { RouteObject } from "react-router-dom";
import Suppliers from "./pages/Suppliers";
import SuppliersList from "./pages/SuppliersList";
import MaterialsList from "./pages/MaterialsList";
import ExplosionsList from "./pages/ExplosionsList";
import ExplosionDetail from "./pages/ExplosionDetail";
import ProductionOrdersList from "./pages/ProductionOrdersList";
import ProductionOrderDetail from "./pages/ProductionOrderDetail";
import ProcessesList from "./pages/ProcessesList";

export const suppliersRoutes: RouteObject[] = [
  {
    path: "suppliers",
    element: <Suppliers />,
    children: [
      { index: true, element: <SuppliersList /> },
      { path: "materials", element: <MaterialsList /> },
      { path: "explosions", element: <ExplosionsList /> },
      // ":id" acepta tambien "new" para el alta.
      { path: "explosions/:id", element: <ExplosionDetail /> },
      { path: "production-orders", element: <ProductionOrdersList /> },
      { path: "production-orders/:id", element: <ProductionOrderDetail /> },
      // Catalogos planos: alta y edicion por modal, sin ruta de detalle.
      { path: "processes", element: <ProcessesList /> },
    ],
  },
];
