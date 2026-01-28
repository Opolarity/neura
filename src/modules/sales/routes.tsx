import { RouteObject } from 'react-router-dom';
import Sales from './pages/Sales';
import CreateSale from './pages/CreateSale';

export const salesRoutes: RouteObject[] = [
  { path: 'sales', element: <Sales /> },
  { path: 'sales/create', element: <CreateSale /> },
  { path: 'sales/edit/:id', element: <CreateSale /> },
];
