import { RouteObject } from "react-router-dom";
import UsersList from "./pages/UsersList";
import CreateUser from "./pages/CreateUser";
import UserFunctions from "./pages/UserFunctions";
import RolesList from "./pages/RolesList";
import CreateRole from "./pages/CreateRole";
import WarehousesList from "./pages/warehouses";
import CreateWarehouses from "./pages/CreateWarehouses";
import BranchesList from "./pages/branches";
import CreateBranch from "./pages/CreateBranch";
import PaymentMethodsList from "./pages/PaymentMethodsList";
import OrderChannelTypesList from "./pages/OrderChannelTypesList";
import CreateOrderChannelType from "./pages/CreateOrderChannelType";
import PriceListPage from "./pages/PriceListPage";
import StockTypePage from "./pages/StockTypePage";
import BusinessAccountPage from "./pages/BusinessAccountPage";
import MovementClassesPage from "./pages/MovementClassesPage";


export const settingsRoutes: RouteObject[] = [
  { path: "settings/users", element: <UsersList /> },
  { path: "settings/users/create", element: <CreateUser /> },
  { path: "settings/users/edit/:uid", element: <CreateUser /> },
  { path: "settings/users/functions", element: <UserFunctions /> },
  { path: "settings/roles", element: <RolesList /> },
  { path: "settings/roles/create", element: <CreateRole /> },
  { path: "settings/roles/edit/:id", element: <CreateRole /> },
  { path: "settings/warehouses", element: <WarehousesList /> },
  { path: "settings/warehouses/create", element: <CreateWarehouses /> },
  { path: "settings/warehouses/edit/:id", element: <CreateWarehouses /> },
  { path: "settings/branches", element: <BranchesList /> },
  { path: "settings/branches/create", element: <CreateBranch /> },
  { path: "settings/branches/edit/:id", element: <CreateBranch /> },
  { path: "settings/payment-methods", element: <PaymentMethodsList /> },
  { path: "settings/order-channel-types", element: <OrderChannelTypesList /> },
  { path: "settings/order-channel-types/create", element: <CreateOrderChannelType /> },
  { path: "settings/order-channel-types/edit/:id", element: <CreateOrderChannelType /> },
  { path: "settings/price-list", element: <PriceListPage /> },
  { path: "settings/stock-types", element: <StockTypePage /> },
  { path: "settings/business-accounts", element: <BusinessAccountPage /> },
  { path: "settings/movement-classes", element: <MovementClassesPage /> },
];
