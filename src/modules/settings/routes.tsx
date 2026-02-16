import { RouteObject, Outlet } from "react-router-dom";
import Settings from "./pages/Settings";
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
import CreatePaymentMethod from "./pages/CreatePaymentMethod";
import OrderChannelTypesList from "./pages/OrderChannelTypesList";
import CreateOrderChannelType from "./pages/CreateOrderChannelType";
import PriceListPage from "./pages/PriceListPage";

export const settingsRoutes: RouteObject[] = [
  {
    path: "settings",
    element: <Settings />,
    children: [
      { path: "users", element: <UsersList /> },
      { path: "users/create", element: <CreateUser /> },
      { path: "users/functions", element: <UserFunctions /> },
      { path: "roles", element: <RolesList /> },
      { path: "roles/create", element: <CreateRole /> },
      { path: "roles/edit/:id", element: <CreateRole /> },
      { path: "warehouses", element: <WarehousesList /> },
      { path: "warehouses/create", element: <CreateWarehouses /> },
      { path: "warehouses/edit/:id", element: <CreateWarehouses /> },
      { path: "branches", element: <BranchesList /> },
      { path: "branches/create", element: <CreateBranch /> },
      { path: "branches/edit/:id", element: <CreateBranch /> },
      { path: "payment-methods", element: <PaymentMethodsList /> },
      { path: "payment-methods/create", element: <CreatePaymentMethod /> },
      { path: "payment-methods/edit/:id", element: <CreatePaymentMethod /> },
      { path: "order-channel-types", element: <OrderChannelTypesList /> },
      {
        path: "order-channel-types/create",
        element: <CreateOrderChannelType />,
      },
      { path: "price-list", element: <PriceListPage /> },
    ],
  },
];
