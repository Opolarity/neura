import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { SupplierPayablesTab } from "../components/payments-collections/SupplierPayablesTab";

type TabKey = "suppliers";

/**
 * Cada pestaña sigue con el permiso que tenía su pantalla. En personalizado
 * solo existe Proveedores: Overtake no cobra maquila a clientes ni paga a
 * operarios por destajo (pase desde multicliente, 2026-11-11).
 */
const TABS: Array<{ key: TabKey; label: string; permission: string }> = [
  { key: "suppliers", label: "Proveedores", permission: "supplier_payments.list" },
];

/**
 * Pagos y cobros: a quién le falta pagar, agrupado por taller y OP, y al abrir
 * una fila se ven sus servicios. Reemplaza «Pagos a proveedores»
 * (`/suppliers/payments` redirige aquí con `?tab=suppliers`).
 *
 * Con una sola pestaña visible no se pinta la barra de pestañas: sería un
 * botón que no lleva a ningún lado. Se mantiene la estructura de `Tabs` para
 * que sumar otra pestaña sea agregar una fila a `TABS`.
 */
const PaymentsAndCollections = () => {
  const { permissionCodes } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const visibles = TABS.filter((tab) => permissionCodes.includes(tab.permission));
  const pedida = searchParams.get("tab") as TabKey | null;
  const activa = visibles.find((tab) => tab.key === pedida)?.key ?? visibles[0]?.key ?? "suppliers";

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-foreground">Pagos y cobros</h1>

      <Tabs
        value={activa}
        onValueChange={(value) => setSearchParams({ tab: value }, { replace: true })}
        className="flex min-h-0 flex-1 flex-col gap-4"
      >
        {visibles.length > 1 && (
          <TabsList className="self-start">
            {visibles.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        )}
        {/* Solo se monta la activa: cada una pide sus datos al abrirse. */}
        <TabsContent value="suppliers" className="mt-0 min-h-0 flex-1">
          {activa === "suppliers" && <SupplierPayablesTab />}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentsAndCollections;
