// La seccion Apariencia del panel de propiedades: el fondo del bloque.
//
// Nacio dentro del Contenedor y se saco aqui tal cual para que otros bloques
// la monten sin reescribirla. Son las mismas cuatro formas de fondo —color,
// imagen, video y degradado— y ni una propiedad mas.
//
// Como LinkSection, lee y escribe las props del nodo seleccionado por su
// cuenta: quien la monta no le pasa nada. Para pintar ese fondo en la tienda
// esta `useAppearance`, que devuelve la clase, su <style> y el video.
//
// El fondo se reparte por modo de pantalla con la misma cascada que las
// medidas (ver box-measures.ts): cada modo usa el suyo y, si no trae nada,
// el del modo inmediatamente mayor. Definir el de escritorio basta para los
// tres. Se reparten el tipo, el color, la imagen, el tamaño y la posicion;
// el degradado y la direccion del video no, y el porque esta mas abajo.

import { useState, useEffect, useId, type ReactNode } from "react";
import { useNode, useEditor } from "@craftjs/core";
import { Palette, Image as ImageIcon, Video, Blend, GripVertical, Trash2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColorField } from "@/modules/ecommerce/editor/components/color-field";
import { AnglePicker } from "@/modules/ecommerce/editor/components/angle-picker";
import { SettingsSection } from "@/modules/ecommerce/editor/components/settings-section";
import { ResponsiveField } from "@/modules/ecommerce/editor/components/responsive-field";
import { useViewport, type Viewport } from "@/modules/ecommerce/editor/components/viewport-context";
import { BOX_MODES, type BoxMode } from "@/modules/ecommerce/editor/components/box-measures";
import { useEditorVideo } from "@/modules/ecommerce/editor/hooks/use-editor-video";
import {
  generateId,
  reorderById,
  useDragReorder,
} from "@/modules/ecommerce/editor/components/user-components/drag-reorder";

/** Una parada del degradado: el color y en qué punto del recorrido cae (0-100). */
export interface GradientStop {
  id?: string;
  color: string;
  position: number;
}

export type BackgroundType = "color" | "image" | "video" | "gradient";

export type BackgroundSize = "cover" | "contain" | "auto";

/** Las props del nodo que maneja esta seccion. No hay mas. */
export interface AppearanceProps {
  // Las cinco que se reparten por modo. Estas son las del formato anterior:
  // se siguen leyendo para que un bloque ya publicado se vea igual, y al
  // primer cambio del panel se pasan al reparto por modo.
  background?: string;
  backgroundType?: BackgroundType;
  backgroundImageUrl?: string;
  backgroundSize?: BackgroundSize;
  backgroundPosition?: string;
  /**
   * El degradado no se reparte por modo: cambiar su direccion o sus paradas
   * de un tamaño a otro no lo pide nadie, y lo que si se quiere —degradado en
   * escritorio y color plano en el celular— ya lo resuelve el tipo de fondo,
   * que si se reparte.
   */
  gradientAngle?: number;
  gradientStops?: GradientStop[];
  /**
   * El video tampoco: lo que se pide es quitarlo en el celular, no poner otro
   * distinto, y para eso basta con que ese modo elija otro tipo de fondo.
   */
  backgroundVideoUrl?: string;
  [key: string]: unknown;
}

// Con lo que nace un degradado: de negro a transparente, de izquierda a
// derecha (90°, como el reloj a las tres).
export const DEFAULT_GRADIENT_STOPS: GradientStop[] = [
  { id: generateId(), color: "rgba(0, 0, 0, 0.7)", position: 0 },
  { id: generateId(), color: "rgba(0, 0, 0, 0)", position: 100 },
];
export const DEFAULT_GRADIENT_ANGLE = 90;

/**
 * Lo que un bloque declara en su `craft.props` para nacer con esta seccion.
 *
 * Son las props del formato anterior a proposito: asi nace con un solo fondo
 * para los tres modos, que es lo que se espera, y el reparto aparece cuando
 * de verdad se toca algo. Las de modo no se declaran — declararlas fijaria
 * los tres y romperia la herencia.
 */
