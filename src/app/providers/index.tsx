import React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryProvider } from "./QueryProvider";
import { AuthProvider } from "@/modules/auth/context/AuthProvider";

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <QueryProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          {children}
        </AuthProvider>
      </TooltipProvider>
    </QueryProvider>
  );
};
