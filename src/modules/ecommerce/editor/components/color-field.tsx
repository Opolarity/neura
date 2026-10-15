// Selector de color del editor, el unico que usan los paneles de propiedades.
// Vive aqui y no en components/ui porque esa carpeta es solo de shadcn.
//
// El color se escribe con un desplegable que cambia entre hexadecimal y RGB,
// y los numeros se editan a mano en campos separados.
//
// Lo que se guarda es siempre `rgba(r, g, b, a)`, en los dos modos: el
// desplegable cambia como se lee el color, no como se almacena. Asi el formato
// del contenido publicado no cambia y los componentes que leen colores siguen
// recibiendo lo de siempre.

import { useCallback, useMemo, useState } from "react"
import { RgbaColorPicker } from "react-colorful"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/shared/utils/utils"

interface Rgba {
  r: number
  g: number
  b: number
  a: number
}

/**
 * De donde parte el selector cuando el color no se puede usar: sin valor, en
 * blanco, invalido o transparente.
 *
 * Transparente entra aqui a proposito. Es un valor legitimo y muy comun como
 * punto de partida, pero su opacidad es cero, y arrancar la rueda en cero hace
 * que elegir un tono no se vea: el color cambia y la pantalla no. Partiendo de
 * blanco opaco, lo que se elige siempre se ve, y bajar la opacidad sigue
 * estando a un campo de distancia.
 */
const POR_DEFECTO: Rgba = { r: 255, g: 255, b: 255, a: 1 }

const HEX6 = /^[0-9a-f]{6}$/i
const HEX8 = /^[0-9a-f]{8}$/i
const HEX3 = /^[0-9a-f]{3}$/i

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

/** El color que hay que pintar, listo para la rueda y para los campos. */
export function parseColor(value: string | undefined): Rgba {
  if (!value) return POR_DEFECTO
  const texto = value.trim()
  if (!texto || texto.toLowerCase() === "transparent") return POR_DEFECTO

  const rgb = texto.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)$/i,
  )
  if (rgb) {
    return {
      r: clamp(parseInt(rgb[1]), 0, 255),
      g: clamp(parseInt(rgb[2]), 0, 255),
      b: clamp(parseInt(rgb[3]), 0, 255),
      a: rgb[4] !== undefined ? clamp(parseFloat(rgb[4]), 0, 1) : 1,
    }
  }

  const hex = hexToRgba(texto)
  return hex ?? POR_DEFECTO
}

/**
 * Lee un hexadecimal de 3, 6 u 8 digitos, con o sin almohadilla. Los 8 digitos
 * llevan la opacidad en los dos ultimos; devuelve `null` si no es ninguno de
 * los tres, que es la senal de entrada invalida.
 */
