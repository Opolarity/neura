import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, Users, Shield } from 'lucide-react';

const Settings = () => {
  const location = useLocation();
  const isRootSettings = location.pathname === '/settings';

  if (!isRootSettings) {
    return <Outlet />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground mt-2">
          Administra la configuración del sistema
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-primary" />
              Gestión de Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Administra usuarios, crea nuevos usuarios y gestiona las funciones asignadas a cada usuario.
            </p>
            <div className="mt-4 space-y-2">
              <div className="text-sm text-muted-foreground">• Listado de usuarios</div>
              <div className="text-sm text-muted-foreground">• Crear usuario</div>
              <div className="text-sm text-muted-foreground">• Funciones por usuario</div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-primary" />
              Gestión de Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Define y administra los roles del sistema, asigna funciones a roles y controla permisos.
            </p>
            <div className="mt-4 space-y-2">
              <div className="text-sm text-muted-foreground">• Listado de roles</div>
              <div className="text-sm text-muted-foreground">• Crear rol</div>
              <div className="text-sm text-muted-foreground">• Asignar funciones</div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <SettingsIcon className="w-5 h-5 text-primary" />
              Configuración General
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Configura aspectos generales del sistema como empresa, facturación y otros parámetros.
            </p>
            <div className="mt-4 space-y-2">
              <div className="text-sm text-muted-foreground">• Información de empresa</div>
              <div className="text-sm text-muted-foreground">• Parámetros de facturación</div>
              <div className="text-sm text-muted-foreground">• Configuración de sistema</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;