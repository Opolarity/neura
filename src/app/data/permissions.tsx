import type { ReactNode } from "react";
import Products from "@/modules/products/pages/ProductsPage";
import AddProduct from "@/modules/products/pages/AddProduct";
import ProductCosts from "@/modules/products/pages/ProductCostsPage";
import Categories from "@/modules/products/pages/CategoriesPage";
import Attributes from "@/modules/products/pages/AttributesPage";
import TagsPage from "@/modules/products/pages/TagsPage";
import BrandsPage from "@/modules/products/pages/BrandsPage";

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
import BusinessParametersPage from "@/modules/settings/pages/BusinessParametersPage";
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
  // Obligatorio: decide si la ruta aparece en el sidebar. Antes se deducía del
  // path (las que tenían `:` no se mostraban), ahora es explícito.
  showSidebar: boolean;
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
          { name: "Lista de productos", path: "/products", code: "products.list", element: <Products />, showSidebar: true, node: [] },
          { name: "Crear producto", path: "/products/add", code: "products.create", element: <AddProduct key="add" />, showSidebar: true, node: [] },
          { name: "Editar producto", path: "/products/edit/:id", code: "products.edit", element: <AddProduct key="edit" />, showSidebar: false, node: [] },
          { name: "Ver producto", path: "/products/view/:id", code: "products.view", element: <AddProduct key="view" viewOnly />, showSidebar: false, node: [] },
          { name: "Categorías", path: "/products/categories", code: "product_categories.list", element: <Categories />, showSidebar: true, node: [] },
          { name: "Costos", path: "/products/costs", code: "product_costs.list", element: <ProductCosts />, showSidebar: true, node: [] },
          { name: "Etiquetas", path: "/products/tags", code: "product_tags.list", element: <TagsPage />, showSidebar: true, node: [] },
          { name: "Marcas", path: "/products/brands", code: "product_brands.list", element: <BrandsPage />, showSidebar: true, node: [] },
          { name: "Atributos", path: "/products/attributes", code: "product_attributes.list", element: <Attributes />, showSidebar: true, node: [] },
        ]
      },

      {
        code: "inventory.group", name: "Inventario", node: [
          { name: "Lista de inventario", path: "/inventory", code: "inventory.list", element: <Inventory />, showSidebar: true, node: [] },
          { name: "Movimientos de inventario", path: "/inventory/movements", code: "inventory_movements.list", element: <InventoryMovements />, showSidebar: true, node: [] },
          { name: "Crear Movimiento", path: "/inventory/movements/create", code: "inventory_movements.create", element: <CreateMovement />, showSidebar: true, node: [] },
          { name: "Código de barras", path: "/bar-codes", code: "barcodes.list", element: <BarcodesPage />, showSidebar: true, node: [] },
          { name: "Solicitudes de movimiento", path: "/inventory/movement-requests", code: "inventory_movement_requests.list", element: <MovementRequests />, showSidebar: true, node: [] },
          { name: "Crear solicitud", path: "/inventory/movement-requests/create", code: "inventory_movement_requests.create", element: <CreateMovementRequest />, showSidebar: false, node: [] },
          { name: "Editar solicitud", path: "/inventory/movement-requests/edit/:id", code: "inventory_movement_requests.edit", element: <EditMovementRequest />, showSidebar: false, node: [] },
          { name: "Enviar solicitud", path: "/inventory/movement-requests/send", code: "inventory_movement_requests.send", element: <CreateSendMovement />, showSidebar: false, node: [] },
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
          { name: "Lista de clientes", path: "/customers/list", code: "customers.list", element: <AccountsList />, showSidebar: true, node: [] },
          { name: "Puntajes de clientes", path: "/customers/points", code: "customer_points.list", element: <CustomerPoints />, showSidebar: true, node: [] },
          { name: "Movimientos de puntos", path: "/customers/points/movements", code: "customer_points_movements.list", element: <CustomerPointsMovements />, showSidebar: true, node: [] },
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
          { name: "Lista de ventas", path: "/sales", code: "sales.list", element: <Sales />, showSidebar: true, node: [] },
          { name: "Ventas a franquicias", path: "/sales/products/franchise", code: "sales_franchise.list", element: <FranchiseProducts />, showSidebar: true, node: [] },
          { name: "Añadir venta", path: "/sales/create", code: "sales.create", element: <CreateSale />, showSidebar: true, node: [] },
          { name: "Editar venta", path: "/sales/edit/:id", code: "sales.edit", element: <CreateSale />, showSidebar: false, node: [] },
          { name: "Envíos", path: "/shipping", code: "shipments.list", element: <Shipping />, showSidebar: true, node: [] },
          { name: "Crear envío", path: "/shipping/create", code: "shipments.create", element: <CreateShipping />, showSidebar: false, node: [] },
          { name: "Editar envío", path: "/shipping/edit/:id", code: "shipments.edit", element: <CreateShipping />, showSidebar: false, node: [] },
          { name: "Sesiones de Caja", path: "/pos", code: "pos.list", element: <POSList />, showSidebar: true, node: [] },
          { name: "Punto de Venta", path: "/pos/open", code: "pos.open", element: <SalesPOS />, showSidebar: false, node: [] },
          { name: "Canales de venta", path: "/settings/order-channel-types", code: "sales_channels.list", element: <OrderChannelTypesList />, showSidebar: true, node: [] },
          { name: "Crear canal de venta", path: "/settings/order-channel-types/create", code: "sales_channels.create", element: <CreateOrderChannelType />, showSidebar: false, node: [] },
          { name: "Editar canal de venta", path: "/settings/order-channel-types/edit/:id", code: "sales_channels.edit", element: <CreateOrderChannelType />, showSidebar: false, node: [] },
        ]
      },

  {
    code: "changes_returns.group", name: "Cambios/Retornos", node: [
      { name: "Lista cambios/retornos", path: "/returns", code: "returns.list", element: <Returns />, showSidebar: true, node: [] },
      { name: "Añadir cambio/retorno", path: "/returns/add", code: "returns.create", element: <CreateReturn />, showSidebar: true, node: [] },
      { name: "Añadir cambio/retorno", path: "/returns/edit/:id", code: "returns.edit", element: <EditReturn />, showSidebar: false, node: [] },
    ]
  },

  {
    code: "discounts.group", name: "Descuentos", node: [
      { name: "Reglas de precios", path: "/discounts/price-rules", code: "price_rules.list", element: <PriceRulesPage />, showSidebar: true, node: [] },
      { name: "Crear regla de precio", path: "/discounts/price-rules/create", code: "price_rules.create", element: <PriceRuleFormPage />, showSidebar: false, node: [] },
      { name: "Editar regla de precio", path: "/discounts/price-rules/edit/:id", code: "price_rules.edit", element: <PriceRuleFormPage />, showSidebar: false, node: [] },
      { name: "Cumpleaños clientes", path: "/discounts/birthday-notification", code: "birthday_notifications.list", element: <BirthdayNotification />, showSidebar: true, node: [] },
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
              { name: "Lista de movimientos", path: "/movements", code: "movements.list", element: <MovementsPage />, showSidebar: true, node: [] },
              { name: "Añadir gasto", path: "/movements/add/expenses", code: "movements_expenses.create", element: <AddMovementPage movementType="expense" />, showSidebar: true, node: [] },
              { name: "Añadir Ingreso", path: "/movements/add/income", code: "movements_income.create", element: <AddMovementPage movementType="income" />, showSidebar: true, node: [] },
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
              { name: "Lista de comprobantes", path: "/invoices", code: "invoices.list", element: <Invoices />, showSidebar: true, node: [] },
              { name: "Crear comprobante", path: "/invoices/add", code: "invoices.create", element: <CreateInvoice />, showSidebar: true, node: [] },
              { name: "Editar comprobante", path: "/invoices/edit/:invoiceId", code: "invoices.edit", element: <CreateInvoice />, showSidebar: false, node: [] },
              { name: "Ver comprobante", path: "/invoices/view/:invoiceId", code: "invoices.view", element: <CreateInvoice viewOnly />, showSidebar: false, node: [] },
              { name: "Series", path: "/invoices/series", code: "invoice_series.list", element: <InvoiceSeriesPage />, showSidebar: true, node: [] },
              { name: "Crear serie", path: "/invoices/series/add", code: "invoice_series.create", element: <InvoiceSeriesFormPage />, showSidebar: false, node: [] },
              { name: "Editar serie", path: "/invoices/series/edit/:serieId", code: "invoice_series.edit", element: <InvoiceSeriesFormPage />, showSidebar: false, node: [] },
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
              { name: "Ventas", path: "/reports/sales", code: "reports_sales.view", element: <ReportsSalesPage />, showSidebar: true, node: [] },
              { name: "Productos", path: "/reports/products", code: "reports_products.view", element: <ReportsProductsPage />, showSidebar: true, node: [] },
              { name: "Inventario", path: "/reports/stock", code: "reports_stock.view", element: <ReportsStockPage />, showSidebar: true, node: [] },
              { name: "Cambios/Retornos", path: "/reports/returns", code: "reports_returns.view", element: <ReportsReturnsPage />, showSidebar: true, node: [] },
              { name: "Financiero", path: "/reports/movements", code: "reports_movements.view", element: <ReportsMovementsPage />, showSidebar: true, node: [] },
              { name: "Clientes", path: "/reports/clients", code: "reports_clients.view", element:  <ReportsClientsPage />, showSidebar: true, node: [] },
              { name: "Regla de Precios", path: "/reports/price-rules", code: "reports_price_rules.view", element: <PriceRulesReportPage />, showSidebar: true, node: [] },
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
              { name: "Negocio", path: "/settings/business", code: "business_parameters.list", element: <BusinessParametersPage />, showSidebar: true, node: [] },
              { name: "Tipos de inventario", path: "/settings/stock-types", code: "stock_types.list", element: <StockTypePage />, showSidebar: true, node: [] },
              { name: "Precios", path: "/settings/price-list", code: "price_lists.list", element: <PriceListPage />, showSidebar: true, node: [] },
              { name: "Métodos de pago", path: "/settings/payment-methods", code: "payment_methods.list", element: <PaymentMethodsList />, showSidebar: true, node: [] },
              { name: "Cuentas bancarias", path: "/settings/business-accounts", code: "business_accounts.list", element: <BusinessAccountPage />, showSidebar: true, node: [] },
              { name: "Almacenes", path: "/settings/warehouses", code: "warehouses.list", element: <WarehousesList />, showSidebar: true, node: [] },
              { name: "Crear almacén", path: "/settings/warehouses/create", code: "warehouses.create", element: <CreateWarehouses />, showSidebar: false, node: [] },
              { name: "Editar almacén", path: "/settings/warehouses/edit/:id", code: "warehouses.edit", element: <CreateWarehouses />, showSidebar: false, node: [] },
              { name: "Sucursales", path: "/settings/branches", code: "branches.list", element: <BranchesList />, showSidebar: true, node: [] },
              { name: "Crear sucursal", path: "/settings/branches/create", code: "branches.create", element: <CreateBranch />, showSidebar: false, node: [] },
              { name: "Editar sucursal", path: "/settings/branches/edit/:id", code: "branches.edit", element: <CreateBranch />, showSidebar: false, node: [] },
            ]
          },
          {
            code: "users.group", name: "Usuarios", node: [
              { name: "Lista de usuarios", path: "/settings/users", code: "users.list", element: <UsersList /> , showSidebar: true, node: [] },
              { name: "Crear usuario", path: "/settings/users/create", code: "users.create", element: <CreateUser />, showSidebar: true, node: [] },
              { name: "Editar usuario", path: "/settings/users/edit/:uid", code: "users.edit", element: <CreateUser />, showSidebar: false, node: [] },
            ]
          },
          {
            code: "roles.group", name: "Roles", node: [
              { name: "Lista de roles", path: "/settings/roles", code: "roles.list", element: <RolesList />, showSidebar: true, node: [] },
              { name: "Crear rol", path: "/settings/roles/create", code: "roles.create", element: <CreateRole />, showSidebar: true, node: [] },
              { name: "Editar rol", path: "/settings/roles/edit/:id", code: "roles.edit", element: <CreateRole />, showSidebar: false, node: [] },
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
              { name: "Galería de medios", path: "/ecommerce/medios", code: "ecommerce_media.list", element: <MediaGalleryPage />, showSidebar: true, node: [] },
              { name: "Edición masiva", path: "/ecommerce/edit", code: "ecommerce_bulk_edit.view", element: <MassiveEditPage />, showSidebar: true, node: [] },
              { name: "Reclamaciones", path: "/ecommerce/reclamaciones", code: "ecommerce_claims.list", element: <ReclamacionesPage />, showSidebar: true, node: [] },
              { name: "Ver reclamación", path: "/ecommerce/reclamaciones/view/:id", code: "ecommerce_claims.view", element: <ReclamacionViewPage />, showSidebar: false, node: [] },
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
        .filter((route) => route.showSidebar)
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
          .filter((route) => route.showSidebar)
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
