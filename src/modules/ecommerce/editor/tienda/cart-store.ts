// En el canvas del editor el carrito siempre está vacío y no se abre: el bloque
// "Carrito" solo necesita el contador y la acción, y en el editor no hay compra.
export function useCart(): { count: number; openDrawer: () => void } {
  return { count: 0, openDrawer: () => {} };
}
