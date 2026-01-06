import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/modules/auth";
import DashboardLayout from "@/app/layouts/DashboardLayout";
import ProtectedRoute from "@/shared/components/ProtectedRoute";
import NotFound from "@/shared/components/NotFound";
import Login from "@/modules/auth/pages/Login";

// Dashboard
import Dashboard from "@/modules/dashboard/pages/Dashboard";

// Products
import Products from "@/modules/products/pages/Products";
import AddProduct from "@/modules/products/pages/AddProduct";
import ProductCosts from "@/modules/products/pages/ProductCosts";
import Categories from "@/modules/products/pages/Categories";

// Inventory
import Inventory from "@/modules/inventory/pages/Inventory";
import InventoryMovements from "@/modules/inventory/pages/Movements";

// Sales
import Sales from "@/modules/sales/pages/Sales";
import SalesList from "@/modules/sales/pages/SalesList";
import CreateSale from "@/modules/sales/pages/CreateSale";
import ViewSale from "@/modules/sales/pages/ViewSale";

// Customers
import Customers from "@/modules/customers/pages/Customers";
import ClientsList from "@/modules/customers/pages/ClientsList";
import CreateClient from "@/modules/customers/pages/CreateClient";
import EditClient from "@/modules/customers/pages/EditClient";

// Returns
import Returns from "@/modules/returns/pages/Returns";
import CreateReturn from "@/modules/returns/pages/CreateReturn";
import EditReturn from "@/modules/returns/pages/EditReturn";

// Other modules
import Shipping from "@/modules/shipping/pages/Shipping";
import Invoices from "@/modules/invoices/pages/Invoices";
import POS from "@/modules/pos/pages/POS";
import Movements from "@/modules/movements/pages/Movements";
import AddExpense from "@/modules/expenses/pages/AddExpense";
import Reports from "@/modules/reports/pages/Reports";

// Settings
import Settings from "@/modules/settings/pages/Settings";
import UsersList from "@/modules/settings/pages/UsersList";
import CreateUser from "@/modules/settings/pages/CreateUser";
import UserFunctions from "@/modules/settings/pages/UserFunctions";
import RolesList from "@/modules/settings/pages/RolesList";
import CreateRole from "@/modules/settings/pages/CreateRole";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
              <Route path="products" element={<Products />} />
              <Route path="categories" element={<Categories />} />
              <Route path="products/add" element={<AddProduct />} />
              <Route path="products/costs" element={<ProductCosts />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="inventory/movements" element={<InventoryMovements />} />
              <Route path="sales" element={<Sales />} />
              <Route path="sales/list" element={<SalesList />} />
              <Route path="sales/create" element={<CreateSale />} />
              <Route path="sales/edit/:id" element={<CreateSale />} />
              <Route path="sales/:id" element={<ViewSale />} />
              <Route path="shipping" element={<Shipping />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="pos" element={<POS />} />
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
  </QueryClientProvider>
);

export default App;
