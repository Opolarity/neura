import { BrowserRouter } from "react-router-dom";
import AppRouter from "./routes";
import { AuthProvider } from "@/modules/auth";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryProvider } from "./providers/QueryProvider";

const App = () => {
  return (
    <QueryProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryProvider>
  );
};

export default App;

/*
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/modules/auth/context/AuthProvider";
import DashboardLayout from "../layouts/DashboardLayout";
import Dashboard from "@/modules/dashboard/pages/Dashboard";
import Products from "@/modules/products/pages/ProductsPage"; //ORIGINAL
//import Products from "../modules/products/pages/ProductsA"; //PRUEBA
import AddProduct from "@/modules/products/pages/AddProduct";
import Inventory from "@/modules/inventory/pages/Inventory";
import Sales from "@/modules/sales/pages/Sales";
import SalesList from "@/modules/sales/pages/SalesList";
import CreateSale from "@/modules/sales/pages/CreateSale";
import ViewSale from "@/modules/sales//pages/ViewSale";
import Invoices from "@/modules/invoices/pages/Invoices";
import POS from "@/modules/pos/pages/POS";
import Settings from "@/modules/settings/pages/Settings";
import Shipping from "@/modules/shipping/pages/Shipping";
import Customers from "@/modules/customers/pages/Customers";
import ClientsList from "@/modules/customers/pages/ClientsList";
import CreateClient from "@/modules/customers/pages/CreateClient";
import EditClient from "@/modules/customers/pages/EditClient";
import UsersList from "@/modules/settings/pages/UsersList";
import CreateUser from "@/modules/settings/pages/CreateUser";
import UserFunctions from "@/modules/settings/pages/UserFunctions";
import RolesList from "@/modules/settings/pages/RolesList";
import CreateRole from "@/modules/settings/pages/CreateRole";
import Login from "@/modules/auth/pages/Login";
import ProtectedRoute from "@/app/routes/ProtectedRoute";
import NotFound from "@/shared/components/NotFound";
import Categories from "@/modules/products/pages/Categories";
import ProductCosts from "@/modules/products/pages/ProductCostsPage";
import AddExpense from "@/modules/expenses/pages/AddExpense";
import Movements from "@/modules/movements/pages/Movements";
import Returns from "@/modules/returns/pages/Returns";
import CreateReturn from "@/modules/returns/pages/CreateReturn";
import EditReturn from "@/modules/returns/pages/EditReturn";
import Reports from "@/modules/reports/pages/Reports";
import InventoryMovements from "@/modules/inventory/pages/Movements";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />}></Route>
            <Route path="categories" element={<Categories />} />
            <Route path="products/add" element={<AddProduct />} />
            <Route path="products/costs" element={<ProductCosts />} />
            <Route path="inventory" element={<Inventory />} />
            <Route
              path="inventory/movements"
              element={<InventoryMovements />}
            />
            <Route path="sales" element={<Sales />} />
            <Route path="sales/list" element={<SalesList />} />
            <Route path="sales/create" element={<CreateSale />} />
            <Route path="sales/edit/:id" element={<CreateSale />} />
            <Route path="sales/:id" element={<ViewSale />} />
            <Route path="shipping" element={<Shipping />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="pos/open" element={<POS />} />
            <Route path="customers" element={<Customers />}>
              <Route path="list" element={<ClientsList />} />
              <Route path="create" element={<CreateClient />} />
              <Route path="edit/:id" element={<EditClient />} />
            </Route>
            <Route path="reports" element={<Reports />} />
            <Route path="movements" element={<Movements />} />
            <Route path="movements/add/expenses" element={<AddExpense />} />
            <Route path="returns" element={<Returns />} />
            <Route path="returns/add" element={<CreateReturn />} />
            <Route path="returns/edit/:id" element={<EditReturn />} />
            <Route path="settings" element={<Settings />}>
              <Route path="users" element={<UsersList />} />
              <Route path="users/create" element={<CreateUser />} />
              <Route path="users/functions" element={<UserFunctions />} />
              <Route path="roles" element={<RolesList />} />
              <Route path="roles/create" element={<CreateRole />} />
              <Route path="roles/edit/:id" element={<CreateRole />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
*/
