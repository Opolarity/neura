import type { RouteObject } from 'react-router-dom';
import BirthdayNotification from './pages/BirthdayNotification';

export const discountsRoutes: RouteObject[] = [
  { path: 'discounts/birthday-notification', element: <BirthdayNotification /> },
];
