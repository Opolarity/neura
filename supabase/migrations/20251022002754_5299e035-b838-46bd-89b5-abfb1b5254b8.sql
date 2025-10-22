-- Insertar las subopciones del menú de Clientes
-- Primero, insertamos "Listado de clientes"
INSERT INTO functions (name, code, location, icon, active, capability_id, parent_function)
VALUES (
  'Listado de clientes',
  'customers_list',
  '/customers/list',
  'Users',
  true,
  1,
  (SELECT id FROM functions WHERE code = 'customers' LIMIT 1)
);

-- Luego, insertamos "Añadir cliente"
INSERT INTO functions (name, code, location, icon, active, capability_id, parent_function)
VALUES (
  'Añadir cliente',
  'customers_create',
  '/customers/create',
  'UserPlus',
  true,
  1,
  (SELECT id FROM functions WHERE code = 'customers' LIMIT 1)
);