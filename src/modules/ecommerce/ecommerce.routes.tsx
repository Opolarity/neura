import type { RouteObject } from "react-router-dom";
import MediaGalleryPage from "./pages/MediaGalleryPage";
import MassiveEditPage from "./pages/MassiveEditPage";
import ReclamacionesPage from "./pages/ReclamacionesPage";
import ReclamacionViewPage from "./pages/ReclamacionViewPage";

export const ecommerceRoutes: RouteObject[] = [
  {
    path: "/ecommerce",
    children: [
      { path: "medios", element: <MediaGalleryPage /> },
      { path: "edit", element: <MassiveEditPage /> },
      { path: "reclamaciones", element: <ReclamacionesPage /> },
      { path: "reclamaciones/view/:id", element: <ReclamacionViewPage /> },
    ],
  },
];
