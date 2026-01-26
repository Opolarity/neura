import { RouteObject, Outlet } from 'react-router-dom';
import Customers from './pages/Customers';
import AccountsList from './pages/AccountsList';
import CreateClient from './pages/CreateClient';
import EditClient from './pages/EditClient';

export const customersRoutes: RouteObject[] = [
  {
    path: 'customers',
    element: <Customers />,
    children: [
      { path: 'list', element: <AccountsList /> },
      { path: 'create', element: <CreateClient /> },
      { path: 'edit/:id', element: <EditClient /> },
    ]
  },
];
