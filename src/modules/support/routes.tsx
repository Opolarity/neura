import type { RouteObject } from 'react-router-dom';
import SupportRequestsPage from './pages/SupportRequestsPage';
import LearningPage from './pages/LearningPage';

export const supportRoutes: RouteObject[] = [
  { path: 'support', element: <SupportRequestsPage /> },
  // Aprender: tutoriales en video de OPOLARITY. Misma regla que Tickets y
  // Capacitaciones: solo sesión, fuera del sistema de permisos.
  { path: 'support/aprender', element: <LearningPage /> },
];
