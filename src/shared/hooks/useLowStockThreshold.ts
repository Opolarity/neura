import { useQuery } from '@tanstack/react-query';
import { getParameter } from '@/modules/settings/services/Parameters.service';

/**
 * T-269 — Umbral global de stock bajo (Configuración > Negocio > Operación,
 * `parameters.LowStockThreshold`).
 *
 * Devuelve `null` cuando el parámetro no está configurado o es inválido:
 * **no hay valor por defecto**. Antes había un `10` hardcodeado replicado en
 * cinco lugares (dos en el front, tres en la BD); la tarea exige que nada siga
 * leyendo esa constante, así que sin parámetro la UI muestra "umbral no
 * configurado" en vez de inventar un número.
 *
 * Ojo: este hook es solo para **mostrar** el umbral (títulos de KPI, tooltips,
 * cabeceras). El "¿está bajo o no?" de cada SKU lo decide siempre la BD
 * (`vw_sku_effective_stock`), que es la definición única.
 */
export function useLowStockThreshold() {
  // Misma queryKey que ya usaba useInventoryDashboard: comparten caché.
  const query = useQuery({
    queryKey: ['parameter', 'LowStockThreshold'],
    queryFn: () => getParameter('LowStockThreshold'),
    staleTime: 1000 * 60 * 30,
  });

  const parsed = Number.parseInt(query.data ?? '', 10);
  const threshold = Number.isFinite(parsed) && parsed > 0 ? parsed : null;

  return { threshold, isLoading: query.isLoading };
}