export function hexToRgba(texto: string): Rgba | null {
  const limpio = texto.trim().replace(/^#/, "")
  const seis = HEX3.test(limpio)
    ? limpio
        .split("")
        .map((c) => c + c)
        .join("")
    : limpio.slice(0, 6)

  if (!HEX6.test(seis)) return null
  if (!HEX3.test(limpio) && !HEX6.test(limpio) && !HEX8.test(limpio)) return null

  return {
    r: parseInt(seis.slice(0, 2), 16),
    g: parseInt(seis.slice(2, 4), 16),
    b: parseInt(seis.slice(4, 6), 16),
    // Los dos ultimos digitos son la opacidad, y solo en la forma de ocho.
    a: HEX8.test(limpio) ? parseInt(limpio.slice(6, 8), 16) / 255 : 1,
  }
}

const dosDigitos = (n: number) => n.toString(16).padStart(2, "0")

/** Los seis digitos del color, sin almohadilla y sin la opacidad. */
export function rgbaToHex6({ r, g, b }: Rgba) {
  return `${dosDigitos(r)}${dosDigitos(g)}${dosDigitos(b)}`
}

export function rgbaToString({ r, g, b, a }: Rgba) {
  return `rgba(${r}, ${g}, ${b}, ${Math.round(a * 100) / 100})`
}

type Modo = "hex" | "rgb"
type Campo = "hex" | "r" | "g" | "b" | "a"

export function ColorField({
  value,
  onChange,
  showOpacity = true,
}: {
  value: string | undefined
  onChange: (value: string) => void
  /**
   * Si el boton ensena el porcentaje de opacidad junto al color. Se apaga
   * donde la opacidad ya se ve por otro lado (el degradado la pinta) y el
   * numero solo estorba; el campo de opacidad dentro del selector sigue ahi.
   */
  showOpacity?: boolean
}) {
  const [modo, setModo] = useState<Modo>("hex")
  // Lo que se esta tecleando, y en que campo. Solo uno tiene el foco a la vez,
  // asi que basta con guardar ese: los demas siguen mostrando el color real.
  const [edicion, setEdicion] = useState<{ campo: Campo; texto: string } | null>(
    null,
  )

  const rgba = useMemo(() => parseColor(value), [value])
  const opacidad = Math.round(rgba.a * 100)

  const emitir = useCallback(
    (siguiente: Rgba) => onChange(rgbaToString(siguiente)),
    [onChange],
  )

  /**
   * Los campos se aplican al salir o con Enter, no mientras se teclea: hasta
   * entonces lo escrito puede estar a medias y no seria un color.
   *
   * Una entrada que no se entiende no cambia nada. Basta con soltar lo que se
   * estaba tecleando y el campo vuelve solo a lo ultimo valido, que es lo que
   * sigue guardado.
   */
  const aplicar = useCallback(
    (campo: Campo, texto: string) => {
      setEdicion(null)

      if (campo === "hex") {
        const leido = hexToRgba(texto)
        if (!leido) return
        // Pegar ocho digitos trae tambien la opacidad; con seis se respeta la
        // que ya tenia el color.
        const conOpacidad = HEX8.test(texto.trim().replace(/^#/, ""))
          ? leido.a
          : rgba.a
        emitir({ ...leido, a: conOpacidad })
        return
      }

      const numero = Number(texto.trim())
      if (texto.trim() === "" || Number.isNaN(numero)) return

      if (campo === "a") {
        emitir({ ...rgba, a: clamp(Math.round(numero), 0, 100) / 100 })
        return
      }
      emitir({ ...rgba, [campo]: clamp(Math.round(numero), 0, 255) })
    },
    [emitir, rgba],
  )

  // Lo que ensena cada campo: lo tecleado si tiene el foco, el color real si no.
  const textoDe = (campo: Campo, real: string) =>
    edicion && edicion.campo === campo ? edicion.texto : real

  const campoProps = (campo: Campo, real: string) => ({
    value: textoDe(campo, real),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setEdicion({ campo, texto: e.target.value }),
    onBlur: (e: React.FocusEvent<HTMLInputElement>) =>
      aplicar(campo, e.target.value),
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        e.currentTarget.blur()
      }
      // Escape descarta lo tecleado y devuelve el campo a lo que hay guardado.
      if (e.key === "Escape") {
        e.preventDefault()
        setEdicion(null)
      }
    },
    // Ancho base cero: el desplegable se ajusta a su contenido, y sin esto cada
    // campo pediria su ancho natural y lo estiraria de mas. Asi la fila se
    // reparte el ancho que marca la rueda, que es la pieza mas ancha.
    className:
      "h-8 w-0 min-w-0 flex-1 bg-transparent px-1 text-center text-[12px] tabular-nums outline-none",
  })

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-8 w-full items-center gap-2 rounded-md border border-input bg-background px-2 text-left"
        >
          <span
            className="relative block h-4 w-4 shrink-0 overflow-hidden rounded border border-input"
            style={
              // El damero de fondo deja ver la opacidad del color que lleva
              // encima; sin el, un color muy transparente parece blanco.
              rgba.a < 1
                ? {
                    backgroundImage:
                      "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
                    backgroundSize: "8px 8px",
                    backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
                  }
                : undefined
            }
          >
            <span
              className="block h-full w-full"
              style={{ backgroundColor: rgbaToString(rgba) }}
            />
          </span>
          {/* El boton ensena el color con el que trabaja el selector, no el
              texto crudo que haya guardado. Un contenedor recien puesto nace en
              "transparent", que no es un color que se pueda ensenar ni editar:
              ahi el selector parte de blanco opaco, y el boton tiene que decir
              lo mismo que van a decir la rueda y los campos al abrirse. */}
          <span className="truncate text-[12px] text-muted-foreground tabular-nums">
            {`#${rgbaToHex6(rgba)}`}
            {showOpacity && opacidad < 100 ? ` ${opacidad}%` : ""}
          </span>
        </button>
      </PopoverTrigger>

      {/* Ancho fijo, y no ajustado al contenido: en modo RGB la fila de abajo
          son tres campos mas la opacidad, y con el ancho de la rueda —200— se
          quedan tan estrechos que no se lee lo que ponen. */}
      <PopoverContent className="w-[288px] p-3" align="start">
        {/* La rueda se estira a lo ancho pero conserva su altura. El area
            grande de arriba no tiene altura propia: ocupa lo que sobra bajo las
            dos barras, asi que quitarsela la aplasta. */}
        <div className="[&_.react-colorful]:w-full">
          <RgbaColorPicker color={rgba} onChange={emitir} />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Select value={modo} onValueChange={(v) => setModo(v as Modo)}>
            <SelectTrigger className="h-8 w-[64px] shrink-0 px-2 text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem className="text-[12px]" value="hex">Hex</SelectItem>
              <SelectItem className="text-[12px]" value="rgb">RGB</SelectItem>
            </SelectContent>
          </Select>

          {/* Un solo recuadro con los campos dentro, separados por lineas: el
              color y su opacidad se leen como una sola medida. */}
          <div className="flex h-8 min-w-0 flex-1 items-center rounded-md border border-input">
            {modo === "hex" ? (
              <input
                aria-label="Color en hexadecimal"
                spellCheck={false}
                {...campoProps("hex", rgbaToHex6(rgba))}
              />
            ) : (
              <>
                <input aria-label="Rojo" inputMode="numeric" {...campoProps("r", String(rgba.r))} />
                <input
                  aria-label="Verde"
                  inputMode="numeric"
                  {...campoProps("g", String(rgba.g))}
                  className={cn(campoProps("g", "").className, "border-l border-input")}
                />
                <input
                  aria-label="Azul"
                  inputMode="numeric"
                  {...campoProps("b", String(rgba.b))}
                  className={cn(campoProps("b", "").className, "border-l border-input")}
                />
              </>
            )}

            <input
              aria-label="Opacidad"
              inputMode="numeric"
              {...campoProps("a", String(opacidad))}
              className={cn(
                campoProps("a", "").className,
                "w-10 flex-none border-l border-input pr-0 text-right",
              )}
            />
            <span className="px-1.5 text-[12px] text-muted-foreground">%</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
