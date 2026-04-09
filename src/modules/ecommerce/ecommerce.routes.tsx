import type { RouteObject } from "react-router-dom";
import MediaGalleryPage from "./pages/MediaGalleryPage";
import MassiveEditPage from "./pages/MassiveEditPage";

export const ecommerceRoutes: RouteObject[] = [
  {
    path: "/ecommerce",
    children: [
      { path: "medios", element: <MediaGalleryPage /> },
      { path: "edit", element: <MassiveEditPage /> },
    ],
  },
];
