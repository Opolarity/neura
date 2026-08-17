import { useEffect, useState } from "react";
import type { FranchiseeAccount } from "../types/priceRule.types";
import { getFranchiseeAccounts } from "../services/PriceRule.services";

// Cuentas franquiciadas para el selector de las promociones de consignación.
// Se carga on-demand (enabled) para no pedirlas si la regla no es de
// consignación.
export function useFranchiseeAccounts(enabled: boolean) {
  const [accounts, setAccounts] = useState<FranchiseeAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // `loading` NO va en las dependencias: setLoading(true) volvía a disparar el
  // efecto, React ejecutaba el cleanup de la pasada anterior (cancelled = true)
  // y la respuesta se descartaba sin apagar el loading — el selector se quedaba
  // en "Cargando franquiciados..." para siempre.
  useEffect(() => {
    if (!enabled || loaded) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const data = await getFranchiseeAccounts();
        if (!cancelled) {
          setAccounts(data);
          setLoaded(true);
        }
      } catch (error) {
        console.error("Error loading franchisee accounts:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();

    return () => {
      cancelled = true;
    };
  }, [enabled, loaded]);

  return { accounts, loading };
}
