// =============================================
// Errors from the franchisee API (create-consignment-intake)
// =============================================

export interface FranchiseIntakeErrorToast {
  title: string;
  description?: string;
}

/**
 * Lo que se le muestra al usuario cuando "Enviar a franquiciado" recibe un 422
 * de create-consignment-intake (API de franquiciados, otro repo).
 *
 * Cada 422 es un dato que falta en el ERP de franquiciados, no un fallo
 * técnico, y un "Error 422" a secas no le dice a nadie qué arreglar (S-339:
 * el tenant no tenía a Overtake como proveedor). Los mensajes conocidos se
 * traducen; cualquier otro 422 con texto se muestra tal cual, porque la API los
 * escribe en español para una persona. Devuelve null si no hay nada que
 * mostrar y el llamador sigue con su error genérico.
 */
export function franchiseIntakeErrorToast(
  status: number,
  responseText: string,
): FranchiseIntakeErrorToast | null {
  if (status !== 422) return null;

  let upstreamError = "";
  try {
    upstreamError = String((JSON.parse(responseText) as { error?: unknown })?.error ?? "").trim();
  } catch {
    // Respuesta no-JSON: nada que traducir.
  }
  if (!upstreamError) return null;

  // Un franquiciado que no usa Neura no tiene tenant en el ERP de franquiciados.
  if (/^Tenant ".*" no encontrado$/.test(upstreamError)) {
    return { title: "Franquiciado no usa Neura" };
  }

  // El tenant existe pero nadie dio de alta a Overtake (RUC de la empresa)
  // como proveedor, o falta el usuario de servicio con ese documento.
  if (/^Supplier con documento .* no encontrado$/.test(upstreamError)) {
    return {
      title: "Error al enviar",
      description: "Falta configurar a Overtake como proveedor en el franquiciado.",
    };
  }
  if (/^Usuario con documento .* no encontrado$/.test(upstreamError)) {
    return {
      title: "Error al enviar",
      description: "Falta configurar el usuario de Overtake en el franquiciado.",
    };
  }

  const warehouse = /^Warehouse "(.*)" no encontrado$/.exec(upstreamError);
  if (warehouse) {
    return {
      title: "Error al enviar",
      description: `El franquiciado no tiene un almacén con código "${warehouse[1]}".`,
    };
  }

  return { title: "Error al enviar", description: upstreamError };
}
