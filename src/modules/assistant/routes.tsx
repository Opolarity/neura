import type { RouteObject } from "react-router-dom";
import AssistantPage from "./pages/AssistantPage";

export const assistantRoutes: RouteObject[] = [
  { path: "assistant", element: <AssistantPage /> },
];