export const APPEARANCE_CRAFT_PROPS = {
  background: "transparent",
  backgroundType: "color" as const,
  gradientAngle: DEFAULT_GRADIENT_ANGLE,
  gradientStops: DEFAULT_GRADIENT_STOPS,
  backgroundImageUrl: "",
  backgroundVideoUrl: "",
  backgroundSize: "cover" as const,
  backgroundPosition: "center",
};

/**
 * El `linear-gradient(...)` que pinta la lista de paradas, en el orden en que
 * estan: el usuario las reordena a mano, asi que ese orden es el que manda.
 * Si una posicion queda por detras de la anterior, CSS la sube sola.
 */
export function gradientCss(angle: number, stops: GradientStop[]) {
  return `linear-gradient(${angle}deg, ${stops
    .map((s) => `${s.color} ${s.position}%`)
    .join(", ")})`;
}

// ── El reparto por modo ─────────────────────────────────────────────────────

/** Las cinco que se reparten. El resto del fondo es comun a los tres modos. */
export const APPEARANCE_KEYS = [
  "backgroundType",
  "background",
  "backgroundImageUrl",
  "backgroundSize",
  "backgroundPosition",
] as const;

export type AppearanceKey = (typeof APPEARANCE_KEYS)[number];

/** Lo que un modo acaba aplicando. */
export type AppearanceValues = {
  backgroundType: BackgroundType;
  background: string;
  backgroundImageUrl: string;
  backgroundSize: BackgroundSize;
  backgroundPosition: string;
};

/**
 * Lo que el bloque pintaba de fondo antes de tener esta seccion. Se usa en
 * lugar de lo guardado mientras siga en el formato anterior, que es lo que
 * hace que un bloque ya publicado se siga viendo igual.
 *
 * Sirve sobre todo para el bloque que guardaba el fondo con otro nombre: el
 * Icono lo tenia en `backgroundColor`, no en `background`.
 */
export type AppearanceLegacy = Partial<AppearanceValues>;

/** `backgroundImageUrlMobile`, `backgroundTypeDesktop`… */
export const appearanceKeyOf = (key: AppearanceKey, mode: BoxMode) => `${key}${mode}`;

/** Los modos en minuscula —los del editor— y como se llaman en las props. */
const BOX: Record<Viewport, BoxMode> = {
  desktop: "Desktop",
  tablet: "Tablet",
  mobile: "Mobile",
};

/**
 * Si el bloque sigue con un fondo unico para los tres modos.
 *
 * La señal es el tipo: al salir del formato anterior siempre se escribe el de
 * escritorio, asi que mientras no haya ninguno guardado es que nadie ha
 * repartido nada. Es el mismo criterio que usan las medidas con la unidad.
 */
export function isLegacyAppearance(props: Record<string, unknown>) {
  return BOX_MODES.every(
    (mode) => props[appearanceKeyOf("backgroundType", mode)] === undefined,
  );
}

/**
 * Lo que este modo aporta por si mismo, o `undefined` si no aporta y hereda.
 *
 * Una cadena vacia es no aportar: vaciar la URL de la imagen en el celular es
 * como decir "la que venga de arriba", no "sin imagen". Para quitarla del todo
 * esta el tipo de fondo, que tambien se reparte.
 */
function ownAppearanceOf(
  props: Record<string, unknown>,
  key: AppearanceKey,
  mode: BoxMode,
): string | undefined {
  const value = props[appearanceKeyOf(key, mode)] as string | undefined;
  return value === "" || value === undefined ? undefined : value;
}

/**
 * La cascada: cada modo usa lo suyo y, si no trae nada, lo del modo
 * inmediatamente mayor. Mientras el bloque siga en el formato anterior, el
 * escritorio parte de las props sin modo, que es lo que lo mantiene igual que
 * el dia que se publico.
 */
