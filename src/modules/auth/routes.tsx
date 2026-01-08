import type { RouteObject } from "react-router-dom";
import Login from "./pages/Login";

export const authRoutes: RouteObject[] = [
  {
    path: "/login",
    children: [{ index: true, element: <Login /> }],
  },
];
