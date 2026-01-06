import { RouteObject } from 'react-router-dom';
import Inventory from './pages/Inventory';
import InventoryMovements from './pages/Movements';

export const inventoryRoutes: RouteObject[] = [
  { path: 'inventory', element: <Inventory /> },
  { path: 'inventory/movements', element: <InventoryMovements /> },
];
