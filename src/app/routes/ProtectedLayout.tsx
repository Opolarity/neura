import ProtectedRoute from "@/app/routes/ProtectedRoute";
import DashboardLayout from "@/layouts/DashboardLayout";
import PermissionRoute from "./PermissionRoute";
import { FunctionsProvider } from "@/contexts/FunctionsContext";

export const ProtectedLayout = {
  element: (
    <ProtectedRoute>
      <FunctionsProvider>
        <PermissionRoute>
          <DashboardLayout />
        </PermissionRoute>
      </FunctionsProvider>
    </ProtectedRoute>
  ),
  children: [],
};
