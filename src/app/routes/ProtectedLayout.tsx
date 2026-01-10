import ProtectedRoute from "@/app/routes/ProtectedRoute";
import DashboardLayout from "@/layouts/DashboardLayout";

export const protectedLayout = {
  element: (
    <ProtectedRoute>
      <DashboardLayout />
    </ProtectedRoute>
  ),
  children: [],
};
