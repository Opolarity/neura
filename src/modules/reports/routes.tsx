import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import ReportsLayout from './pages/ReportsLayout';

const SalesPage     = lazy(() => import('./pages/SalesPage'));
const ProductsPage  = lazy(() => import('./pages/ProductsPage'));
const StockPage     = lazy(() => import('./pages/StockPage'));
const ReturnsPage   = lazy(() => import('./pages/ReturnsPage'));
const MovementsPage = lazy(() => import('./pages/MovementsPage'));
const ClientsPage   = lazy(() => import('./pages/ClientsPage'));

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
