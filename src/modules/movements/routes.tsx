import { RouteObject } from "react-router-dom";
import MovementsPage from "./pages/MovementsPage";
import AddMovementPage from "./pages/AddMovementPage";

export const movementsRoutes: RouteObject[] = [
  { path: "movements", element: <MovementsPage /> },
  {
    path: "movements/add/expenses",
    element: <AddMovementPage movementType="expense" />,
  },
  {
    path: "movements/add/income",
    element: <AddMovementPage movementType="income" />,
  },
];
