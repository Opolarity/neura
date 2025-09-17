
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Store, 
  Archive, 
  ShoppingCart, 
  FileText, 
  Grid, 
  Settings,
  Tag,
  Users,
  Calendar
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar = ({ isOpen }: SidebarProps) => {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: Grid, label: 'Dashboard' },
    { path: '/products', icon: Tag, label: 'Productos' },
    { path: '/inventory', icon: Archive, label: 'Inventario' },
    { path: '/sales', icon: ShoppingCart, label: 'Ventas' },
    { path: '/invoices', icon: FileText, label: 'Facturación' },
    { path: '/pos', icon: Store, label: 'Punto de Venta' },
    { path: '/customers', icon: Users, label: 'Clientes' },
    { path: '/reports', icon: Calendar, label: 'Reportes' },
    { 
      path: '/settings', 
      icon: Settings, 
      label: 'Configuración',
      subItems: [
        {
          label: 'Usuarios',
          items: [
            { path: '/settings/users', label: 'Listado de usuarios' },
            { path: '/settings/users/create', label: 'Crear usuario' },
            { path: '/settings/users/functions', label: 'Funciones por usuario' }
          ]
        },
        {
          label: 'Roles',
          items: [
            { path: '/settings/roles', label: 'Listado de roles' },
            { path: '/settings/roles/create', label: 'Crear rol' }
          ]
        }
      ]
    },
  ];

  return (
    <div className={`fixed left-0 top-0 h-full bg-slate-900 text-white transition-all duration-300 z-30 flex flex-col ${
      isOpen ? 'w-64' : 'w-16'
    }`}>
      <div className="p-4 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Store className="w-5 h-5" />
          </div>
          {isOpen && (
            <div>
              <h1 className="font-bold text-lg">OVERTAKE</h1>
              <p className="text-xs text-slate-400">ERP System</p>
            </div>
          )}
        </div>
      </div>

      <nav className="mt-6 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const hasSubItems = 'subItems' in item;
          const isSettingsSection = location.pathname.startsWith('/settings');
          
          if (hasSubItems) {
            return (
              <div key={item.path} className="space-y-1">
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-800 transition-colors ${
                    isSettingsSection ? 'bg-blue-600 border-r-2 border-blue-400' : ''
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {isOpen && <span>{item.label}</span>}
                </Link>
                {isOpen && isSettingsSection && item.subItems && (
                  <div className="ml-4 space-y-1">
                    {item.subItems.map((subGroup) => (
                      <div key={subGroup.label} className="space-y-1">
                        <div className="px-4 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
                          {subGroup.label}
                        </div>
                        {subGroup.items.map((subItem) => {
                          const isSubActive = location.pathname === subItem.path;
                          return (
                            <Link
                              key={subItem.path}
                              to={subItem.path}
                              className={`flex items-center px-4 py-2 text-sm hover:bg-slate-800 transition-colors ml-4 ${
                                isSubActive ? 'bg-slate-700 text-blue-400' : 'text-slate-300'
                              }`}
                            >
                              {subItem.label}
                            </Link>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-800 transition-colors ${
                isActive ? 'bg-blue-600 border-r-2 border-blue-400' : ''
              }`}
            >
              <Icon className="w-5 h-5" />
              {isOpen && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