export function appearanceCascade(
  props: Record<string, unknown>,
  legacy?: AppearanceLegacy,
): Record<Viewport, AppearanceValues> {
  const anterior = isLegacyAppearance(props);
  // Lo que el bloque guardaba con otro nombre manda sobre la prop plana, igual
  // que en el resto de secciones: es lo que de verdad se estaba pintando.
  const heredado = (key: AppearanceKey) =>
    anterior
      ? ((legacy?.[key] as string | undefined) ?? (props[key] as string | undefined))
      : undefined;

  const resolver = (mode: BoxMode, padre: Partial<AppearanceValues>) => {
    const out = {} as Record<AppearanceKey, string | undefined>;
    for (const key of APPEARANCE_KEYS)
      out[key] = ownAppearanceOf(props, key, mode) ?? (padre as never)[key];
    return {
      backgroundType: (out.backgroundType as BackgroundType) ?? "color",
      background: out.background ?? "transparent",
      backgroundImageUrl: out.backgroundImageUrl ?? "",
      backgroundSize: (out.backgroundSize as BackgroundSize) ?? "cover",
      backgroundPosition: out.backgroundPosition ?? "center",
    };
  };

  const base: Partial<AppearanceValues> = {};
  for (const key of APPEARANCE_KEYS) (base as never as Record<string, unknown>)[key] = heredado(key);

  const desktop = resolver("Desktop", base);
  const tablet = resolver("Tablet", desktop);
  return { desktop, tablet, mobile: resolver("Mobile", tablet) };
}

/**
 * Saca al bloque del fondo unico y lo pasa al reparto por modo.
 *
 * Se llama antes de cualquier escritura del panel: guardar un solo valor de un
 * modo ya cuenta como formato nuevo, y sin esto lo que valia "para los tres"
 * se perderia al tocar un campo de uno solo.
 *
 * Aterriza solo en el escritorio, y los otros dos lo heredan de ahi: es
 * exactamente lo que hacia cuando era un fondo unico, y ademas deja la cascada
 * viva —escribirlo en los tres los dejaria fijados—.
 */
export function materializeAppearance(
  props: Record<string, unknown>,
  legacy?: AppearanceLegacy,
) {
  if (!isLegacyAppearance(props)) return;
  // Lo que se estaba viendo es lo que aterriza: la cascada ya sabe resolverlo
  // —prop plana o formato anterior— asi que se le pregunta a ella.
  const previo = appearanceCascade(props, legacy).desktop;
  for (const key of APPEARANCE_KEYS)
    props[appearanceKeyOf(key, "Desktop")] = String(previo[key]);
}

// ── Lo que se pinta ─────────────────────────────────────────────────────────

/** Las reglas del bloque en un modo. El video no pinta fondo: lo pinta el. */
function backgroundRulesOf(v: AppearanceValues, props: AppearanceProps) {
  const gradientAngle = (props.gradientAngle as number | undefined) ?? DEFAULT_GRADIENT_ANGLE;
  const gradientStops = (props.gradientStops as GradientStop[] | undefined) ?? DEFAULT_GRADIENT_STOPS;

  if (v.backgroundType === "color")
    return v.background ? `background-color: ${v.background};` : "";

  if (v.backgroundType === "image" && v.backgroundImageUrl)
    return (
      `background-image: url(${v.backgroundImageUrl});` +
      `background-size: ${v.backgroundSize};` +
      `background-position: ${v.backgroundPosition};` +
      `background-repeat: no-repeat;`
    );

  if (v.backgroundType === "gradient" && gradientStops.length >= 2)
    return `background-image: ${gradientCss(gradientAngle, gradientStops)};`;

  return "";
}

/**
 * Las reglas del `<video>` en un modo: se enseña solo donde el fondo es un
 * video, y se ajusta como diga ese modo. Se apaga con `display: none` en vez
 * de no pintarlo porque en la tienda el modo lo decide el ancho del navegador,
 * no el editor: el elemento tiene que existir para los tres.
 */
