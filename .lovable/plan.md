

## Bug: El monto del pago se guarda como el total de la orden

### Causa raíz

En el RPC `sp_create_order`, línea 238 del INSERT en `order_payment`, el campo `amount` usa `(p_order_data->>'total')::NUMERIC` en lugar de `(v_payment->>'amount')::NUMERIC`.

Esto hace que **siempre se guarde el total de la orden como monto del pago**, ignorando el monto real ingresado por el usuario. En tu caso: pagaste 30 con Yape, pero se guardó 20 (el total de la orden). El vuelto de -10 se guardó bien, dando un neto de 10, que no cubre el total.

### Corrección

**Migración SQL** — Cambiar una sola línea en `sp_create_order`:

```sql
-- Línea actual (incorrecta):
(p_order_data->>'total')::NUMERIC,

-- Corregir a:
(v_payment->>'amount')::NUMERIC,
```

Se recrea la función `sp_create_order` con esta corrección.

### Impacto

- Solo afecta a pagos futuros; los pagos ya registrados quedan con el monto incorrecto.
- Para la orden 198, habría que corregir manualmente el monto del pago 182 de 20 a 30.

