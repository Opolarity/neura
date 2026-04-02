import { Navigate } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import ReportsLayout from './pages/ReportsLayout';
import SalesPage from './pages/SalesPage';
import ProductsPage from './pages/ProductsPage';
import StockPage from './pages/StockPage';
import ReturnsPage from './pages/ReturnsPage';
import MovementsPage from './pages/MovementsPage';
import ClientsPage from './pages/ClientsPage';

export const reportsRoutes: RouteObject[] = [
  {
    path: 'reports',
    element: <ReportsLayout />,
    children: [
      { index: true, element: <Navigate to="sales" replace /> },
      { path: 'sales',     element: <SalesPage /> },
      { path: 'products',  element: <ProductsPage /> },
      { path: 'stock',     element: <StockPage /> },
      { path: 'returns',   element: <ReturnsPage /> },
      { path: 'movements', element: <MovementsPage /> },
      { path: 'clients',   element: <ClientsPage /> },
    ],
  },
];
