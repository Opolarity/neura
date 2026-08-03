import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { AuthProvider } from "@/modules/auth";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryProvider } from "./providers/QueryProvider";
import MaintenancePage from "@/components/MaintenancePage";

const IS_MAINTENANCE_MODE = false;

const App = () => {
  if (IS_MAINTENANCE_MODE) {
    return <MaintenancePage />;
  }

  return (
    <QueryProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </TooltipProvider>
    </QueryProvider>
  );
};

export default App;