import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { badgeVariants } from "@/components/ui/badge";
import { cn } from "@/shared/utils/utils";
import { FranchiseeTenant } from "../../types/FranchiseStock.types";

interface FranchiseeSelectProps {
  franchisees: FranchiseeTenant[];
  /** Code del tenant elegido; "" mientras no hay selección. */
  value: string;
  onValueChange: (tenantReference: string) => void;
  disabled?: boolean;
  placeholder?: string;
  triggerClassName?: string;
}

/**
 * Selector de franquiciado de /stock/products/franchise.
 *
 * Vive aparte del modal porque lo que tiene de propio no es el Select —ese es
 * el compartido de `ui/select`, que usa todo el ERP y no se toca— sino cómo se
 * pinta cada opción: el nombre de la tienda como etiqueta y, debajo, el
 * franquiciado en texto secundario junto al badge de la provincia, en vez de
 * los tres datos apelmazados en una línea.
 *
 * Los tres vienen de get-franchise-tenants: `name` es el nombre comercial del
 * tenant y los otros dos salen de `accounts` de este ERP cruzando por
 * `tenant_reference`. `province_name` y `account_name` son nullables a
 * propósito (hay tenants sin cuenta local y cuentas sin perfil ubicado): el
 * badge que no tiene dato simplemente no se pinta, y el franquiciado sigue
 * siendo seleccionable.
 */

// name es NOT NULL en tenants, pero si llegara vacío el code deja el selector
// utilizable en vez de una fila en blanco.
const storeName = (tenant: FranchiseeTenant) => tenant.name?.trim() || tenant.code;

/**
 * Los badges se pintan con `badgeVariants` sobre un <span> y no con <Badge>
 * porque el contenido de un SelectItem cuelga de SelectPrimitive.ItemText, que
 * renderiza un <span>, y <Badge> es un <div>: anidarlo ahí es HTML inválido.
 * Los estilos son los mismos, salen del mismo sitio.
 */
const badgeOutline = badgeVariants({ variant: "outline" });

export default function FranchiseeSelect({
  franchisees,
  value,
  onValueChange,
  disabled,
  placeholder = "Seleccione un franquiciado",
  triggerClassName = "w-full",
}: FranchiseeSelectProps) {
  const selected = franchisees.find((tenant) => tenant.code === value);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={triggerClassName}>
        {/*
          El trigger lleva children propios para que muestre solo el nombre de
          la tienda: sin ellos Radix clona ahí el contenido del ItemText, y el
          bloque de badges de la opción elegida le reventaría el alto.
        */}
        <SelectValue placeholder={placeholder}>
          {selected ? storeName(selected) : ""}
        </SelectValue>
      </SelectTrigger>
      {/*
        No se fija un ancho: se topa con el que Radix ya calcula del trigger
        (--radix-select-trigger-width). ui/select solo lo usa como `min-w` en
        el viewport, que es un suelo, asi que el desplegable igual crece con el
        nombre mas largo y no queda ancho contra el que truncar. El `max-w` lo
        cierra por arriba con esa misma medida.
      */}
      <SelectContent className="max-w-[var(--radix-select-trigger-width)]">
        {franchisees.map((tenant) => (
          <SelectItem
            key={tenant.code}
            value={tenant.code}
            // El contenido del item cuelga de SelectPrimitive.ItemText, que es
            // un <span> que se dimensiona al contenido: sin acotarlo no hay
            // ancho contra el que truncar. Mismo recurso que ya usa
            // SelectTrigger en ui/select con `[&>span]:truncate`.
            className="py-2 [&>span:last-child]:w-full [&>span:last-child]:min-w-0"
          >
            <span className="flex w-full min-w-0 flex-col gap-1">
              {/* El nombre de la tienda va como texto normal y en su propia
                  línea: es la etiqueta de la opción, no un dato más. */}
              <span className="truncate">{storeName(tenant)}</span>
              {(tenant.account_name || tenant.province_name) && (
                <span className="flex w-full min-w-0 items-center gap-1.5">
                  {/* El franquiciado tampoco es un badge: es texto secundario
                      que acompaña al nombre de la tienda. El único badge es la
                      provincia.

                      Se trunca por CSS (el texto completo sigue en el DOM) y
                      la provincia va `shrink-0`: de los dos, el que cede
                      espacio es siempre el franquiciado, porque la provincia
                      tiene que verse entera. */}
                  {tenant.account_name && (
                    <span className="min-w-0 truncate text-xs text-muted-foreground">
                      {tenant.account_name}
                    </span>
                  )}
                  {tenant.province_name && (
                    <span className={cn(badgeOutline, "shrink-0")}>
                      {tenant.province_name}
                    </span>
                  )}
                </span>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
