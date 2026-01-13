import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { Avatar } from 'primereact/avatar';
import { Badge } from 'primereact/badge';

interface HeaderProps {
  toggleSidebar: () => void;
  onSignOut: () => void;
}

const Header = ({ toggleSidebar, onSignOut }: HeaderProps) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            icon="pi pi-bars"
            text
            rounded
            severity="secondary"
            onClick={toggleSidebar}
            className="hover:bg-gray-100"
          />

          <IconField iconPosition="left">
            <InputIcon className="pi pi-search" />
            <InputText
              placeholder="Buscar productos, clientes..."
              className="w-80"
            />
          </IconField>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Button
              icon="pi pi-bell"
              text
              rounded
              severity="secondary"
              className="p-2"
            >
              <Badge value="" severity="danger" className="absolute top-2 right-2 p-1" style={{ width: '8px', height: '8px', minWidth: '8px' }}></Badge>
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Avatar icon="pi pi-user" className="bg-blue-600 text-white" shape="circle" />

            <div className="text-sm">
              <p className="font-medium">Admin </p>
              <p className="text-gray-500">Administrador</p>
            </div>

            <Button
              label="Salir"
              icon="pi pi-sign-out"
              outlined
              severity="secondary"
              size="small"
              onClick={onSignOut}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;