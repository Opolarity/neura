import { Navigate } from "react-router-dom";

import Products from "@/modules/products/pages/ProductsPage";
import AddProduct from "@/modules/products/pages/AddProduct";
import ProductCosts from "@/modules/products/pages/ProductCostsPage";
import Categories from "@/modules/products/pages/CategoriesPage";
import Attributes from "@/modules/products/pages/AttributesPage";

import Inventory from "@/modules/inventory/pages/Inventory";
import InventoryMovements from "@/modules/inventory/pages/Movements";
import CreateMovement from "@/modules/inventory/pages/CreateMovement";
import MovementRequests from "@/modules/inventory/pages/MovementRequests";
import CreateMovementRequest from "@/modules/inventory/pages/CreateMovementRequest";
import EditMovementRequest from "@/modules/inventory/pages/EditMovementRequest";
import CreateSendMovement from "@/modules/inventory/pages/CreateSendMovement";

import BarcodesPage from "@/modules/barcodes/pages/BarcodesPage";

import AccountsList from "@/modules/customers/pages/AccountsList";
import CustomerPoints from "@/modules/customers/pages/CustomerPoints";
import CustomerPointsMovements from "@/modules/customers/pages/CustomerPointsMovements";

import Sales from "@/modules/sales/pages/Sales";
import FranchiseProducts from "@/modules/sales/pages/FranchiseProducts";
import CreateSale from "@/modules/sales/pages/CreateSale";
import SalesPOS from "@/modules/sales/pages/POS";
import Shipping from "@/modules/sales/pages/Shipping";
import CreateShipping from "@/modules/sales/pages/CreateShipping";

import POSList from "@/modules/pos/pages/POSList";

import Returns from "@/modules/returns/pages/Returns";
import CreateReturn from "@/modules/returns/pages/CreateReturn";
import EditReturn from "@/modules/returns/pages/EditReturn";

import PriceRulesPage from "@/modules/discounts/pages/PriceRulesPage";
import PriceRuleFormPage from "@/modules/discounts/pages/PriceRuleFormPage";
import BirthdayNotification from "@/modules/discounts/pages/BirthdayNotification";

import MovementsPage from "@/modules/movements/pages/MovementsPage";
import AddMovementPage from "@/modules/movements/pages/AddMovementPage";

import Invoices from "@/modules/invoices/pages/Invoices";
import CreateInvoice from "@/modules/invoices/pages/CreateInvoice";
import InvoiceSeriesPage from "@/modules/settings/pages/InvoiceSeriesPage";
import InvoiceSeriesFormPage from "@/modules/settings/pages/InvoiceSeriesFormPage";

import ReportsSalesPage from "@/modules/reports/pages/SalesPage";
import ReportsProductsPage from "@/modules/reports/pages/ProductsPage";
import ReportsStockPage from "@/modules/reports/pages/StockPage";
import ReportsReturnsPage from "@/modules/reports/pages/ReturnsPage";
import ReportsMovementsPage from "@/modules/reports/pages/MovementsPage";
import ReportsClientsPage from "@/modules/reports/pages/ClientsPage";
import PriceRulesReportPage from "@/modules/reports/pages/PriceRulesReportPage";

import StockTypePage from "@/modules/settings/pages/StockTypePage";
import PriceListPage from "@/modules/settings/pages/PriceListPage";
import PaymentMethodsList from "@/modules/settings/pages/PaymentMethodsList";
import BusinessAccountPage from "@/modules/settings/pages/BusinessAccountPage";
import WarehousesList from "@/modules/settings/pages/warehouses";
import CreateWarehouses from "@/modules/settings/pages/CreateWarehouses";
import BranchesList from "@/modules/settings/pages/branches";
import CreateBranch from "@/modules/settings/pages/CreateBranch";
import UsersList from "@/modules/settings/pages/UsersList";
import CreateUser from "@/modules/settings/pages/CreateUser";
import RolesList from "@/modules/settings/pages/RolesList";
import CreateRole from "@/modules/settings/pages/CreateRole";
import OrderChannelTypesList from "@/modules/settings/pages/OrderChannelTypesList";
import CreateOrderChannelType from "@/modules/settings/pages/CreateOrderChannelType";

