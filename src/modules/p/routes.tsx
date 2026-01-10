import type { RouteObject } from "react-router-dom";
import Products from "./pages/Products";
import AddProduct from "./pages/AddProduct";
import ProductCosts from "./pages/ProductCosts";
import Categories from "./pages/Categories";

export const productsRoutes: RouteObject[] = [
  {
    path: "/products",
    children: [
      { index: true, element: <Products /> },
      { path: "add", element: <AddProduct /> },
      { path: "costs", element: <ProductCosts /> },
      { path: "categories", element: <Categories /> },
    ],
  },
];
