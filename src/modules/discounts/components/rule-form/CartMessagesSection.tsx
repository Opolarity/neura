import { Label } from "@/components/ui/label";
import WysiwygEditor from "@/components/ui/wysiwyg-editor";
import type { PriceRuleFormData } from "../../types/priceRule.types";
import { LabelRow, OptionalBadge } from "./OptionalBadge";

interface CartMessagesSectionProps {
  formData: PriceRuleFormData;
  updateField: <K extends keyof PriceRuleFormData>(
    field: K,
    value: PriceRuleFormData[K]
  ) => void;
}

type CampoMensaje = "cart_message_pending" | "cart_message_applied";

// Mismas variables que reemplaza process-price-rules (engine/cart-status.ts).
// El ejemplo es el de un pack 2 x S/99 con prendas de S/85.
const VARIABLES: Array<{ token: string; description: string; example: string }> = [
  { token: "{faltan}", description: "Prendas que faltan", example: "1 prenda" },
  { token: "{cantidad}", description: "Prendas en la promoción", example: "2 prendas" },
  { token: "{ahorro}", description: "Lo que ahorra", example: "S/71" },
  { token: "{total}", description: "Lo que paga por esas prendas", example: "S/99" },
];

const renderEjemplo = (html: string) =>
  VARIABLES.reduce(
    (acc, v) => acc.split(v.token).join(v.example),
    html.split("{faltan_numero}").join("1")
  );

const tieneTexto = (html: string) => !!html.replace(/<[^>]*>/g, "").trim();

// Agrega la variable al final del último párrafo (o crea uno si está vacío).
const agregarVariable = (html: string, token: string) =>
  tieneTexto(html)
    ? /<\/p>\s*$/.test(html)
      ? html.replace(/<\/p>\s*$/, ` ${token}</p>`)
      : `${html} ${token}`
    : `<p>${token}</p>`;

const CAMPOS: Array<{
  field: CampoMensaje;
  label: string;
  help: string;
  placeholder: string;
  tone: string;
}> = [
  {
    field: "cart_message_pending",
    label: "Mientras falta para activarla",
    help: "Se muestra cuando la promoción todavía no descuenta nada. Si usa {faltan}, también aparece antes de cumplir las condiciones, en cuanto el carrito tenga una prenda participante.",
    placeholder: "Ej: ¡Te falta {faltan} para activar tu 2x99! 👀",
    tone: "text-[rgb(42,110,182)]",
  },
  {
    field: "cart_message_applied",
    label: "Cuando ya está aplicada",
    help: "Se muestra cuando la promoción ya bajó el total del carrito.",
    placeholder: "Ej: ¡DUO PACK ACTIVADO! {cantidad} por {total} 🔥",
    tone: "text-green-700",
  },
];

/**
 * S-289: textos del carrito del ecommerce según el estado de la promoción. La
 * descripción la sigue usando el chatbot; estos solo los ve el carrito. Vacíos,
 * el carrito muestra la descripción como siempre.
 */
export const CartMessagesSection = ({ formData, updateField }: CartMessagesSectionProps) => {
  return (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <div className="space-y-1">
        <Label>Mensajes en el carrito de la tienda</Label>
        <p className="text-xs text-muted-foreground">
          Si los dejas vacíos, el carrito muestra la descripción de la promoción.
          El chatbot siempre usa la descripción.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {VARIABLES.map((v) => (
          <span
            key={v.token}
            className="rounded-md border bg-background px-2 py-1 text-xs"
            title={`Ejemplo: ${v.example}`}
          >
            <code className="font-mono">{v.token}</code>{" "}
            <span className="text-muted-foreground">{v.description}</span>
          </span>
        ))}
      </div>

      {CAMPOS.map(({ field, label, help, placeholder, tone }) => {
        const value = formData[field];
        return (
          <div key={field} className="space-y-2">
            <LabelRow>
              <Label>{label}</Label>
              <OptionalBadge />
            </LabelRow>
            {/* El label lo pinta LabelRow para llevar el badge: el del editor
                (solo acepta texto) se deja vacío. */}
            <WysiwygEditor
              label=""
              value={value}
              onChange={(val) => updateField(field, val)}
              placeholder={placeholder}
              height="80px"
              toolbar="basic"
            />
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-xs text-muted-foreground">Insertar:</span>
              {VARIABLES.map((v) => (
                <button
                  key={v.token}
                  type="button"
                  className="rounded border bg-background px-1.5 py-0.5 font-mono text-xs hover:bg-muted"
                  onClick={() => updateField(field, agregarVariable(value, v.token))}
                >
                  {v.token}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{help}</p>
            {tieneTexto(value) && (
              <div className="rounded-md border bg-background px-3 py-2">
                <p className="mb-1 text-xs text-muted-foreground">Vista previa</p>
                <div
                  className={`text-sm font-medium ${tone}`}
                  dangerouslySetInnerHTML={{ __html: renderEjemplo(value) }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
