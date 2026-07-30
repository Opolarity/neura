import type { RouteObject } from 'react-router-dom';
import SupportRequestsPage from './pages/SupportRequestsPage';

export const supportRoutes: RouteObject[] = [
  { path: 'support', element: <SupportRequestsPage /> },
];
