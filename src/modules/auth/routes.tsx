import type { RouteObject } from "react-router-dom";
import Login from "./pages/Login";
import PublicRoute from "@/app/routes/PublicRoute";

export const authRoutes: RouteObject[] = [
  {
    path: "/login",
    children: [
      {
        index: true,
        element: (
          <PublicRoute>
            <Login />
          </PublicRoute>
        ),
      },
    ],
  },
];