function videoRulesOf(v: AppearanceValues) {
  if (v.backgroundType !== "video") return "display: none;";
  return (
    `display: block;` +
    `object-fit: ${v.backgroundSize === "auto" ? "none" : v.backgroundSize};` +
    `object-position: ${v.backgroundPosition};`
  );
}

/**
 * Las reglas del fondo de un bloque, ya resueltas por modo de pantalla. Para
 * el que emite su propio `<style>`; los demas usan `useAppearance`.
 */
export function appearanceRulesByViewport(
  props: AppearanceProps,
  legacy?: AppearanceLegacy,
) {
  const cascada = appearanceCascade(props, legacy);
  const of = (modo: Viewport) => ({
    fondo: backgroundRulesOf(cascada[modo], props),
    video: videoRulesOf(cascada[modo]),
  });
  return { desktop: of("desktop"), tablet: of("tablet"), mobile: of("mobile") };
}

/**
 * El fondo ya resuelto: la clase que va en el elemento, su `<style>` y, si
 * algun modo lo pide, el `<video>` que cuelga de el.
 *
 * En el editor solo se escribe el modo que se esta viendo; en la tienda los
 * tres con sus media queries. Gemelo de `useSpacingCss` y `useBorderCss`.
 *
 * El video es `absolute` con `-z-10`, asi que el elemento que lo recibe tiene
 * que llevar `relative isolate` — tambien fuera del editor.
 */
export function useAppearance(props: AppearanceProps, legacy?: AppearanceLegacy) {
  const { videoRef, canAutoPlay } = useEditorVideo();
  const id = useId();
  const className = `editable-appearance-${id.replace(/:/g, "")}`;
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const viewport = useViewport();

  const cascada = appearanceCascade(props, legacy);
  const rules = appearanceRulesByViewport(props, legacy);
  const videoUrl = (props.backgroundVideoUrl as string | undefined) ?? "";
  // Si ningun modo pide video no hay nada que montar, y asi el bloque no
  // arrastra un <video> vacio por el resto de su vida.
  const hayVideo =
    Boolean(videoUrl) &&
    (["desktop", "tablet", "mobile"] as const).some(
      (modo) => cascada[modo].backgroundType === "video",
    );

  const bloque = (modo: Viewport) =>
    `.${className} { ${rules[modo].fondo} }` +
    (hayVideo ? `.${className} > .${className}-video { ${rules[modo].video} }` : "");

  const css =
    enabled && viewport
      ? bloque(viewport)
      : `
        @media (max-width: 767px) { ${bloque("mobile")} }
        @media (min-width: 768px) and (max-width: 1023px) { ${bloque("tablet")} }
        @media (min-width: 1024px) { ${bloque("desktop")} }
      `;

  const backgroundVideo = hayVideo ? (
    <video
      ref={videoRef}
      src={videoUrl}
      // El video de fondo no arranca mientras se edita.
      autoPlay={canAutoPlay}
      muted
      loop
      playsInline
      aria-hidden="true"
      tabIndex={-1}
      className={`${className}-video pointer-events-none absolute inset-0 -z-10 h-full w-full`}
    />
  ) : null;

  return { className, styleTag: <style>{css}</style>, backgroundVideo };
}

// ── El panel ────────────────────────────────────────────────────────────────

const BACKGROUND_POSITIONS = [
  { value: "center", label: "Centro" },
  { value: "top", label: "Arriba" },
  { value: "bottom", label: "Abajo" },
  { value: "left", label: "Izquierda" },
  { value: "right", label: "Derecha" },
  { value: "top left", label: "Arriba izquierda" },
  { value: "top right", label: "Arriba derecha" },
  { value: "bottom left", label: "Abajo izquierda" },
  { value: "bottom right", label: "Abajo derecha" },
] as const;

const BACKGROUND_SIZES = [
  { value: "cover", label: "Cubrir" },
  { value: "contain", label: "Contener" },
  { value: "auto", label: "Auto" },
] as const;

