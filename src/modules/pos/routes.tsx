import { RouteObject } from 'react-router-dom';
import POS from './pages/POS';
import POSSessions from './pages/POSSessions';

export const posRoutes: RouteObject[] = [
  { path: 'pos', element: <POSSessions /> },
  { path: 'pos/open', element: <POS /> },
];
