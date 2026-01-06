import { RouteObject, Outlet } from 'react-router-dom';
import Customers from './pages/Customers';
import ClientsList from './pages/ClientsList';
import CreateClient from './pages/CreateClient';
import EditClient from './pages/EditClient';

export const customersRoutes: RouteObject[] = [
  { 
    path: 'customers', 
    element: <Customers />,
    children: [
      { path: 'list', element: <ClientsList /> },
      { path: 'create', element: <CreateClient /> },
      { path: 'edit/:id', element: <EditClient /> },
    ]
  },
];
