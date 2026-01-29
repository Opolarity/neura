import { RouteObject, Outlet } from 'react-router-dom';
import Settings from './pages/Settings';
import UsersList from './pages/UsersList';
import CreateUser from './pages/CreateUser';
import UserFunctions from './pages/UserFunctions';
import RolesList from './pages/RolesList';
import CreateRole from './pages/CreateRole';
import WarehousesList from './pages/warehouses';
import CreateWarehouses from './pages/CreateWarehouses';
import BranchesList from './pages/branches';
import CreateBranch from './pages/CreateBranch';

export const settingsRoutes: RouteObject[] = [
  {
    path: 'settings',
    element: <Settings />,
    children: [
      { path: 'users', element: <UsersList /> },
      { path: 'users/create', element: <CreateUser /> },
      { path: 'users/functions', element: <UserFunctions /> },
      { path: 'roles', element: <RolesList /> },
      { path: 'roles/create', element: <CreateRole /> },
      { path: 'roles/edit/:id', element: <CreateRole /> },
      { path: 'warehouses', element: <WarehousesList /> },
      { path: 'warehouses/create', element: <CreateWarehouses /> },
      { path: 'warehouses/edit/:id', element: <CreateWarehouses /> },
      { path: 'branches', element: <BranchesList /> },
      { path: 'branches/create', element: <CreateBranch /> },
      { path: 'branches/edit/:id', element: <CreateBranch /> },
    ]
  },
];
