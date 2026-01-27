import { RouteObject } from 'react-router-dom';
import Sales from './pages/Sales';
import SalesList from './pages/SalesList';
import CreateSale from './pages/CreateSale';


export const salesRoutes: RouteObject[] = [
  { path: 'sales', element: <Sales /> },
  { path: 'sales/list', element: <SalesList /> },
  { path: 'sales/create', element: <CreateSale /> },
  { path: 'sales/edit/:id', element: <CreateSale /> },

];
