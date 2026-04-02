import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  ShoppingCart, Package, Warehouse, RotateCcw, DollarSign, Users,
} from 'lucide-react';
import { ReportsFilterBar } from '../components/shared/ReportsFilterBar';
import { ReportsFiltersContext } from '../context/ReportsFiltersContext';
import type { ReportsFilters } from '../types/reports.types';
import { DEFAULT_REPORTS_FILTERS } from '../types/reports.types';

const TABS = [
  { label: 'Ventas',      path: 'sales',     icon: ShoppingCart },
  { label: 'Productos',   path: 'products',  icon: Package },
  { label: 'Inventario',  path: 'stock',     icon: Warehouse },
  { label: 'Retornos',    path: 'returns',   icon: RotateCcw },
  { label: 'Financiero',  path: 'movements', icon: DollarSign },
  { label: 'Clientes',    path: 'clients',   icon: Users },
];

function ReportsLayout() {
  const [filters, setFilters] = useState<ReportsFilters>(DEFAULT_REPORTS_FILTERS);

  function handleFilterChange(partial: Partial<ReportsFilters>) {
    setFilters((prev) => ({ ...prev, ...partial }));
  }

  return (
    <ReportsFiltersContext.Provider value={{ filters, onChange: handleFilterChange }}>
      <div className="p-6 space-y-2">
        <div className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
          <p className="text-muted-foreground text-sm">Panel de análisis y métricas del negocio</p>
        </div>

        <ReportsFilterBar filters={filters} onChange={handleFilterChange} />

        <nav className="flex gap-1 mt-2 mb-6 border-b border-border overflow-x-auto">
          {TABS.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                [
                  'flex items-center gap-1.5 px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
                ].join(' ')
              }
            >
              <Icon size={14} />
              {label}
            </NavLink>
          ))}
        </nav>

        <Outlet />
      </div>
    </ReportsFiltersContext.Provider>
  );
}

export default ReportsLayout;
