import type { RouteObject } from 'react-router-dom';
import TrainingsPage from './pages/TrainingsPage';

// Cuelga de /support porque Capacitaciones es una de las tres opciones del
// grupo Soporte del menú, igual que Tickets.
export const trainingRoutes: RouteObject[] = [
  { path: 'support/capacitaciones', element: <TrainingsPage /> },
];
