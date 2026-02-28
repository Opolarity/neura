import { RouteObject } from "react-router-dom";
import BarcodesPage from "./pages/BarcodesPage";

export const barcodesRoutes: RouteObject[] = [
  { path: "codigo-de-barras", element: <BarcodesPage /> },
];
