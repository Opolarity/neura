import { RouteObject } from "react-router-dom";
import MovementsPage from "./pages/MovementsPage";

export const movementsRoutes: RouteObject[] = [
  { path: "movements", element: <MovementsPage /> },
];
