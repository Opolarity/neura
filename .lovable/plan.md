

## Plan: Administradores ven todas las funciones del menu

### Problema actual
La funcion de base de datos `get_user_functions` solo devuelve las funciones que estan vinculadas al rol del usuario en la tabla `role_functions`. Esto significa que incluso los administradores solo ven las funciones que se les asignaron manualmente.

### Solucion
Modificar la funcion `get_user_functions` en la base de datos para que, cuando el rol del usuario tenga `admin = true`, devuelva **todas** las funciones activas de la tabla `functions`, ignorando la tabla `role_functions`.

### Cambio tecnico

Se ejecutara una migracion SQL que reemplaza la funcion `get_user_functions` con la siguiente logica:

```text
SI el rol tiene admin = true:
  -> Devolver TODAS las funciones activas de la tabla "functions"
SI NO:
  -> Devolver solo las funciones vinculadas en "role_functions" (comportamiento actual)
```

La consulta para administradores sera:
```sql
SELECT json_agg(json_build_object('id', f.id, 'name', f.name))
FROM functions f
WHERE f.active = true
```

Para usuarios no-admin, se mantiene la consulta actual que filtra por `role_functions`.

### Archivos afectados
- **Nueva migracion SQL**: Actualiza la funcion `get_user_functions` con `CREATE OR REPLACE FUNCTION`
- No se requieren cambios en el frontend ni en la edge function, ya que la estructura de respuesta (role + functions) se mantiene identica.

