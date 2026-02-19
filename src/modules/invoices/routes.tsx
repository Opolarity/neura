import { RouteObject } from 'react-router-dom';
import Invoices from './pages/Invoices';
import CreateInvoice from './pages/CreateInvoice';
import InvoiceSeriesPage from '@/modules/settings/pages/InvoiceSeriesPage';
import InvoiceSeriesFormPage from '@/modules/settings/pages/InvoiceSeriesFormPage';

export const invoicesRoutes: RouteObject[] = [
  { path: 'invoices', element: <Invoices /> },
  { path: 'invoices/add', element: <CreateInvoice /> },
  { path: 'invoices/series', element: <InvoiceSeriesPage /> },
  { path: 'invoices/series/add', element: <InvoiceSeriesFormPage /> },
  { path: 'invoices/series/edit/:serieId', element: <InvoiceSeriesFormPage /> },
];
