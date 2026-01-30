import React, { useState, useEffect, useRef } from 'react';
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
  onCollapseChange?: (collapsed: boolean) => void;
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

const Sidebar = ({ isOpen: initialOpen, onCollapseChange }: SidebarProps) => {
  const location = useLocation();
  const { functions: menuItems, loading, error } = useFunctions();
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});
  const [isCollapsed, setIsCollapsed] = useState(!initialOpen);
  const [hoveredItem, setHoveredItem] = useState<{ id: number; name: string; rect: DOMRect; subItems?: any[] } | null>(null);
  const [activeSubMenu, setActiveSubMenu] = useState<{ id: number; name: string; rect: DOMRect; subItems: any[] } | null>(null);
  const subMenuRef = useRef<HTMLDivElement>(null);

  // Update internal state when prop changes
  useEffect(() => {
    setIsCollapsed(!initialOpen);
  }, [initialOpen]);

  useEffect(() => {
    if (isCollapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
    onCollapseChange?.(isCollapsed);
  }, [isCollapsed, onCollapseChange]);


  // Close active sub menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (subMenuRef.current && !subMenuRef.current.contains(event.target as Node)) {
        setActiveSubMenu(null);
      }
    };

    if (activeSubMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeSubMenu]);

  const toggleSection = (itemId: number, e: React.MouseEvent, item: any) => {
    if (isCollapsed) {
      const rect = e.currentTarget.getBoundingClientRect();
      if (item.subItems) {
        setActiveSubMenu({ id: itemId, name: item.name, rect, subItems: item.subItems });
        setHoveredItem(null);
      } else {
        setIsCollapsed(false);
        setExpandedSections({ [itemId]: true });
      }
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
    setActiveSubMenu(null);
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

  const SkeletonItem = () => (
    <div className="px-2 space-y-3 mt-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-5 h-5 rounded skeleton" />
          {!isCollapsed && <div className="h-4 w-32 rounded skeleton" />}
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className={`fixed left-0 top-0 h-full bg-[#0f172a] text-white transition-all duration-300 z-30 flex flex-col ${isCollapsed ? 'w-16' : 'w-64'}`}>
        <SidebarHeader />
        <SkeletonItem />
      </div>
    );
  }

  const isPathActive = (path: string | null) => {
    if (!path || path === '#') return false;
    const currentPath = location.pathname;

    // Exact match is always active
    if (currentPath === path) return true;
    if (path === '/') return currentPath === '/';

    // Recursive helper to get all nested locations
    const getAllPaths = (items: any[]): string[] => {
      return items.reduce((acc: string[], item: any) => {
        if (item.location) acc.push(item.location);
        if (item.subItems) {
          // Handle both item.subItems (MenuFunction) and item.items (Inner items)
          const children = Array.isArray(item.subItems)
            ? item.subItems.flatMap((g: any) => g.items || [])
            : [];
          acc.push(...getAllPaths(children));
        }
        return acc;
      }, []);
    };

    const allPaths = getAllPaths(menuItems);

    // A match is only "active" if it's the most specific match for the current URL
    const betterMatch = allPaths.find(p =>
      p !== path &&
      p.length > path.length &&
      (currentPath === p || currentPath.startsWith(`${p}/`))
    );

    if (betterMatch) return false;

    return currentPath.startsWith(`${path}/`);
  };


  return (
    <div className={`fixed left-0 top-0 h-full bg-[#0f172a] text-white transition-all duration-300 z-30 flex flex-col border-r border-white/5 overflow-x-hidden ${isCollapsed ? 'w-16' : 'w-64'
      }`}>
      <SidebarHeader />

      <div className="mt-4 flex-1 flex flex-col overflow-hidden">

        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 space-y-1 py-4 sidebar-scroll">
          {menuItems.map((item) => {
            const Icon = item.icon ? iconMap[item.icon] || Grid : Grid;

            // Find the most specific subitem match
            const allSubItems = 'subItems' in item ? item.subItems?.flatMap(group => group.items) || [] : [];
            const activeSubItem = allSubItems.find(si => isPathActive(si.location));

            const isActive = isPathActive(item.location) || !!activeSubItem;
            const hasSubItems = 'subItems' in item;
            const isExpanded = expandedSections[item.id];

            const handleMouseEnter = (e: React.MouseEvent) => {
              if (isCollapsed && !activeSubMenu) {
                setHoveredItem({
                  id: item.id,
                  name: item.name,
                  rect: e.currentTarget.getBoundingClientRect(),
                  subItems: hasSubItems ? item.subItems : undefined
                });
              }
            };

            if (hasSubItems) {
              return (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={(e) => toggleSection(item.id, e, item)}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={() => setHoveredItem(null)}
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
                            const isSubActive = isPathActive(subItem.location);
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
                onMouseEnter={handleMouseEnter}
                onMouseLeave={() => setHoveredItem(null)}
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

      {/* Hover Chip / Tooltip */}
      {isCollapsed && hoveredItem && !activeSubMenu && (
        <div
          className="fixed left-20 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-xl z-50 pointer-events-none animate-in fade-in slide-in-from-left-2 duration-200"
          style={{ top: hoveredItem.rect.top + (hoveredItem.rect.height / 2) - 16 }}
        >
          {hoveredItem.name}
        </div>
      )}

      {/* Compressed Sub-navigation Panel */}
      {isCollapsed && activeSubMenu && (
        <div
          ref={subMenuRef}
          className="sidebar-floating-panel left-20 w-56 p-2 max-h-[80vh] overflow-y-auto sidebar-scroll"
          style={{ top: Math.min(activeSubMenu.rect.top, window.innerHeight - 300) }}
        >
          <div className="px-3 py-2 mb-2 border-b border-white/5">
            <span className="text-sm font-bold text-white uppercase tracking-wider">{activeSubMenu.name}</span>
          </div>
          <div className="space-y-4">
            {activeSubMenu.subItems.map((subGroup) => (
              <div key={subGroup.label}>
                <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">
                  {subGroup.label}
                </div>
                <div className="space-y-1">
                  {subGroup.items.map((subItem: any) => {
                    const isSubActive = isPathActive(subItem.location);
                    return (
                      <Link
                        key={subItem.location || subItem.id}
                        to={subItem.location || '#'}
                        onClick={() => setActiveSubMenu(null)}
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
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
