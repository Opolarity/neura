import ProtectedRoute from "@/app/routes/ProtectedRoute";
import DashboardLayout from "@/layouts/DashboardLayout";
import { FunctionsProvider } from "@/modules/auth/context/FunctionsProvider";

export const ProtectedLayout = {
  element: (
    <FunctionsProvider>
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    </FunctionsProvider>
  ),
  children: [],
};
