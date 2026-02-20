
# Plan: Crear usuario con Stored Procedure

## Resumen

Mover toda la logica de insercion de datos (accounts, profiles, account_types, user_roles) a un stored procedure `sp_create_user_profile`. Esto garantiza transaccionalidad nativa: si algo falla, PostgreSQL hace rollback automatico sin dejar datos huerfanos.

La edge function solo se encargara de:
1. Validar campos
2. Crear el usuario en Auth (esto no puede hacerse en SQL)
3. Llamar al SP con los datos
4. Si el SP falla, eliminar el usuario de Auth

## Cambios

### 1. Migracion SQL: Crear `sp_create_user_profile`

Crear un stored procedure que reciba todos los parametros y ejecute las inserciones dentro de una transaccion implicita:

- Verificar que no exista un account con el mismo documento
- Insertar en `accounts` y obtener el ID generado
- Insertar en `profiles` vinculando el UID de auth con el account_id
- Insertar en `account_types` (multiples registros segun type_ids)
- Insertar en `user_roles` (multiples registros segun role_ids)
- Retornar el account_id y profile creado

Si cualquier paso falla, PostgreSQL revierte todo automaticamente.

### 2. Limpiar datos huerfanos existentes

Ejecutar DELETE de las cuentas huerfanas (IDs 51, 52, 53) que quedaron de pruebas fallidas anteriores, dentro de la misma migracion.

### 3. Actualizar edge function `create-users/index.ts`

Simplificar la funcion para:
- Validar campos requeridos
- Crear usuario en Auth (admin API)
- Llamar `supabase.rpc('sp_create_user_profile', {...})` con todos los datos
- Si el RPC falla, eliminar el usuario de Auth como rollback
- Retornar respuesta exitosa

### 4. Registrar en `config.toml`

Agregar la entrada:
```
[functions.create-users]
verify_jwt = false
```

## Detalle tecnico del Stored Procedure

```sql
CREATE OR REPLACE FUNCTION sp_create_user_profile(
  p_uid UUID,
  p_name VARCHAR,
  p_middle_name VARCHAR DEFAULT NULL,
  p_last_name VARCHAR DEFAULT NULL,
  p_last_name2 VARCHAR DEFAULT NULL,
  p_document_type_id BIGINT,
  p_document_number VARCHAR,
  p_show BOOLEAN DEFAULT TRUE,
  p_country_id BIGINT DEFAULT NULL,
  p_state_id BIGINT DEFAULT NULL,
  p_city_id BIGINT DEFAULT NULL,
  p_neighborhood_id BIGINT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_address_reference TEXT DEFAULT NULL,
  p_warehouse_id BIGINT,
  p_branch_id BIGINT,
  p_type_ids BIGINT[],
  p_role_ids BIGINT[] DEFAULT '{}'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_account_id BIGINT;
  v_existing RECORD;
BEGIN
  -- Check duplicates
  SELECT id INTO v_existing FROM accounts
  WHERE document_number = p_document_number
    AND document_type_id = p_document_type_id;

  IF FOUND THEN
    RAISE EXCEPTION 'User already exists with this document';
  END IF;

  -- Insert account
  INSERT INTO accounts (name, middle_name, last_name, last_name2,
    document_type_id, document_number, is_active, show)
  VALUES (p_name, p_middle_name, p_last_name, p_last_name2,
    p_document_type_id, p_document_number, TRUE, p_show)
  RETURNING id INTO v_account_id;

  -- Insert profile
  INSERT INTO profiles ("UID", account_id, country_id, state_id,
    city_id, neighborhood_id, address, address_reference,
    warehouse_id, branch_id, is_active)
  VALUES (p_uid, v_account_id, p_country_id, p_state_id,
    p_city_id, p_neighborhood_id, p_address, p_address_reference,
    p_warehouse_id, p_branch_id, TRUE);

  -- Insert account types
  INSERT INTO account_types (account_id, account_type_id)
  SELECT v_account_id, UNNEST(p_type_ids);

  -- Insert user roles
  IF array_length(p_role_ids, 1) > 0 THEN
    INSERT INTO user_roles (user_id, role_id)
    SELECT p_uid, UNNEST(p_role_ids);
  END IF;

  RETURN json_build_object(
    'account_id', v_account_id,
    'auth_uid', p_uid
  );
END;
$$;
```

### Ventajas de este enfoque

- **Rollback automatico**: Si falla cualquier INSERT, todo se revierte sin codigo adicional
- **Consistencia**: Sigue el patron de `sp_close_pos_session` y la directiva del proyecto
- **Edge function simple**: Solo maneja Auth (que no puede hacerse en SQL) y delega el resto al SP
- **Sin datos huerfanos**: Imposible que queden registros parciales en la base de datos
