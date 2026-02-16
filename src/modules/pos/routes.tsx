import { RouteObject } from 'react-router-dom';
import POS from './pages/POS';
import POSList from './pages/POSList';

export const posRoutes: RouteObject[] = [
  { path: 'pos', element: <POS /> },
  { path: 'pos-list', element: <POSList /> },
];
