import { RouteObject } from 'react-router-dom';
import Invoices from './pages/Invoices';

export const invoicesRoutes: RouteObject[] = [
  { path: 'invoices', element: <Invoices /> },
];
