// En el canvas del editor no hay cliente de la tienda con sesión: el bloque
// "Cuenta" se pinta como lo vería un visitante sin iniciar sesión. La sesión
// del ERP es de quien edita, no de un cliente, y no debe aparecer aquí.
export function useAuth(): { user: null } {
  return { user: null };
}
