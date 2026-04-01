import type { RouteObject } from "react-router-dom";
import MediaGalleryPage from "./pages/MediaGalleryPage";
import PromotionalTextPage from "./pages/PromotionalTextPage";

export const ecommerceRoutes: RouteObject[] = [
  {
    path: "/ecommerce",
    children: [
      { path: "medios", element: <MediaGalleryPage /> },
      { path: "promotional-text", element: <PromotionalTextPage /> },
    ],
  },
];