const BACKGROUND_TABS: {
  type: BackgroundType;
  label: string;
  Icon: typeof Palette;
}[] = [
  { type: "color", label: "Color", Icon: Palette },
  { type: "image", label: "Imagen", Icon: ImageIcon },
  { type: "video", label: "Video", Icon: Video },
  { type: "gradient", label: "Gradiente", Icon: Blend },
];

/**
 * La posicion de una parada, como los campos del selector de color: se aplica
 * al salir o con Enter, nunca mientras se teclea. Solo vale un entero entre 0
 * y 100; cualquier otra cosa se descarta y el campo vuelve a lo guardado. Al
 * mostrarse lleva el "%" pegado, que se quita al entrar a editar para no
 * obligar a borrarlo.
 */
function StopPositionInput({
  value,
  onCommit,
}: {
  value: number;
  onCommit: (position: number) => void;
}) {
  const [texto, setTexto] = useState<string | null>(null);

  const aplicar = (raw: string) => {
    setTexto(null);
    const limpio = raw.trim().replace(/%$/, "").trim();
    if (!/^\d+$/.test(limpio)) return;
    onCommit(Math.min(100, Number(limpio)));
  };

  return (
    <input
      aria-label="Posición de la parada"
      inputMode="numeric"
      value={texto ?? `${value}%`}
      onFocus={() => setTexto(String(value))}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={(e) => aplicar(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setTexto(null);
        }
      }}
      className="h-8 w-12 shrink-0 rounded-md border border-input bg-background px-1 text-center text-[12px] tabular-nums outline-none focus-visible:ring-1 focus-visible:ring-ring"
    />
  );
}

