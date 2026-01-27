import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

export default function UsersHeader() {
  return (
    <div className="flex justify-between items-start">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Listado de Usuarios
        </h1>
        <p className="text-muted-foreground">
          Administra los usuarios del sistema y sus funciones asignadas
        </p>
      </div>
      <Button asChild className="gap-2">
        <Link to="#">
          <Plus className="w-4 h-4" />
          Crear Usuario
        </Link>
      </Button>
    </div>
  );
}
