import type { RouteObject } from "react-router-dom";
import Products from "./pages/ProductsPage";
import AddProduct from "./pages/AddProduct";
import ProductCosts from "./pages/ProductCostsPage";
import Categories from "./pages/CategoriesPage";

export const productsRoutes: RouteObject[] = [
  {
    path: "/products",
    children: [
      { index: true, element: <Products /> },
      { path: "add", element: <AddProduct /> },
      { path: "costs", element: <ProductCosts /> },
      { path: "categories", element: <Categories /> }, //BACKEND TIENE QUE ACTUALIZAR ESTA RUTA
    ],
  },
];
