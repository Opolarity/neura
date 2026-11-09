import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { AuthProvider } from "@/modules/auth";
import { NotificationsProvider } from "@/modules/notifications/context/NotificationsProvider";
import { SupportUnreadProvider } from "@/modules/support/context/SupportUnreadProvider";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { Toaster } from "@/components/ui/toaster";
import { QueryProvider } from "./providers/QueryProvider";
import MaintenancePage from "@/components/MaintenancePage";
import { PrintHost } from "@/modules/print-templates/print/PrintHost";

const IS_MAINTENANCE_MODE = false;

const App = () => {
  if (IS_MAINTENANCE_MODE) {
    return <MaintenancePage />;
  }

  return (
    <QueryProvider>
      <TooltipProvider>
        <Toaster />
        <AuthProvider>
          {/* Los documentos que se imprimen con su plantilla (printDocument). */}
          <PrintHost />
          <NotificationsProvider>
            <SupportUnreadProvider>
              <RouterProvider router={router} />
            </SupportUnreadProvider>
          </NotificationsProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryProvider>
  );
};

export default App;