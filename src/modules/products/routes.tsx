import { RouteObject } from 'react-router-dom';
import Products from './pages/Products';
import AddProduct from './pages/AddProduct';
import ProductCosts from './pages/ProductCosts';
import Categories from './pages/Categories';

export const productRoutes: RouteObject[] = [
  { path: 'products', element: <Products /> },
  { path: 'products/add', element: <AddProduct /> },
  { path: 'products/costs', element: <ProductCosts /> },
  { path: 'categories', element: <Categories /> },
];
