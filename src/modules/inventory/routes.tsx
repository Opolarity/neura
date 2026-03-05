import { RouteObject } from "react-router-dom";
import Inventory from "./pages/Inventory";
import InventoryMovements from "./pages/Movements";
import CreateMovement from "./pages/CreateMovement";
import CreateMovementRequest from "./pages/CreateMovementRequest";
import EditMovementRequest from "./pages/EditMovementRequest";
import MovementRequests from "./pages/MovementRequests";

export const inventoryRoutes: RouteObject[] = [
  { path: "inventory", element: <Inventory /> },
  { path: "inventory/movements", element: <InventoryMovements /> },
  { path: "inventory/movements/create", element: <CreateMovement /> },
  { path: "inventory/movement-requests", element: <MovementRequests /> },
  { path: "inventory/movement-requests/create", element: <CreateMovementRequest /> },
  { path: "inventory/movement-requests/edit/:id", element: <EditMovementRequest /> },
];
