import { RouteObject } from 'react-router-dom';
import AccountsList from './pages/AccountsList';
import CreateClient from './pages/CreateClient';
import EditClient from './pages/EditClient';
import CustomerPoints from './pages/CustomerPoints';
import CustomerPointsMovements from './pages/CustomerPointsMovements';

export const customersRoutes: RouteObject[] = [
  { path: 'customers/list', element: <AccountsList /> },
  { path: 'customers/create', element: <CreateClient /> },
  { path: 'customers/edit/:id', element: <EditClient /> },
  { path: 'customers/points', element: <CustomerPoints /> },
  { path: 'customers/points/movements', element: <CustomerPointsMovements /> },
];
