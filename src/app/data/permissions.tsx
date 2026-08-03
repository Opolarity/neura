import type { ReactNode } from "react";
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
import {
  LayoutGrid,
  Tag,
  ShoppingCart,
  ArrowUpDown,
  FileText,
  Calendar,
  Settings,
  Contact,
  type LucideIcon,
} from "lucide-react";

interface ComponentPermission {
  code: string;
  name: string;
}
interface WithNode<T> extends ComponentPermission {
  node: T[];
}
interface RoutePermission extends WithNode<ComponentPermission> {
  path: string;
  element: ReactNode;
}
interface SubModulePermission extends WithNode<RoutePermission> { }
interface ModulePermission extends WithNode<SubModulePermission> {
  icon: LucideIcon;
}

export const APP_PERMISSIONS_CONFIG = [
  {
    name: "Productos",
    icon: Tag,
    code: "products",
    node: [
      {
        code: "products.group", name: "Productos", node: [
          { name: "Lista de productos", path: "/products", code: "products.list", element: <Products />, node: [] },
          { name: "Crear producto", path: "/products/add", code: "products.create", element: <AddProduct key="add" />, node: [] },
          { name: "Editar producto", path: "/products/edit/:id", code: "products.edit", element: <AddProduct key="edit" />, node: [] },
          { name: "Ver producto", path: "/products/view/:id", code: "products.view", element: <AddProduct key="view" viewOnly />, node: [] },
          { name: "Categorías", path: "/products/categories", code: "product_categories.list", element: <Categories />, node: [] },
          { name: "Costos", path: "/products/costs", code: "product_costs.list", element: <ProductCosts />, node: [] },
          { name: "Atributos", path: "/products/attributes", code: "product_attributes.list", element: <Attributes />, node: [] },
        ]
      },

      {
        code: "inventory.group", name: "Inventario", node: [
          { name: "Lista de inventario", path: "/inventory", code: "inventory.list", element: <Inventory />, node: [] },
          { name: "Movimientos de inventario", path: "/inventory/movements", code: "inventory_movements.list", element: <InventoryMovements />, node: [] },
          { name: "Crear Movimiento", path: "/inventory/movements/create", code: "inventory_movements.create", element: <CreateMovement />, node: [] },
          { name: "Código de barras", path: "/bar-codes", code: "barcodes.list", element: <BarcodesPage />, node: [] },
          { name: "Solicitudes de movimiento", path: "/inventory/movement-requests", code: "inventory_movement_requests.list", element: <MovementRequests />, node: [] },
          { name: "Crear solicitud", path: "/inventory/movement-requests/create", code: "inventory_movement_requests.create", element: <CreateMovementRequest />, node: [] },
          { name: "Editar solicitud", path: "/inventory/movement-requests/edit/:id", code: "inventory_movement_requests.edit", element: <EditMovementRequest />, node: [] },
          { name: "Enviar solicitud", path: "/inventory/movement-requests/send", code: "inventory_movement_requests.send", element: <CreateSendMovement />, node: [] },
        ]
      },

    ],
  },
  {
    name: "Clientes",
    icon: Contact,
    code: "customers",
    node: [
      {
        code: "customers.group", name: "Clientes", node: [
          { name: "Lista de clientes", path: "/customers/list", code: "customers.list", element: <AccountsList />, node: [] },
          { name: "Puntajes de clientes", path: "/customers/points", code: "customer_points.list", element: <CustomerPoints />, node: [] },
          { name: "Movimientos de puntos", path: "/customers/points/movements", code: "customer_points_movements.list", element: <CustomerPointsMovements />, node: [] },
        ]
      },

    ],
  },
  {
    name: "Ventas",
    icon: ShoppingCart,
    code: "sales",
    node: [
      {
        code: "sales.group", name: "Ventas", node: [
          { name: "Lista de ventas", path: "/sales", code: "sales.list", element: <Sales />, node: [] },
          { name: "Ventas a franquicias", path: "/sales/products/franchise", code: "sales_franchise.list", element: <FranchiseProducts />, node: [] },
          { name: "Añadir venta", path: "/sales/create", code: "sales.create", element: <CreateSale />, node: [] },
          { name: "Editar venta", path: "/sales/edit/:id", code: "sales.edit", element: <CreateSale />, node: [] },
          { name: "Envíos", path: "/shipping", code: "shipments.list", element: <Shipping />, node: [] },
          { name: "Crear envío", path: "/shipping/create", code: "shipments.create", element: <CreateShipping />, node: [] },
          { name: "Editar envío", path: "/shipping/edit/:id", code: "shipments.edit", element: <CreateShipping />, node: [] },
          { name: "Sesiones de Caja", path: "/pos", code: "pos.list", element: <POSList />, node: [] },
          { name: "Punto de Venta", path: "/pos/open", code: "pos.open", element: <SalesPOS />, node: [] },
          { name: "Canales de venta", path: "/settings/order-channel-types", code: "sales_channels.list", element: <OrderChannelTypesList />, node: [] },
          { name: "Crear canal de venta", path: "/settings/order-channel-types/create", code: "sales_channels.create", element: <CreateOrderChannelType />, node: [] },
          { name: "Editar canal de venta", path: "/settings/order-channel-types/edit/:id", code: "sales_channels.edit", element: <CreateOrderChannelType />, node: [] },
        ]
      },

  {
    code: "changes_returns.group", name: "Cambios/Retornos", node: [
      { name: "Lista cambios/retornos", path: "/returns", code: "returns.list", element: <Returns />, node: [] },
      { name: "Añadir cambio/retorno", path: "/returns/add", code: "returns.create", element: <CreateReturn />, node: [] },
      { name: "Añadir cambio/retorno", path: "/returns/edit/:id", code: "returns.edit", element: <EditReturn />, node: [] },
    ]
  },

  {
    code: "discounts.group", name: "Descuentos", node: [
      { name: "Reglas de precios", path: "/discounts/price-rules", code: "price_rules.list", element: <PriceRulesPage />, node: [] },
      { name: "Crear regla de precio", path: "/discounts/price-rules/create", code: "price_rules.create", element: <PriceRuleFormPage />, node: [] },
      { name: "Editar regla de precio", path: "/discounts/price-rules/edit/:id", code: "price_rules.edit", element: <PriceRuleFormPage />, node: [] },
      { name: "Cumpleaños clientes", path: "/discounts/birthday-notification", code: "birthday_notifications.list", element: <BirthdayNotification />, node: [] },
    ]
  },

],
  },
{
  name: "Movimientos",
    icon: ArrowUpDown,
      code: "movements",
        node: [
          {
            code: "movements.group", name: "Movimientos", node: [
              { name: "Lista de movimientos", path: "/movements", code: "movements.list", element: <MovementsPage />, node: [] },
              { name: "Añadir gasto", path: "/movements/add/expenses", code: "movements_expenses.create", element: <AddMovementPage movementType="expense" />, node: [] },
              { name: "Añadir Ingreso", path: "/movements/add/income", code: "movements_income.create", element: <AddMovementPage movementType="income" />, node: [] },
            ]
          },
        ],
  },
{
  name: "Facturación",
    icon: FileText,
      code: "invoices",
        node: [
          {
            code: "invoices.group", name: "Facturación", node: [
              { name: "Lista de comprobantes", path: "/invoices", code: "invoices.list", element: <Invoices />, node: [] },
              { name: "Crear comprobante", path: "/invoices/add", code: "invoices.create", element: <CreateInvoice />, node: [] },
              { name: "Editar comprobante", path: "/invoices/edit/:invoiceId", code: "invoices.edit", element: <CreateInvoice />, node: [] },
              { name: "Ver comprobante", path: "/invoices/view/:invoiceId", code: "invoices.view", element: <CreateInvoice viewOnly />, node: [] },
              { name: "Series", path: "/invoices/series", code: "invoice_series.list", element: <InvoiceSeriesPage />, node: [] },
              { name: "Crear serie", path: "/invoices/series/add", code: "invoice_series.create", element: <InvoiceSeriesFormPage />, node: [] },
              { name: "Editar serie", path: "/invoices/series/edit/:serieId", code: "invoice_series.edit", element: <InvoiceSeriesFormPage />, node: [] },
            ]
          },
        ],
  },
{
  name: "Reportes",
    icon: Calendar,
      code: "reports",
        node: [
          {
            code: "reports.group", name: "Reportes", node: [
              { name: "Ventas", path: "/reports/sales", code: "reports_sales.view", element: <ReportsSalesPage />, node: [] },
              { name: "Productos", path: "/reports/products", code: "reports_products.view", element: <ReportsProductsPage />, node: [] },
              { name: "Inventario", path: "/reports/stock", code: "reports_stock.view", element: <ReportsStockPage />, node: [] },
              { name: "Cambios/Retornos", path: "/reports/returns", code: "reports_returns.view", element: <ReportsReturnsPage />, node: [] },
              { name: "Financiero", path: "/reports/movements", code: "reports_movements.view", element: <ReportsMovementsPage />, node: [] },
              { name: "Clientes", path: "/reports/clients", code: "reports_clients.view", element:  <ReportsClientsPage />, node: [] },
              { name: "Regla de Precios", path: "/reports/price-rules", code: "reports_price_rules.view", element: <PriceRulesReportPage />, node: [] },
            ]
          },
        ],
  },
{
  name: "Configuración",
    icon: Settings,
      code: "settings",
        node: [
          {
            code: "settings.group", name: "Configuración", node: [
              { name: "Tipos de inventario", path: "/settings/stock-types", code: "stock_types.list", element: <StockTypePage />, node: [] },
              { name: "Precios", path: "/settings/price-list", code: "price_lists.list", element: <PriceListPage />, node: [] },
              { name: "Métodos de pago", path: "/settings/payment-methods", code: "payment_methods.list", element: <PaymentMethodsList />, node: [] },
              { name: "Cuentas bancarias", path: "/settings/business-accounts", code: "business_accounts.list", element: <BusinessAccountPage />, node: [] },
              { name: "Almacenes", path: "/settings/warehouses", code: "warehouses.list", element: <WarehousesList />, node: [] },
              { name: "Crear almacén", path: "/settings/warehouses/create", code: "warehouses.create", element: <CreateWarehouses />, node: [] },
              { name: "Editar almacén", path: "/settings/warehouses/edit/:id", code: "warehouses.edit", element: <CreateWarehouses />, node: [] },
              { name: "Sucursales", path: "/settings/branches", code: "branches.list", element: <BranchesList />, node: [] },
              { name: "Crear sucursal", path: "/settings/branches/create", code: "branches.create", element: <CreateBranch />, node: [] },
              { name: "Editar sucursal", path: "/settings/branches/edit/:id", code: "branches.edit", element: <CreateBranch />, node: [] },
            ]
          },
          {
            code: "users.group", name: "Usuarios", node: [
              { name: "Lista de usuarios", path: "/settings/users", code: "users.list", element: <UsersList /> , node: [] },
              { name: "Crear usuario", path: "/settings/users/create", code: "users.create", element: <CreateUser />, node: [] },
              { name: "Editar usuario", path: "/settings/users/edit/:uid", code: "users.edit", element: <CreateUser />, node: [] },
            ]
          },
          {
            code: "roles.group", name: "Roles", node: [
              { name: "Lista de roles", path: "/settings/roles", code: "roles.list", element: <RolesList />, node: [] },
              { name: "Crear rol", path: "/settings/roles/create", code: "roles.create", element: <CreateRole />, node: [] },
              { name: "Editar rol", path: "/settings/roles/edit/:id", code: "roles.edit", element: <CreateRole />, node: [] },
            ]
          },

        ],
  },
{
  name: "Ecommerce",
    icon: LayoutGrid,
      code: "ecommerce",
        node: [
          {
            code: "ecommerce.group", name: "Ecommerce", node: [
              { name: "Galería de medios", path: "/ecommerce/medios", code: "ecommerce_media.list", element: <MediaGalleryPage />, node: [] },
              { name: "Edición masiva", path: "/ecommerce/edit", code: "ecommerce_bulk_edit.view", element: <MassiveEditPage />, node: [] },
              { name: "Reclamaciones", path: "/ecommerce/reclamaciones", code: "ecommerce_claims.list", element: <ReclamacionesPage />, node: [] },
              { name: "Ver reclamación", path: "/ecommerce/reclamaciones/view/:id", code: "ecommerce_claims.view", element: <ReclamacionViewPage />, node: [] },
            ]
          },

        ],
  },
] as const satisfies ModulePermission[];

