import React, { useState, useEffect } from 'react';
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
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  LucideIcon
} from 'lucide-react';
import { useFunctions } from '@/hooks/useFunctions';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar?: () => void;
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
  Plus,
  ArrowUpDown
};

const Sidebar = ({ isOpen: initialOpen }: SidebarProps) => {
  const location = useLocation();
  const { functions: menuItems, loading, error } = useFunctions();
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});
  const [isCollapsed, setIsCollapsed] = useState(!initialOpen);

  useEffect(() => {
    if (isCollapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
  }, [isCollapsed]);

  const toggleSection = (itemId: number) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setExpandedSections({ [itemId]: true });
      return;
    }
    setExpandedSections(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleToggleSidebar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCollapsed(!isCollapsed);
  };

  const SidebarHeader = () => (
    <div
      className={`border-b border-white/10 flex-shrink-0 flex items-center transition-all duration-300 h-[73px] ${isCollapsed ? 'justify-center px-2' : 'justify-between p-4'}`}
    >
      <div
        className={`flex items-center gap-3 cursor-pointer group/logo ${isCollapsed ? 'justify-center' : ''}`}
        onClick={() => isCollapsed && setIsCollapsed(false)}
      >
        <div className={`w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20 transition-all duration-300 ${isCollapsed ? 'hover:scale-110' : ''}`}>
          <Store className="w-5 h-5 text-white" />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col overflow-hidden">
            <h1 className="font-bold text-lg leading-none tracking-tight whitespace-nowrap">FUSE</h1>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-semibold whitespace-nowrap">ERP System</p>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <button
          onClick={handleToggleSidebar}
          className="p-1 hover:bg-white/5 rounded-md transition-colors text-slate-400 hover:text-white"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className={`fixed left-0 top-0 h-full bg-[#0f172a] text-white transition-all duration-300 z-30 flex flex-col ${isCollapsed ? 'w-16' : 'w-64'}`}>
        <SidebarHeader />
        <div className="flex items-center justify-center flex-1">
          <div className="text-slate-500 text-xs animate-pulse font-medium">Cargando...</div>
        </div>
      </div>
    );
  }

  const isPathActive = (path: string | null) => {
    if (!path || path === '#') return false;
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className={`fixed left-0 top-0 h-full bg-[#0f172a] text-white transition-all duration-300 z-30 flex flex-col border-r border-white/5 overflow-x-hidden ${isCollapsed ? 'w-16' : 'w-64'
      }`}>
      <SidebarHeader />

      <nav className="mt-4 flex-1 overflow-y-auto overflow-x-hidden px-2 space-y-1 py-4 scrollbar-hide">
        {menuItems.map((item) => {
          const Icon = item.icon ? iconMap[item.icon] || Grid : Grid;

          // Find the most specific subitem match (longest matching path)
          const allSubItems = 'subItems' in item ? item.subItems?.flatMap(group => group.items) || [] : [];
          const matchingSubLocations = allSubItems
            .map(si => si.location)
            .filter(loc => isPathActive(loc)) as string[];

          const bestSubMatch = matchingSubLocations.length > 0
            ? matchingSubLocations.sort((a, b) => b.length - a.length)[0]
            : null;

          const isAnySubItemActive = !!bestSubMatch;
          const isActive = isPathActive(item.location) || isAnySubItemActive;
          const hasSubItems = 'subItems' in item;
          const isExpanded = expandedSections[item.id];

          if (hasSubItems) {
            return (
              <div key={item.id} className="space-y-1">
                <button
                  onClick={() => toggleSection(item.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg w-full text-left group relative overflow-hidden transition-all duration-200 ${isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : isExpanded && !isCollapsed
                      ? 'bg-white/5 text-white'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                >
                  <div className={`flex items-center justify-center w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-white' : isExpanded && !isCollapsed ? 'text-blue-400' : 'group-hover:text-blue-400'
                    }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {!isCollapsed && (
                    <div className="flex items-center justify-between flex-1 truncate">
                      <span className="font-medium truncate whitespace-nowrap">{item.name}</span>
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform duration-300 ${isActive ? 'text-white' : isExpanded ? 'rotate-90 text-blue-400' : 'text-slate-600'}`} />
                    </div>
                  )}
                  {isCollapsed && isActive && (
                    <div className="absolute left-0 w-1 h-6 bg-white rounded-full translate-x-[-2px] animate-in fade-in" />
                  )}
                </button>
                {!isCollapsed && isExpanded && item.subItems && (
                  <div className="pl-6 mt-1 space-y-1 border-l border-white/5 ml-5 animate-in slide-in-from-top-1 duration-200">
                    {item.subItems.map((subGroup) => (
                      <div key={subGroup.label} className="space-y-1 pt-1">
                        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          {subGroup.label}
                        </div>
                        {subGroup.items.map((subItem) => {
                          const isSubActive = subItem.location === bestSubMatch;
                          return (
                            <Link
                              key={subItem.location || subItem.id}
                              to={subItem.location || '#'}
                              className={`flex items-center px-4 py-2 text-xs rounded-md transition-all relative ${isSubActive
                                ? 'text-blue-400 font-semibold bg-blue-400/5'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                              {isSubActive && <div className="absolute left-0 w-1 h-3 bg-blue-400 rounded-full" />}
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
              className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg group relative overflow-hidden transition-all duration-200 ${isActive
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <div className={`flex items-center justify-center w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'group-hover:text-blue-400 transition-colors'}`}>
                <Icon className="w-5 h-5" />
              </div>
              {!isCollapsed && (
                <span className="font-medium whitespace-nowrap">
                  {item.name}
                </span>
              )}
              {isCollapsed && isActive && (
                <div className="absolute left-0 w-1 h-6 bg-white rounded-full translate-x-[-2px] animate-in fade-in" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;