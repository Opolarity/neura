import { RouteObject } from 'react-router-dom';
import Invoices from './pages/Invoices';
import CreateInvoice from './pages/CreateInvoice';
import InvoiceSeriesPage from '@/modules/settings/pages/InvoiceSeriesPage';

export const invoicesRoutes: RouteObject[] = [
  { path: 'invoices', element: <Invoices /> },
  { path: 'invoices/add', element: <CreateInvoice /> },
  { path: 'invoices/series', element: <InvoiceSeriesPage /> },
];
