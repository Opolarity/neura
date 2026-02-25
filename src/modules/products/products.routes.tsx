import type { RouteObject } from "react-router-dom";
import Products from "./pages/ProductsPage";
import AddProduct from "./pages/AddProduct";
import ProductCosts from "./pages/ProductCostsPage";
import Categories from "./pages/CategoriesPage";
import Attributes from "./pages/AttributesPage";

export const productsRoutes: RouteObject[] = [
  {
    path: "/products",
    children: [
      { index: true, element: <Products /> },
      { path: "add", element: <AddProduct key="add" /> },
      { path: "edit/:id", element: <AddProduct key="edit" /> },
      { path: "view/:id", element: <AddProduct key="view" viewOnly /> },
      { path: "costs", element: <ProductCosts /> },
      { path: "categories", element: <Categories /> }, //BACKEND TIENE QUE ACTUALIZAR ESTA RUTA
      { path: "attributes", element: <Attributes /> },
    ],
  },
];
