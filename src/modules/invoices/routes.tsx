import { RouteObject } from 'react-router-dom';
import Invoices from './pages/Invoices';
import CreateInvoice from './pages/CreateInvoice';

export const invoicesRoutes: RouteObject[] = [
  { path: 'invoices', element: <Invoices /> },
  { path: 'invoices/add', element: <CreateInvoice /> },
];
