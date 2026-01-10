import { RouteObject } from 'react-router-dom';
import AddExpense from './pages/AddExpense';

export const expensesRoutes: RouteObject[] = [
  { path: 'movements/add/expenses', element: <AddExpense /> },
];
