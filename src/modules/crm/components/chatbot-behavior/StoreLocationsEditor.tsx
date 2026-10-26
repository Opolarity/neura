import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fromStoreLocations, toStoreLocations } from "../../adapters/chatbotBehavior.adapter";
import type { ChatbotStoreLocation } from "../../types/chatbotBehavior.types";

interface StoreLocationsEditorProps {
  id: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

const FIELDS: Array<{ key: keyof Omit<ChatbotStoreLocation, "propia">; label: string; placeholder: string; wide?: boolean }> = [
  { key: "ciudad", label: "Ciudad", placeholder: "Arequipa" },
  { key: "nombre", label: "Nombre de la sede", placeholder: "Roots" },
  { key: "direccion", label: "Dirección", placeholder: "C.C. Outlet Arauco (ex parque Lambramani)", wide: true },
  { key: "horario", label: "Horario", placeholder: "Lunes a domingo, 10 am a 10 pm" },
  { key: "whatsapp", label: "WhatsApp (vacío = el del equipo)", placeholder: "51934577906" },
];

const EMPTY: ChatbotStoreLocation = { ciudad: "", nombre: "", direccion: "", horario: "", whatsapp: "", propia: false };

/**
 * Las sedes que conoce el bot (store_locations). Se editan como filas y se
 * guardan como JSON; la validación (campos obligatorios, WhatsApp con código
 * de país, una sola tienda propia) la hace el SP al guardar.
 */
export default function StoreLocationsEditor({ id, value, disabled, onChange }: StoreLocationsEditorProps) {
  const stores = toStoreLocations(value);
  const update = (next: ChatbotStoreLocation[]) => onChange(fromStoreLocations(next));
  const setField = (i: number, patch: Partial<ChatbotStoreLocation>) =>
    update(stores.map((s, j) => (j === i ? { ...s, ...patch } : patch.propia ? { ...s, propia: false } : s)));

  return (
    <div id={id} className="space-y-3">
      {stores.map((store, i) => (
        <div key={i} className="rounded-md border p-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">
              {store.nombre || `Sede ${i + 1}`}
              {store.ciudad ? <span className="text-muted-foreground font-normal"> · {store.ciudad}</span> : null}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-muted-foreground"
              disabled={disabled}
              onClick={() => update(stores.filter((_, j) => j !== i))}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Quitar
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <div key={f.key} className={f.wide ? "space-y-1 sm:col-span-2" : "space-y-1"}>
                <Label htmlFor={`${id}-${i}-${f.key}`} className="text-xs text-muted-foreground font-normal">
                  {f.label}
                </Label>
                <Input
                  id={`${id}-${i}-${f.key}`}
                  value={store[f.key]}
                  placeholder={f.placeholder}
                  maxLength={f.key === "whatsapp" ? 20 : 150}
                  disabled={disabled}
                  onChange={(e) => setField(i, { [f.key]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id={`${id}-${i}-propia`}
              checked={store.propia}
              disabled={disabled}
              onCheckedChange={(checked) => setField(i, { propia: checked === true })}
            />
            <Label htmlFor={`${id}-${i}-propia`} className="font-normal">
              Es la tienda propia (no una sucursal)
            </Label>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => update([...stores, { ...EMPTY }])}>
        <Plus className="w-4 h-4 mr-1" />
        Agregar sede
      </Button>
    </div>
  );
}
