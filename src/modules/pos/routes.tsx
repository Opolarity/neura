import { RouteObject } from 'react-router-dom';
import POS from './pages/POS';

export const posRoutes: RouteObject[] = [
  { path: 'pos/open', element: <POS /> },
];