function GradientSettings({
  angle,
  stops,
  onAngleChange,
  onStopsChange,
}: {
  angle: number;
  stops: GradientStop[];
  onAngleChange: (angle: number) => void;
  onStopsChange: (stops: GradientStop[]) => void;
}) {
  // Reordenar arrastra por id, asi que una parada guardada sin el (contenido
  // anterior a esta version) lo recibe al montar. Igual que el backfill de
  // Beneficios: comprueba `== null`, no lo rellena en cada render.
  useEffect(() => {
    if (stops.some((s) => s.id == null)) onStopsChange(conIds());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops]);

  const claveDe = (s: GradientStop, i: number) => s.id ?? `${i}-${s.position}`;
  const conIds = () => stops.map((s) => (s.id ? s : { ...s, id: generateId() }));

  const { handleDragStart, handleDragEnd, handleDragOver, handleDrop, itemDragClass } =
    useDragReorder((fromId, toId) => onStopsChange(reorderById(stops, fromId, toId)));

  const cambiar = (index: number, cambio: Partial<GradientStop>) =>
    onStopsChange(conIds().map((s, i) => (i === index ? { ...s, ...cambio } : s)));

  const agregar = () => {
    // La nueva parada entra a mitad de camino entre la ultima y el 100, para
    // que se vea al momento y no pise a otra.
    const ultima = Math.max(...stops.map((s) => s.position));
    const position = ultima >= 100 ? 100 : Math.round((ultima + 100) / 2);
    onStopsChange([...conIds(), { id: generateId(), color: "rgba(255, 255, 255, 1)", position }]);
  };

  const quitar = (index: number) => {
    if (stops.length <= 2) return;
    onStopsChange(conIds().filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label className="text-[11px] text-foreground/80">Dirección</Label>
        <AnglePicker value={angle} onChange={onAngleChange} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-[11px] text-foreground/80">Colores</Label>
        <div className="flex flex-col gap-2">
          {stops.map((stop, index) => (
            <div
              key={claveDe(stop, index)}
              className={`flex items-center gap-1.5 rounded-md ${itemDragClass(stop.id)}`}
              onDragOver={(e) => handleDragOver(e, stop.id)}
              onDrop={(e) => handleDrop(e, stop.id)}
            >
              <span
                draggable={!!stop.id}
                title="Arrastra para reordenar"
                onDragStart={(e) => {
                  e.stopPropagation();
                  if (stop.id) handleDragStart(e, stop.id);
                }}
                onDragEnd={handleDragEnd}
                className="flex h-8 shrink-0 cursor-grab items-center px-1 text-muted-foreground transition-colors hover:text-foreground active:cursor-grabbing"
              >
                <GripVertical className="h-3 w-3" />
              </span>
              <StopPositionInput
                value={stop.position}
                onCommit={(position) => cambiar(index, { position })}
              />
              <div className="min-w-0 flex-1 [&_button]:h-8 [&_button]:text-[12px]">
                <ColorField
                  value={stop.color}
                  showOpacity={false}
                  onChange={(color) => cambiar(index, { color })}
                />
              </div>
              <button
                type="button"
                title={stops.length <= 2 ? "Un degradado necesita al menos dos colores" : "Quitar"}
                aria-label="Quitar color"
                disabled={stops.length <= 2}
                onClick={() => quitar(index)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={agregar}
          className="mt-1 h-8 w-full text-[12px]"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Agregar color
        </Button>
      </div>
    </div>
  );
}

/**
 * El ajuste de la imagen o del video: los mismos dos campos para las dos, que
 * es lo que eran antes de separarse en dos ramas del panel.
 */
function AjusteFields({
  actual,
  setModo,
}: {
  actual: AppearanceValues;
  setModo: (key: AppearanceKey, value: string) => void;
}) {
  return (
    <>
      <ResponsiveField label="Tamaño">
        {(_, id) => (
          <Select
            value={actual.backgroundSize}
            onValueChange={(val) => setModo("backgroundSize", val)}
          >
            <SelectTrigger id={id} className="h-8 text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BACKGROUND_SIZES.map(({ value, label }) => (
                <SelectItem key={value} className="text-[12px]" value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </ResponsiveField>

      <ResponsiveField label="Posición">
        {(_, id) => (
          <Select
            value={actual.backgroundPosition}
            onValueChange={(val) => setModo("backgroundPosition", val)}
          >
            <SelectTrigger id={id} className="h-8 text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BACKGROUND_POSITIONS.map(({ value, label }) => (
                <SelectItem key={value} className="text-[12px]" value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </ResponsiveField>
    </>
  );
}

export function AppearanceSection({
  legacy,
  className,
  defaultOpen,
}: {
  /** Lo que el bloque pintaba de fondo antes de montar esta seccion. */
  legacy?: AppearanceLegacy;
  /** Para la primera seccion del panel: `border-t-0`. */
  className?: string;
  defaultOpen?: boolean;
}) {
  const {
    actions: { setProp },
    bag,
  } = useNode((node) => ({ bag: node.data.props as AppearanceProps }));

  return (
    <SettingsSection title="Apariencia" className={className} defaultOpen={defaultOpen}>
      <AppearanceFields
        bag={bag}
        write={(cambio) => setProp((props: Record<string, unknown>) => cambio(props))}
        legacy={legacy}
      />
    </SettingsSection>
  );
}

/**
 * Los campos de la seccion, sin la seccion ni el nodo: leen de `bag` y
 * escriben con `write`. Ver SpacingFields.
 */
export function AppearanceFields({
  bag,
  write: writeRaw,
  legacy,
  children,
}: {
  bag: AppearanceProps;
  write: (cambio: (p: Record<string, unknown>) => void) => void;
  legacy?: AppearanceLegacy;
  /** Campos propios de quien la usa, al final. */
  children?: ReactNode;
}) {
  const viewport = useViewport() ?? "desktop";
  const modo = BOX[viewport];
  const cascada = appearanceCascade(bag, legacy);
  // Lo que este modo acaba aplicando, sea suyo o heredado: es lo que hay que
  // enseñar, porque es lo que se ve en el lienzo.
  const actual = cascada[viewport];
  const gradientAngle = (bag.gradientAngle as number | undefined) ?? DEFAULT_GRADIENT_ANGLE;
  const gradientStops = (bag.gradientStops as GradientStop[] | undefined) ?? DEFAULT_GRADIENT_STOPS;

  /** Toda escritura del panel saca antes al bloque del fondo unico. */
  const write = (cambio: (p: Record<string, unknown>) => void) =>
    writeRaw((props) => {
      materializeAppearance(props, legacy);
      cambio(props);
    });

  /** Escribe una de las cinco en el modo que se esta viendo. */
  const setModo = (key: AppearanceKey, value: string) =>
    write((props) => {
      props[appearanceKeyOf(key, modo)] = value;
    });

  // Lo que le llegaria a este modo si no tuviera valor propio, para enseñarlo
  // de apoyo en el campo vacio. En escritorio no hay de quien heredar.
  const heredadoDe = (key: AppearanceKey) => {
    if (viewport === "desktop") return undefined;
    const padre = viewport === "mobile" ? cascada.tablet : cascada.desktop;
    return padre[key];
  };

  return (
    <div className="flex flex-col gap-3">
      <ResponsiveField label="Fondo">
        {() => (
          // Solo iconos: cuatro opciones con texto no caben en el ancho del
          // panel. El nombre va en title y aria-label, que es lo que leen
          // el tooltip nativo y el lector de pantalla.
          <div className="flex rounded-md border overflow-hidden">
            {BACKGROUND_TABS.map(({ type, label, Icon }) => (
              <button
                key={type}
                type="button"
                title={label}
                aria-label={label}
                aria-pressed={actual.backgroundType === type}
                className={`flex flex-1 items-center justify-center py-1.5 transition-colors ${actual.backgroundType === type
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
                  }`}
                onClick={() => setModo("backgroundType", type)}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        )}
      </ResponsiveField>

      {actual.backgroundType === "gradient" ? (
        <GradientSettings
          angle={gradientAngle}
          stops={gradientStops}
          onAngleChange={(angle) =>
            write((props) => {
              props.gradientAngle = angle;
            })
          }
          onStopsChange={(stops) =>
            write((props) => {
              props.gradientStops = stops;
            })
          }
        />
      ) : actual.backgroundType === "image" ? (
        <div className="flex flex-col gap-3">
          <ResponsiveField label="Imagen">
            {(_, id) => (
              <Input
                id={id}
                type="url"
                className="h-8 text-[12px] md:text-[12px]"
                // Vacio hereda, y el apoyo dice que es lo que se va a ver.
                placeholder={heredadoDe("backgroundImageUrl") || "https://ejemplo.com/imagen.jpg"}
                value={(bag[appearanceKeyOf("backgroundImageUrl", modo)] as string) ?? ""}
                onChange={(e) => setModo("backgroundImageUrl", e.target.value)}
              />
            )}
          </ResponsiveField>

          <AjusteFields actual={actual} setModo={setModo} />
        </div>
      ) : actual.backgroundType === "video" ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            {/* El video es el mismo en los tres modos, asi que no lleva el
                icono del modo: para quitarlo en el celular se le cambia ahi
                el tipo de fondo. */}
            <Label className="text-[11px] text-foreground/80">Video</Label>
            <Input
              type="url"
              className="h-8 text-[12px] md:text-[12px]"
              placeholder="https://ejemplo.com/video.mp4"
              value={(bag.backgroundVideoUrl as string) ?? ""}
              onChange={(e) =>
                write((props) => {
                  props.backgroundVideoUrl = e.target.value;
                })
              }
            />
            <p className="text-[11px] text-foreground/60">
              Usa un enlace directo a un archivo MP4 o WebM.
            </p>
          </div>

          <AjusteFields actual={actual} setModo={setModo} />
        </div>
      ) : (
        <ResponsiveField label="Color">
          {() => (
            <div className="[&_button]:h-8 [&_button]:text-[12px]">
              <ColorField
                value={actual.background}
                onChange={(val) => setModo("background", val)}
              />
            </div>
          )}
        </ResponsiveField>
      )}

      {children}
    </div>
  );
}
