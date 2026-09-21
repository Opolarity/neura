/**
 * Cuántos caracteres del nombre de la receta caben en la etiqueta corta.
 *
 * La celda de la orden es estrecha y compite con la cantidad, las categorías y
 * las etiquetas de la prenda. Un nombre como «Girls Fame - Polera Oversize»
 * más sus variaciones ocupaba la fila entera.
 */
const MAX_NOMBRE = 10;

/** «Girls Fame - Polera Oversize» → «Girls Fame...» */
export const acortarNombreExplosion = (nombre: string): string =>
  nombre.length > MAX_NOMBRE ? `${nombre.slice(0, MAX_NOMBRE)}...` : nombre;

/**
 * Lo que se ve: el id y el nombre acortado.
 *
 * El id va delante porque es lo que de verdad identifica la receta —dos se
 * pueden llamar casi igual, y acortadas a diez caracteres se llamarían igual
 * del todo—. El texto completo no se pierde: viaja como `title` y sale al
 * pasar el ratón.
 */
export const explosionShortLabel = (
  id: number | null,
  nombre: string | null,
): string => {
  const partes = [
    id === null ? null : `#${id}`,
    nombre ? acortarNombreExplosion(nombre) : null,
  ].filter(Boolean);

  return partes.join(" · ");
};
