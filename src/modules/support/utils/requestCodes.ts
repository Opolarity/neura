/**
 * Los códigos públicos de una solicitud, tal como se citan y como se buscan:
 * `"S-17 · T-219"`.
 *
 * El prefijo es presentación — en la API los dos viajan como número — y el
 * `T-` solo aparece cuando la solicitud ya se convirtió en tarea. Devuelve ""
 * cuando no hay ninguno, que es el caso de una versión de la API externa
 * anterior a la que expone `code`.
 *
 * Vive aquí y no en cada componente porque el código que el usuario ve es el
 * que va a pegar en el buscador: si la tabla y el detalle lo escribieran
 * distinto, uno de los dos no encontraría nada.
 */
export const formatSupportCodes = (request: {
  code: number | null;
  taskCode: number | null;
}): string =>
  [
    request.code !== null ? `S-${request.code}` : null,
    request.taskCode !== null ? `T-${request.taskCode}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
