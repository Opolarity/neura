import { RouteObject, Outlet } from 'react-router-dom';
import Customers from './pages/Customers';
import AccountsList from './pages/AccountsList';
import CreateClient from './pages/CreateClient';
import EditClient from './pages/EditClient';
import CustomerPoints from './pages/CustomerPoints';
import CustomerPointsMovements from './pages/CustomerPointsMovements';

export const customersRoutes: RouteObject[] = [
  {
    path: 'customers',
    element: <Customers />,
    children: [
      { path: 'list', element: <AccountsList /> },
      { path: 'create', element: <CreateClient /> },
      { path: 'edit/:id', element: <EditClient /> },
      { path: 'points', element: <CustomerPoints /> },
      { path: 'points/movements', element: <CustomerPointsMovements /> },
    ]
  },
];
