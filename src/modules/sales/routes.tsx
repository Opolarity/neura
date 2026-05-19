import { RouteObject } from 'react-router-dom';
import Sales from '@/modules/sales/pages/Sales';
import CreateSale from '@/modules/sales/pages/CreateSale';
import POS from '@/modules/sales/pages/POS';
import CreateShipping from '@/modules/sales/pages/CreateShipping';
import Shipping from '@/modules/sales/pages/Shipping';
import POSTicketPrintPage from '@/modules/sales/pages/POSTicketPrintPage';
import FranchiseProducts from '@/modules/sales/pages/FranchiseProducts';

export const salesRoutes: RouteObject[] = [
  { path: 'sales', element: <Sales /> },
  { path: 'sales/products/franchise', element: <FranchiseProducts /> },
  { path: 'sales/create', element: <CreateSale /> },
  { path: 'sales/edit/:id', element: <CreateSale /> },
  { path: 'pos/open', element: <POS /> },
  { path: 'pos/ticket/:invoiceId', element: <POSTicketPrintPage /> },
  { path: 'shipping', element: <Shipping /> },
  { path: 'shipping/create', element: <CreateShipping /> },
  { path: 'shipping/edit/:id', element: <CreateShipping /> },
];
