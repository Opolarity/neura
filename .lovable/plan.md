
## Plan: Corregir flujo de apertura de sesión POS

### Resumen del problema

Al intentar iniciar sesión en la apertura de caja, el sistema falla por múltiples razones:

1. **Nombre de edge function incorrecto**: El servicio llama a `manage-cash-session` pero la función se llama `manage-pos-session`
2. **Falta campo obligatorio `business_account`**: La tabla `pos_sessions` tiene una columna `business_account` (NOT NULL) que el stored procedure no está insertando
3. **No hay selector de caja**: El usuario necesita poder elegir la caja (business_accounts con type CHR del módulo BNA)

---

### Cambios a implementar

#### 1. Corregir nombre de edge function en el servicio

**Archivo**: `src/modules/sales/services/POSSession.service.ts`

Cambiar todas las referencias de `manage-cash-session` a `manage-pos-session`:

```typescript
// ANTES
await supabase.functions.invoke("manage-cash-session", ...)

// DESPUÉS  
await supabase.functions.invoke("manage-pos-session", ...)
```

---

#### 2. Agregar servicio para obtener las cajas disponibles

**Archivo**: `src/modules/sales/services/POSSession.service.ts`

Agregar función para obtener business_accounts tipo "Caja":

```typescript
export const getCashRegisters = async () => {
  const { data, error } = await supabase
    .from("business_accounts")
    .select(`
      id, 
      name, 
      business_account_type:types!business_accounts_business_account_type_id_fkey(
        id, code, name, module:modules(code)
      )
    `)
    .eq("types.code", "CHR")
    .eq("types.modules.code", "BNA");
    
  if (error) throw error;
  return data || [];
};
```

---

#### 3. Actualizar tipos para incluir caja seleccionada

**Archivo**: `src/modules/sales/types/POS.types.ts`

Actualizar interface OpenPOSSessionRequest:

```typescript
export interface OpenPOSSessionRequest {
  openingAmount: number;
  businessAccountId: number;  // NUEVO - ID de la caja
  notes?: string;
}

export interface CashRegister {
  id: number;
  name: string;
}
```

---

#### 4. Actualizar modal de apertura para incluir selector de caja

**Archivo**: `src/modules/sales/components/pos/POSSessionModal.tsx`

Agregar:
- Select para elegir la caja
- Cargar cajas disponibles al montar el componente
- Validar que se haya seleccionado una caja antes de enviar

---

#### 5. Actualizar edge function para enviar businessAccountId

**Archivo**: `supabase/functions/manage-pos-session/index.ts`

En la acción `open`, agregar el parámetro:

```typescript
if (action === "open") {
  const { openingAmount, notes, businessAccountId } = input;

  const { data, error } = await supabase.rpc("sp_open_pos_session", {
    p_user_id: user.id,
    p_warehouse_id: profile.warehouse_id,
    p_branch_id: profile.branch_id,
    p_opening_amount: openingAmount || 0,
    p_business_account_id: businessAccountId,  // NUEVO
    p_notes: notes || null,
  });
  // ...
}
```

---

#### 6. Actualizar stored procedure para aceptar business_account

**Migración SQL**:

```sql
CREATE OR REPLACE FUNCTION sp_open_pos_session(
  p_user_id UUID,
  p_warehouse_id INTEGER,
  p_branch_id INTEGER,
  p_opening_amount NUMERIC DEFAULT 0,
  p_business_account_id INTEGER,  -- NUEVO PARÁMETRO
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_existing_session_id INTEGER;
  v_new_session_id INTEGER;
  v_open_status_id INTEGER;
BEGIN
  -- Get open status id
  SELECT id INTO v_open_status_id
  FROM statuses st
  JOIN modules mo ON st.module_id = mo.id AND mo.code = 'POS'
  WHERE st.code = 'OPE';

  -- Check if user already has an open session
  SELECT id INTO v_existing_session_id
  FROM pos_sessions
  WHERE user_id = p_user_id
    AND status_id = v_open_status_id;

  IF v_existing_session_id IS NOT NULL THEN
    RAISE EXCEPTION 'User already has an open cash session (ID: %)', v_existing_session_id;
  END IF;

  -- Create new session (AHORA INCLUYE business_account)
  INSERT INTO public.pos_sessions (
    user_id,
    warehouse_id,
    branch_id,
    opening_amount,
    business_account,  -- NUEVO
    status_id,
    notes
  )
  VALUES (
    p_user_id,
    p_warehouse_id,
    p_branch_id,
    p_opening_amount,
    p_business_account_id,  -- NUEVO
    v_open_status_id,
    p_notes
  )
  RETURNING id INTO v_new_session_id;

  RETURN json_build_object(
    'session_id', v_new_session_id,
    'opened_at', NOW()
  );
END;
$$ LANGUAGE plpgsql;
```

---

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/modules/sales/services/POSSession.service.ts` | Corregir nombre de función, agregar getCashRegisters |
| `src/modules/sales/types/POS.types.ts` | Agregar businessAccountId a request, tipo CashRegister |
| `src/modules/sales/components/pos/POSSessionModal.tsx` | Agregar selector de caja |
| `src/modules/sales/hooks/usePOSSession.ts` | Cargar cajas disponibles |
| `supabase/functions/manage-pos-session/index.ts` | Pasar businessAccountId al RPC |
| **Base de datos** | Actualizar sp_open_pos_session |

---

### Flujo corregido

```text
Usuario entra a /pos
         ↓
Se muestra modal "Apertura de Caja"
         ↓
Se cargan las cajas disponibles (business_accounts type CHR)
         ↓
Usuario selecciona caja + ingresa monto inicial
         ↓
openSession({ openingAmount, businessAccountId, notes })
         ↓
POST /manage-pos-session (action: "open")
         ↓
sp_open_pos_session(p_business_account_id: X, ...)
         ↓
INSERT INTO pos_sessions (business_account = X, ...)
         ↓
Sesión creada exitosamente
```

---

### Cajas disponibles en la base de datos

Las cajas actualmente configuradas son:

| ID | Nombre |
|----|--------|
| 5 | Caja 1 |
| 6 | Caja 2 |
| 7 | Caja 3 |

Estas son las que aparecerán en el selector del modal de apertura.
