export const fontFamilyMap = {
  sans: "var(--font-inter)",
  mono: "var(--font-space-grotesk)",
  display: "var(--font-bebas-neue)",
  "open-sans": "var(--font-open-sans)",
} as const

export type FontFamily = keyof typeof fontFamilyMap

/**
 * Los pesos que trae cada fuente.
 *
 * No son los nueve de Tailwind para todas: salen de los datos de next/font, que
 * es de donde el proyecto las carga (ver app/layout.tsx). Bebas Neue existe en
 * un solo peso, y las otras tres no llegan a los dos extremos. Ofrecer un peso
 * que la fuente no tiene no da error: el navegador lo finge estirando el trazo,
 * o simplemente no cambia nada, y en el editor parece que el control no
 * responde.
 */
export const fontWeightsByFamily: Record<FontFamily, number[]> = {
  // Inter
  sans: [100, 200, 300, 400, 500, 600, 700, 800, 900],
  // Space Grotesk
  mono: [300, 400, 500, 600, 700],
  // Bebas Neue
  display: [400],
  "open-sans": [300, 400, 500, 600, 700, 800],
}

/** Como se lee cada peso en el panel. */
export const fontWeightLabels: Record<number, string> = {
  100: "Muy fino",
  200: "Fino",
  300: "Ligero",
  400: "Normal",
  500: "Medio",
  600: "Seminegrita",
  700: "Negrita",
  800: "Extra negrita",
  900: "Muy negrita",
}

/**
 * El peso mas parecido de entre los que la fuente admite. Se usa al cambiar de
 * fuente: pasar de una con nueve pesos a otra con uno dejaria guardado un peso
 * que esa fuente no sabe pintar.
 */
export function nearestFontWeight(peso: number, disponibles: number[]) {
  return disponibles.reduce((a, b) =>
    Math.abs(b - peso) < Math.abs(a - peso) ? b : a,
  )
}

// Solo el nombre de la fuente: para que sirve cada una es cosa de quien diseña,
// y el parentesis se quedaba corto en el ancho del desplegable del panel.
export const fontFamilyOptions: { value: FontFamily; label: string }[] = [
  { value: "mono", label: "Space Grotesk" },
  { value: "sans", label: "Inter" },
  { value: "display", label: "Bebas Neue" },
  { value: "open-sans", label: "Open Sans" },
]
