import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import { useAuth } from "@/modules/auth";

const DashboardLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        isOpen={!isSidebarCollapsed}
        onCollapseChange={setIsSidebarCollapsed} />

      <div
        className={`flex-1 min-w-0 transition-all duration-300 ${isSidebarCollapsed ? "ml-16" : "ml-64"}`
        }>

        <Header
          toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onSignOut={handleSignOut} />

        <main className="p-6 min-w-0 overflow-hidden py-[20px] px-[20px]">
          <Outlet />
        </main>
      </div>
    </div>);

};

export default DashboardLayout;