//#region TYPED FOR CAPABILITIES
export type LeafPermissionCode =
  (typeof APP_PERMISSIONS_CONFIG)[number]["node"][number]["node"][number]["node"][number]["code"];
//#endregion

//#region DATA ADAPTERS
export function getRoutes(modules: ModulePermission[]): Pick<RoutePermission, "code" | "path" | "element">[] {
  return modules.flatMap((module) =>
    module.node.flatMap((subModule) =>
      subModule.node.map(({ code, path, element }) => ({ code, path, element }))
    )
  );
}

export function getSidebar(modules: ModulePermission[]) {
  return modules.map(({ code, name, icon, node }) => ({
    code,
    name,
    icon,
    node: node.flatMap((subModule) => [
      { code: subModule.code, name: subModule.name },
      ...subModule.node
        .filter((route) => !route.path.includes(":"))
        .map(({ code, name, path }) => ({ code, name, path })),
    ]),
  }));
}

export function getFilterSidebar(modules: ModulePermission[], codes: string[]) {
  return modules
    .map(({ code, name, icon, node }) => ({
      code,
      name,
      icon,
      node: node.flatMap((subModule) => {
        const routes = subModule.node
          .filter((route) => !route.path.includes(":"))
          .filter((route) => codes.includes(route.code))
          .map(({ code, name, path }) => ({ code, name, path }));

        return routes.length > 0
          ? [{ code: subModule.code, name: subModule.name }, ...routes]
          : [];
      }),
    }))
    .filter((module) => module.node.length > 0);
}

export function getPermissions(modules: ModulePermission[]): WithNode<Pick<RoutePermission, "code" | "name">>[] {
  return modules
    .map(({ code, name, node }) => ({
      code,
      name,
      node: node.flatMap((subModule) =>
        subModule.node.map(({ code, name }) => ({ code, name }))
      ),
    }))
    .filter((module) => module.node.length > 0);
}

export function getComponents(modules: ModulePermission[]): WithNode<ComponentPermission>[] {
  return modules
    .map((module) => ({
      code: module.code,
      name: module.name,
      node: module.node.flatMap((subModule) =>
        subModule.node.flatMap((route) => route.node)
      ),
    }))
    .filter((module) => module.node.length > 0);
}
//#endregion