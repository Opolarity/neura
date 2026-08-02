import type { RouteObject } from "react-router-dom";
import { ROUTE_PERMISSIONS, type RoutePermission } from "@/app/data/permissions";

function flattenRoutePermissions(nodes: RoutePermission[]): RouteObject[] {
  return nodes.flatMap((node) => {
    const routes: RouteObject[] = [];

    if (node.route && node.component) {
      routes.push({ path: node.route, element: node.component });
    }

    // Reportes ya vive bajo <ReportsLayout/> (@/modules/reports), que comparte
    // un ReportsFiltersContext entre sus 7 páginas. No se aplana aparte para
    // no registrar esos mismos paths dos veces.
    if (node.nodes && node.code !== "REPORTES") {
      routes.push(...flattenRoutePermissions(node.nodes));
    }

    return routes;
  });
}

export const permissionRoutes: RouteObject[] = flattenRoutePermissions(ROUTE_PERMISSIONS);
