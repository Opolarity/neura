// El catalogo completo de iconos de FontAwesome (solid + brands, ~515 KB gz).
//
// Solo lo importan el panel del Icono (el buscador, editable-icon-settings.tsx)
// y lib/icon-loader.ts, que lo pide aparte la primera vez que el lienzo pinta un
// icono. El chunk del editor no lo lleva.

import type { IconDefinition } from "@fortawesome/fontawesome-svg-core"
import * as solidIcons from "@fortawesome/free-solid-svg-icons"
import * as brandIcons from "@fortawesome/free-brands-svg-icons"
import { DEFAULT_ICON_KEY } from "@/modules/ecommerce/editor/lib/icon-loader"

export type IconSet = "brands" | "solid" | "all"

export type IconOption = {
  key: string
  label: string
  icon: IconDefinition
  set: Exclude<IconSet, "all">
}

const LEGACY_ICON_MAP: Record<string, string> = {
  Star: "fas:star",
  star: "fas:star",
  Heart: "fas:heart",
  heart: "fas:heart",
  ShoppingCart: "fas:cart-shopping",
  shoppingCart: "fas:cart-shopping",
  Search: "fas:magnifying-glass",
  search: "fas:magnifying-glass",
  Home: "fas:house",
  home: "fas:house",
  User: "fas:user",
  user: "fas:user",
  Users: "fas:users",
  users: "fas:users",
  Phone: "fas:phone",
  phone: "fas:phone",
  Mail: "fas:envelope",
  mail: "fas:envelope",
  MapPin: "fas:map-pin",
  mapPin: "fas:map-pin",
  Settings: "fas:gear",
  settings: "fas:gear",
  Check: "fas:check",
  check: "fas:check",
  X: "fas:xmark",
  x: "fas:xmark",
  Plus: "fas:plus",
  plus: "fas:plus",
  Info: "fas:circle-info",
  info: "fas:circle-info",
  Link: "fas:link",
  link: "fas:link",
  ExternalLink: "fas:arrow-up-right-from-square",
  externalLink: "fas:arrow-up-right-from-square",
  Tag: "fas:tag",
  tag: "fas:tag",
  Gift: "fas:gift",
  gift: "fas:gift",
  Truck: "fas:truck",
  truck: "fas:truck",
  Facebook: "fab:facebook",
  facebook: "fab:facebook",
  Instagram: "fab:instagram",
  instagram: "fab:instagram",
  Twitter: "fab:twitter",
  twitter: "fab:twitter",
  Linkedin: "fab:linkedin",
  linkedin: "fab:linkedin",
  Github: "fab:github",
  github: "fab:github",
  Youtube: "fab:youtube",
  youtube: "fab:youtube",
}

function isIconDefinition(value: unknown): value is IconDefinition {
  return Boolean(
    value &&
      typeof value === "object" &&
      "iconName" in value &&
      "prefix" in value
  )
}

function formatIconLabel(name: string): string {
  return name
    .replace(/-/g, " ")
    .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase())
}

function buildIconOptions(
  list: IconDefinition[],
  set: Exclude<IconSet, "all">
): IconOption[] {
  const seen = new Set<string>()
  const result: IconOption[] = []
  list.forEach((icon) => {
    const key = `${icon.prefix}:${icon.iconName}`
    if (seen.has(key)) return
    seen.add(key)
    result.push({
      key,
      label: formatIconLabel(icon.iconName),
      icon,
      set,
    })
  })
  return result
}

const BRAND_ICON_DEFS = Object.values(brandIcons).filter(isIconDefinition)
const SOLID_ICON_DEFS = Object.values(solidIcons).filter(isIconDefinition)

export const BRAND_OPTIONS = buildIconOptions(BRAND_ICON_DEFS, "brands")
export const SOLID_OPTIONS = buildIconOptions(SOLID_ICON_DEFS, "solid")
export const ALL_OPTIONS = [...BRAND_OPTIONS, ...SOLID_OPTIONS].sort((a, b) =>
  a.label.localeCompare(b.label)
)

export const ICON_BY_KEY = new Map(ALL_OPTIONS.map((option) => [option.key, option]))

export function normalizeIconKey(raw?: string): string {
  if (!raw) return DEFAULT_ICON_KEY
  if (ICON_BY_KEY.has(raw)) return raw

  const mapped = LEGACY_ICON_MAP[raw]
  if (mapped && ICON_BY_KEY.has(mapped)) return mapped

  const normalized = raw.toLowerCase().replace(/\s+/g, "-")
  const direct = ALL_OPTIONS.find((option) => option.icon.iconName === normalized)
  if (direct) return direct.key

  return DEFAULT_ICON_KEY
}
