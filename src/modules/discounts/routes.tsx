import type { RouteObject } from 'react-router-dom';
import BirthdayNotification from './pages/BirthdayNotification';
import PriceRulesPage from './pages/PriceRulesPage';
import PriceRuleFormPage from './pages/PriceRuleFormPage';

export const discountsRoutes: RouteObject[] = [
  { path: 'discounts/birthday-notification', element: <BirthdayNotification /> },
  { path: 'discounts/price-rules', element: <PriceRulesPage /> },
  { path: 'discounts/price-rules/create', element: <PriceRuleFormPage /> },
  { path: 'discounts/price-rules/edit/:id', element: <PriceRuleFormPage /> },
];
