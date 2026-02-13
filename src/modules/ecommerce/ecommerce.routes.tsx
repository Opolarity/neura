import type { RouteObject } from "react-router-dom";
import MediaGalleryPage from "./pages/MediaGalleryPage";

export const ecommerceRoutes: RouteObject[] = [
  {
    path: "medios",
    element: <MediaGalleryPage />,
  },
];
