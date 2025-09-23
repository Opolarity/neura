-- First, let's fix the capabilities table and insert the missing ones
INSERT INTO public.capabilities (id, name, code) VALUES 
(1, 'Dashboard', 'dashboard'),
(2, 'Gestión de Productos', 'products'),
(3, 'Gestión de Inventario', 'inventory'),
(4, 'Gestión de Ventas', 'sales'),
(5, 'Facturación', 'invoicing'),
(6, 'Punto de Venta', 'pos'),
(7, 'Gestión de Clientes', 'customers'),
(8, 'Reportes', 'reports'),
(9, 'Administración', 'administration'),
(10, 'Gestión de Usuarios', 'user_management'),
(11, 'Gestión de Roles', 'role_management')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code;

-- Update existing functions with proper capability_id and add missing data
UPDATE public.functions SET 
  capability_id = 2, 
  code = 'products', 
  icon = 'Tag', 
  location = '/products' 
WHERE id = 1;

UPDATE public.functions SET 
  capability_id = 2, 
  code = 'products_list', 
  icon = NULL, 
  location = '/products' 
WHERE id = 2;

-- Insert missing main menu functions
INSERT INTO public.functions (id, capability_id, parent_function, name, code, icon, location) VALUES 
(3, 1, NULL, 'Dashboard', 'dashboard', 'Grid', '/'),
(4, 3, NULL, 'Inventario', 'inventory', 'Archive', '/inventory'),
(5, 4, NULL, 'Ventas', 'sales', 'ShoppingCart', '/sales'),
(6, 5, NULL, 'Facturación', 'invoices', 'FileText', '/invoices'),
(7, 6, NULL, 'Punto de Venta', 'pos', 'Store', '/pos'),
(8, 7, NULL, 'Clientes', 'customers', 'Users', '/customers'),
(9, 8, NULL, 'Reportes', 'reports', 'Calendar', '/reports'),
(10, 9, NULL, 'Configuración', 'settings', 'Settings', '/settings')
ON CONFLICT (id) DO NOTHING;

-- Insert settings sub-menu functions (parent functions)
INSERT INTO public.functions (id, capability_id, parent_function, name, code, icon, location) VALUES 
(11, 10, 10, 'Usuarios', 'users_section', NULL, NULL),
(12, 11, 10, 'Roles', 'roles_section', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert user management sub-functions
INSERT INTO public.functions (id, capability_id, parent_function, name, code, icon, location) VALUES 
(13, 10, 11, 'Listado de usuarios', 'users_list', NULL, '/settings/users'),
(14, 10, 11, 'Crear usuario', 'users_create', NULL, '/settings/users/create'),
(15, 10, 11, 'Funciones por usuario', 'users_functions', NULL, '/settings/users/functions')
ON CONFLICT (id) DO NOTHING;

-- Insert role management sub-functions
INSERT INTO public.functions (id, capability_id, parent_function, name, code, icon, location) VALUES 
(16, 11, 12, 'Listado de roles', 'roles_list', NULL, '/settings/roles'),
(17, 11, 12, 'Crear rol', 'roles_create', NULL, '/settings/roles/create')
ON CONFLICT (id) DO NOTHING;

-- Update sequences to ensure they're at the right values
SELECT setval('public.capabilities_id_seq', (SELECT COALESCE(MAX(id), 0) FROM public.capabilities), true);
SELECT setval('public.functions_id_seq', (SELECT COALESCE(MAX(id), 0) FROM public.functions), true);