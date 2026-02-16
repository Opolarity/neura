import type { RouteObject } from "react-router-dom";
import PriceListPage from "./pages/PriceListPage";

export const priceListRoutes: RouteObject[] = [
  { path: "price-list", element: <PriceListPage /> },
];
