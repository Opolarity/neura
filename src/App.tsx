import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from './contexts/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import AddProduct from './pages/AddProduct';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import SalesList from './pages/SalesList';
import CreateSale from './pages/CreateSale';
import Invoices from './pages/Invoices';
import POS from './pages/POS';
import Settings from './pages/Settings';
import Shipping from './pages/Shipping';
import Customers from './pages/Customers';
import ClientsList from './pages/customers/ClientsList';
import CreateClient from './pages/customers/CreateClient';
import EditClient from './pages/customers/EditClient';
import UsersList from './pages/settings/UsersList';
import CreateUser from './pages/settings/CreateUser';
import UserFunctions from './pages/settings/UserFunctions';
import RolesList from './pages/settings/RolesList';
import CreateRole from './pages/settings/CreateRole';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from "./pages/NotFound";

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
            <Route path="/" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="products/add" element={<AddProduct />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="sales" element={<Sales />} />
              <Route path="sales/list" element={<SalesList />} />
              <Route path="sales/create" element={<CreateSale />} />
              <Route path="sales/edit/:id" element={<CreateSale />} />
              <Route path="shipping" element={<Shipping />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="pos" element={<POS />} />
              <Route path="customers" element={<Customers />}>
                <Route path="list" element={<ClientsList />} />
                <Route path="create" element={<CreateClient />} />
                <Route path="edit/:id" element={<EditClient />} />
              </Route>
              <Route path="reports" element={<div className="p-6"><h1 className="text-2xl font-bold">Reportes</h1><p className="text-gray-600">Funcionalidad en desarrollo</p></div>} />
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
