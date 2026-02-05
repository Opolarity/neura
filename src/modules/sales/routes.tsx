import { RouteObject } from 'react-router-dom';
import Sales from './pages/Sales';
import CreateSale from './pages/CreateSale';
import POS from './pages/POS';
import CreateShipping from './pages/CreateShipping';
import Shipping from './pages/Shipping';

export const salesRoutes: RouteObject[] = [
  { path: 'sales', element: <Sales /> },
  { path: 'sales/create', element: <CreateSale /> },
  { path: 'sales/edit/:id', element: <CreateSale /> },
  { path: 'pos', element: <POS /> },
  { path: 'shipping', element: <Shipping /> },
  { path: 'shipping/create', element: <CreateShipping /> },
  { path: 'shipping/edit/:id', element: <CreateShipping /> },
];
