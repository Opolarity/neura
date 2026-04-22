import ProtectedRoute from "@/app/routes/ProtectedRoute";
import DashboardLayout from "@/layouts/DashboardLayout";

export const ProtectedLayout = {
  element: (
    <ProtectedRoute>
      <DashboardLayout />
    </ProtectedRoute>
  ),
  children: [],
};
