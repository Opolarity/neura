import { RouteObject } from 'react-router-dom';
import Movements from './pages/Movements';

export const movementsRoutes: RouteObject[] = [
  { path: 'movements', element: <Movements /> },
];