import MediaGalleryPage from "@/modules/ecommerce/pages/MediaGalleryPage";
import MassiveEditPage from "@/modules/ecommerce/pages/MassiveEditPage";
import ReclamacionesPage from "@/modules/ecommerce/pages/ReclamacionesPage";
import ReclamacionViewPage from "@/modules/ecommerce/pages/ReclamacionViewPage";

export interface ComponentPermission {
  code: string;
  name: string;
  group?: string;
}

export interface RoutePermission {
  route: string;
  code: string;
  name: string;
  group?: string;
  component?: JSX.Element;
  showInSidebar?: boolean;
  capabilities?: ComponentPermission[];
  nodes?: RoutePermission[];
}

export const ROUTE_PERMISSIONS: RoutePermission[] = [
  {
    route: "/products",
    code: "PRODUCTS",
    name: "Lista de productos",
    component: <Products />,
    nodes: [
      { route: "/products/add", code: "PRODUCTS.ADD", name: "Agregar producto", group: "PRODUCTOS", component: <AddProduct key="add" /> },
      { route: "/products/edit/:id", code: "PRODUCTS.EDIT", name: "Editar producto", group: "PRODUCTOS", component: <AddProduct key="edit" />, showInSidebar: false },
      { route: "/products/view/:id", code: "PRODUCTS.VIEW", name: "Ver producto", group: "PRODUCTOS", component: <AddProduct key="view" viewOnly />, showInSidebar: false },
      { route: "/products/categories", code: "PRODUCTS.CATEGORIES", name: "Categorías", group: "PRODUCTOS", component: <Categories /> },
      { route: "/products/costs", code: "PRODUCTS.COSTS", name: "Costos", group: "PRODUCTOS", component: <ProductCosts /> },
      { route: "/products/attributes", code: "PRODUCTS.ATTRIBUTES", name: "Atributos", group: "PRODUCTOS", component: <Attributes /> },
      { route: "/inventory", code: "INVENTORY", name: "Inventario", group: "INVENTARIO", component: <Inventory /> },
      { route: "/inventory/movements", code: "INVENTORY.MOVEMENTS", name: "Movimientos", group: "INVENTARIO", component: <InventoryMovements /> },
      { route: "/inventory/movements/create", code: "INVENTORY.MOVEMENTS.CREATE", name: "Crear movimiento", group: "INVENTARIO", component: <CreateMovement /> },
      { route: "/bar-codes", code: "BARCODES", name: "Códigos de barra", group: "INVENTARIO", component: <BarcodesPage /> },
      { route: "/inventory/movement-requests", code: "INVENTORY.MOVEMENT.REQUESTS", name: "Solicitudes de movimiento", group: "INVENTARIO", component: <MovementRequests /> },
      { route: "/inventory/movement-requests/create", code: "INVENTORY.MOVEMENT.REQUESTS.CREATE", name: "Crear solicitud", group: "INVENTARIO", component: <CreateMovementRequest /> },
      { route: "/inventory/movement-requests/edit/:id", code: "INVENTORY.MOVEMENT.REQUESTS.EDIT", name: "Editar solicitud", group: "INVENTARIO", component: <EditMovementRequest />, showInSidebar: false },
      { route: "/inventory/movement-requests/send", code: "INVENTORY.MOVEMENT.REQUESTS.SEND", name: "Enviar solicitud", group: "INVENTARIO", component: <CreateSendMovement /> },
    ],
  },
  {
    route: "/customers",
    code: "CUSTOMERS",
    name: "Clientes",
    component: <Navigate to="/customers/list" replace />,
    nodes: [
      { route: "/customers/list", code: "CUSTOMERS.LIST", name: "Listado de clientes", group: "CLIENTES", component: <AccountsList /> },
      //{ route: "/customers/create", code: "CUSTOMERS.CREATE", name: "Crear cliente", group: "CLIENTES" }, // No va -Kevin
      //{ route: "/customers/edit/:id", code: "CUSTOMERS.EDIT", name: "Editar cliente", group: "CLIENTES" },
      { route: "/customers/points", code: "CUSTOMERS.POINTS", name: "Puntos", group: "CLIENTES", component: <CustomerPoints /> },
      { route: "/customers/points/movements", code: "CUSTOMERS.POINTS.MOVEMENTS", name: "Movimientos de puntos", group: "CLIENTES", component: <CustomerPointsMovements /> },
    ],
  },
  {
    route: "/sales",
    code: "VENTAS",
    name: "Ventas",
    component: <Navigate to="/sales" replace />,
    nodes: [
      //VENTAS
      { route: "/sales", code: "SALES", name: "Lista de ventas", group: "VENTAS", component: <Sales /> },
      { route: "/sales/products/franchise", code: "SALES.PRODUCTS.FRANCHISE", name: "Productos de franquicia", group: "VENTAS", component: <FranchiseProducts /> },
      { route: "/sales/create", code: "SALES.CREATE", name: "Crear venta", group: "VENTAS", component: <CreateSale /> },
      { route: "/sales/edit/:id", code: "SALES.EDIT", name: "Editar venta", group: "VENTAS", component: <CreateSale />, showInSidebar: false },
      { route: "/shipping", code: "SALES.SHIPPING", name: "Envíos", group: "VENTAS", component: <Shipping /> },
      { route: "/shipping/create", code: "SALES.SHIPPING.CREATE", name: "Crear envío", group: "VENTAS", component: <CreateShipping /> },
      { route: "/shipping/edit/:id", code: "SALES.SHIPPING.EDIT", name: "Editar envío", group: "VENTAS", component: <CreateShipping />, showInSidebar: false },
      { route: "/pos", code: "POS", name: "Punto de venta", group: "VENTAS", component: <POSList /> },
      { route: "/pos/open", code: "SALES.POS.OPEN", name: "Abrir caja POS", group: "VENTAS", component: <SalesPOS /> },
      { route: "/settings/order-channel-types", code: "SETTINGS.ORDER.CHANNEL.TYPES", name: "Tipos de canal de venta", group: "VENTAS", component: <OrderChannelTypesList /> },
      { route: "/settings/order-channel-types/create", code: "SETTINGS.ORDER.CHANNEL.TYPES.CREATE", name: "Crear tipo de canal", group: "VENTAS", component: <CreateOrderChannelType /> },
      { route: "/settings/order-channel-types/edit/:id", code: "SETTINGS.ORDER.CHANNEL.TYPES.EDIT", name: "Editar tipo de canal", group: "VENTAS", component: <CreateOrderChannelType />, showInSidebar: false },
      //CAMBIOS/RETORNOS
      { route: "/returns", code: "RETURNS", name: "Lista cambios/retornos", group: "CAMBIOS/RETORNOS", component: <Returns /> },
      { route: "/returns/add", code: "RETURNS.ADD", name: "Agregar devolución", group: "CAMBIOS/RETORNOS", component: <CreateReturn /> },
      { route: "/returns/edit/:id", code: "RETURNS.EDIT", name: "Editar devolución", group: "CAMBIOS/RETORNOS", component: <EditReturn />, showInSidebar: false },
      // DESCUENTOS
      { route: "/discounts/price-rules", code: "DISCOUNTS.PRICE.RULES", name: "Reglas de precio", group: "DESCUENTOS", component: <PriceRulesPage /> },
      { route: "/discounts/price-rules/create", code: "DISCOUNTS.PRICE.RULES.CREATE", name: "Crear regla de precio", group: "DESCUENTOS", component: <PriceRuleFormPage /> },
      { route: "/discounts/price-rules/edit/:id", code: "DISCOUNTS.PRICE.RULES.EDIT", name: "Editar regla de precio", group: "DESCUENTOS", component: <PriceRuleFormPage />, showInSidebar: false },
      { route: "/discounts/birthday-notification", code: "DISCOUNTS.BIRTHDAY.NOTIFICATION", name: "Cumpleaños clientes", group: "DESCUENTOS", component: <BirthdayNotification /> },
    ],
  },
  {
    route: "/movimientos",
    code: "MOVIMIENTOS",
    name: "Movimientos",
    component: <Navigate to="/movements" replace />,
    nodes: [
      //MOVIMIENTOS
      { route: "/movements", code: "MOVEMENTS", name: "Lista de movimientos", group: "MOVIMIENTOS", component: <MovementsPage /> },
      { route: "/movements/add/expenses", code: "MOVEMENTS.ADD.EXPENSE", name: "Agregar egreso", group: "MOVIMIENTOS", component: <AddMovementPage movementType="expense" /> },
      { route: "/movements/add/income", code: "MOVEMENTS.ADD.INCOME", name: "Agregar ingreso", group: "MOVIMIENTOS", component: <AddMovementPage movementType="income" /> },
    ],
  },
  {
    route: "/facturacion",
    code: "FACTURACION",
    name: "Facturación",
    component: <Navigate to="/invoices" replace />,
    nodes: [
      //FACTURACIÓN
      { route: "/invoices", code: "INVOICES", name: "Lista de comprobantes", group: "FACTURACIÓN", component: <Invoices /> },
      { route: "/invoices/add", code: "INVOICES.ADD", name: "Crear comprobante", group: "FACTURACIÓN", component: <CreateInvoice /> },
      { route: "/invoices/edit/:invoiceId", code: "INVOICES.EDIT", name: "Editar factura", group: "FACTURACIÓN", component: <CreateInvoice />, showInSidebar: false },
      { route: "/invoices/view/:invoiceId", code: "INVOICES.VIEW", name: "Ver factura", group: "FACTURACIÓN", component: <CreateInvoice viewOnly />, showInSidebar: false },
      { route: "/invoices/series", code: "INVOICES.SERIES", name: "Series", group: "FACTURACIÓN", component: <InvoiceSeriesPage /> },
      { route: "/invoices/series/add", code: "INVOICES.SERIES.ADD", name: "Agregar serie", group: "FACTURACIÓN", component: <InvoiceSeriesFormPage /> },
      { route: "/invoices/series/edit/:serieId", code: "INVOICES.SERIES.EDIT", name: "Editar serie", group: "FACTURACIÓN", component: <InvoiceSeriesFormPage />, showInSidebar: false },
    ],
  },
  {
    route: "/reportes",
    code: "REPORTES",
    name: "Reportes",
    component: <Navigate to="/reports/sales" replace />,
    nodes: [
      //REPORTES
      { route: "/reports/sales", code: "REPORTS.SALES", name: "Ventas", group: "REPORTES", component: <ReportsSalesPage /> },
      { route: "/reports/products", code: "REPORTS.PRODUCTS", name: "Productos más vendidos", group: "REPORTES", component: <ReportsProductsPage /> },
      { route: "/reports/stock", code: "REPORTS.STOCK", name: "Stock", group: "REPORTES", component: <ReportsStockPage /> },
      { route: "/reports/returns", code: "REPORTS.RETURNS", name: "Devoluciones", group: "REPORTES", component: <ReportsReturnsPage /> },
      { route: "/reports/movements", code: "REPORTS.MOVEMENTS", name: "Movimientos", group: "REPORTES", component: <ReportsMovementsPage /> },
      { route: "/reports/clients", code: "REPORTS.CLIENTS", name: "Clientes", group: "REPORTES", component: <ReportsClientsPage /> },
      { route: "/reports/price-rules", code: "REPORTS.PRICE.RULES", name: "Reglas de precio", group: "REPORTES", component: <PriceRulesReportPage /> },
    ],
  },

  {
    route: "/configuracion",
    code: "CONFIGURACION",
    name: "Configuración",
    component: <Navigate to="/settings/stock-types" replace />,
    nodes: [
      //CONFIGURACIÓN
      { route: "/settings/stock-types", code: "SETTINGS.STOCK.TYPES", name: "Tipos de stock", group: "CONFIGURACIÓN", component: <StockTypePage /> },
      { route: "/settings/price-list", code: "SETTINGS.PRICE.LIST", name: "Lista de precios", group: "CONFIGURACIÓN", component: <PriceListPage /> },
      { route: "/settings/payment-methods", code: "SETTINGS.PAYMENT.METHODS", name: "Métodos de pago", group: "CONFIGURACIÓN", component: <PaymentMethodsList /> },
      { route: "/settings/business-accounts", code: "SETTINGS.BUSINESS.ACCOUNTS", name: "Cuentas del negocio", group: "CONFIGURACIÓN", component: <BusinessAccountPage /> },
      { route: "/settings/warehouses", code: "SETTINGS.WAREHOUSES", name: "Almacenes", group: "CONFIGURACIÓN", component: <WarehousesList /> },
      { route: "/settings/warehouses/create", code: "SETTINGS.WAREHOUSES.CREATE", name: "Crear almacén", group: "CONFIGURACIÓN", component: <CreateWarehouses /> },
      { route: "/settings/warehouses/edit/:id", code: "SETTINGS.WAREHOUSES.EDIT", name: "Editar almacén", group: "CONFIGURACIÓN", component: <CreateWarehouses />, showInSidebar: false },
      { route: "/settings/branches", code: "SETTINGS.BRANCHES", name: "Sucursales", group: "CONFIGURACIÓN", component: <BranchesList /> },
      { route: "/settings/branches/create", code: "SETTINGS.BRANCHES.CREATE", name: "Crear sucursal", group: "CONFIGURACIÓN", component: <CreateBranch /> },
      { route: "/settings/branches/edit/:id", code: "SETTINGS.BRANCHES.EDIT", name: "Editar sucursal", group: "CONFIGURACIÓN", component: <CreateBranch />, showInSidebar: false },
      //USUARIOS
      { route: "/settings/users", code: "SETTINGS.USERS", name: "Usuarios", group: "USUARIOS", component: <UsersList /> },
      { route: "/settings/users/create", code: "SETTINGS.USERS.CREATE", name: "Crear usuario", group: "USUARIOS", component: <CreateUser /> },
      //{ route: "/settings/users/functions", code: "SETTINGS.USERS.FUNCTIONS", name: "Funciones de usuario" }, //No hay nada que mostrar
      //ROLES
      { route: "/settings/roles", code: "SETTINGS.ROLES", name: "Roles", group: "ROLES", component: <RolesList /> },
      { route: "/settings/roles/create", code: "SETTINGS.ROLES.CREATE", name: "Crear rol", group: "ROLES", component: <CreateRole /> },
      { route: "/settings/roles/edit/:id", code: "SETTINGS.ROLES.EDIT", name: "Editar rol", group: "ROLES", component: <CreateRole />, showInSidebar: false },
      //{ route: "/settings/movement-classes", code: "SETTINGS.MOVEMENT.CLASSES", name: "Clases de movimiento" }, //No va -Kevin
    ],
  },

  {
    route: "/ecommerce",
    code: "ECOMMERCE",
    name: "Ecommerce",
    component: <Navigate to="/ecommerce/medios" replace />,
    nodes: [
      //ECOMMERCE
      { route: "/ecommerce/medios", code: "ECOMMERCE.MEDIA", name: "Galería de medios", group: "ECOMMERCE", component: <MediaGalleryPage /> },
      { route: "/ecommerce/edit", code: "ECOMMERCE.EDIT", name: "Editar tienda", group: "ECOMMERCE", component: <MassiveEditPage /> },
      { route: "/ecommerce/reclamaciones", code: "ECOMMERCE.COMPLAINTS", name: "Reclamaciones", group: "ECOMMERCE", component: <ReclamacionesPage /> },
      { route: "/ecommerce/reclamaciones/view/:id", code: "ECOMMERCE.COMPLAINTS.VIEW", name: "Ver reclamación", group: "ECOMMERCE", component: <ReclamacionViewPage />, showInSidebar: false },
    ],
  },
];
