import React from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "../components/layout/AppSidebar";
import Header from "../components/layout/Header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/modules/auth";

const DashboardLayout = () => {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  // El estado abierto/colapsado lo gestiona SidebarProvider; el toggle vive en
  // el header del propio sidebar.
  return (
    <SidebarProvider className="bg-gray-50">

      <AppSidebar />

      <div className="flex-1 min-w-0">

        <Header onSignOut={handleSignOut} />

        <main className="p-6 min-w-0 overflow-hidden py-[20px] px-[20px]">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>);

};

export default DashboardLayout;