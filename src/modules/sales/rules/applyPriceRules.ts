// =============================================
// Price Rules Engine
// Funcion pura que recibe items del carrito y retorna
// el array con precios modificados segun reglas hardcodeadas.
// =============================================

interface CartItemForRules {
  variationId: number;
  quantity: number;
  price: number;
  originalPrice: number;
  [key: string]: any;
}

export function applyPriceRules<T extends CartItemForRules>(items: T[]): T[] {
  return items.map((item) => {
    let newPrice = item.originalPrice; // siempre partir del precio original

    // --- REGLA 1: Ejemplo placeholder ---
    // if (item.variationId === 42 && item.quantity >= 3) {
    //   newPrice = item.originalPrice * 0.9; // 10% descuento
    // }

    // --- REGLA 2: Ejemplo por total de items en carrito ---
    // const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0);
    // if (totalUnits >= 10) {
    //   newPrice = item.originalPrice * 0.95; // 5% descuento general
    // }

    return { ...item, price: newPrice };
  });
}
