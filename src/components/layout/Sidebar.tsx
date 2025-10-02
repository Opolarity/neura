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
  Calendar,
  Plus,
  LucideIcon
} from 'lucide-react';
import { useFunctions } from '@/hooks/useFunctions';

interface SidebarProps {
  isOpen: boolean;
}

// Icon mapping from string names to actual icon components
const iconMap: Record<string, LucideIcon> = {
  Grid,
  Tag,
  Archive,
  ShoppingCart,
  FileText,
  Store,
  Users,
  Calendar,
  Settings,
  Plus
};

const Sidebar = ({ isOpen }: SidebarProps) => {
  const location = useLocation();
  const { functions: menuItems, loading, error } = useFunctions();

  if (loading) {
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
        <div className="flex items-center justify-center flex-1">
          <div className="text-slate-400">Cargando...</div>
        </div>
      </div>
    );
  }

  if (error) {
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
        <div className="flex items-center justify-center flex-1">
          <div className="text-red-400">Error: {error}</div>
        </div>
      </div>
    );
  }

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
          const Icon = item.icon ? iconMap[item.icon] || Grid : Grid;
          const isActive = location.pathname === item.location;
          const hasSubItems = 'subItems' in item;
          const isSectionActive = item.location ? location.pathname.startsWith(item.location) : false;
          
          if (hasSubItems) {
            return (
              <div key={item.location || item.id} className="space-y-1">
                <Link
                  to={item.location || '#'}
                  className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-800 transition-colors ${
                    isSectionActive ? 'bg-blue-600 border-r-2 border-blue-400' : ''
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {isOpen && <span>{item.name}</span>}
                </Link>
                {isOpen && isSectionActive && item.subItems && (
                  <div className="ml-4 space-y-1">
                    {item.subItems.map((subGroup) => (
                      <div key={subGroup.label} className="space-y-1">
                        <div className="px-4 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
                          {subGroup.label}
                        </div>
                        {subGroup.items.map((subItem) => {
                          const isSubActive = location.pathname === subItem.location;
                          return (
                            <Link
                              key={subItem.location || subItem.id}
                              to={subItem.location || '#'}
                              className={`flex items-center px-4 py-2 text-sm hover:bg-slate-800 transition-colors ml-4 ${
                                isSubActive ? 'bg-slate-700 text-blue-400' : 'text-slate-300'
                              }`}
                            >
                              {subItem.name}
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
              key={item.location || item.id}
              to={item.location || '#'}
              className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-800 transition-colors ${
                isActive ? 'bg-blue-600 border-r-2 border-blue-400' : ''
              }`}
            >
              <Icon className="w-5 h-5" />
              {isOpen && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;