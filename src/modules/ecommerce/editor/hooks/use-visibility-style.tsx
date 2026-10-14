import { useId } from "react"
import { useEditor } from "@craftjs/core"

interface UseVisibilityStyleOptions {
  hiddenOnDesktop?: boolean
  hiddenOnTablet?: boolean
  hiddenOnMobile?: boolean
}

interface UseVisibilityStyleResult {
  visClass: string
  visibilityJsx: React.ReactNode
}

export function useVisibilityStyle({
  hiddenOnDesktop = false,
  hiddenOnTablet = false,
  hiddenOnMobile = false,
}: UseVisibilityStyleOptions): UseVisibilityStyleResult {
  const rawId = useId()
  const visClass = `vis-ctrl-${rawId.replace(/:/g, "")}`

  const { enabled } = useEditor((state) => ({
    enabled: state.options.enabled,
  }))

  if (enabled || (!hiddenOnDesktop && !hiddenOnTablet && !hiddenOnMobile)) {
    return { visClass, visibilityJsx: null }
  }

  const rules: string[] = []

  if (hiddenOnMobile) {
    rules.push(`@media (max-width: 767px) { .${visClass} { display: none !important; } }`)
  }
  if (hiddenOnTablet) {
    rules.push(`@media (min-width: 768px) and (max-width: 1023px) { .${visClass} { display: none !important; } }`)
  }
  if (hiddenOnDesktop) {
    rules.push(`@media (min-width: 1024px) { .${visClass} { display: none !important; } }`)
  }

  const visibilityJsx = <style>{rules.join("\n")}</style>

  return { visClass, visibilityJsx }
}
