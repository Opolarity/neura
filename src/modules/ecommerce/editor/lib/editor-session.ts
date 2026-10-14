// Respaldo local de cambios sin guardar del editor.
//
// En el ecommerce este archivo también refrescaba y cortaba la cookie
// editor_session (aviso a los 15 min, cierre a los 20). En el ERP no hay sesión
// propia del editor: vale la del ERP, así que solo queda el respaldo.
import { getEditorChannelId } from "@/modules/ecommerce/editor/lib/editor-channel"

export interface EditorBackup {
  json: string
  savedAt: number
}

// Con el canal en la clave: en el ERP el mismo navegador puede editar varios
// canales (minorista y mayorista), y todos tienen un "home".
function backupKey(slug: string): string {
  return `editor-backup:${getEditorChannelId() ?? "sin-canal"}:${slug}`
}

export function writeEditorBackup(slug: string, json: string): void {
  try {
    const backup: EditorBackup = { json, savedAt: Date.now() }
    window.localStorage.setItem(backupKey(slug), JSON.stringify(backup))
  } catch {
    // localStorage no disponible o cuota llena: no hay nada que hacer
  }
}

export function readEditorBackup(slug: string): EditorBackup | null {
  try {
    const raw = window.localStorage.getItem(backupKey(slug))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.json === "string" &&
      typeof parsed.savedAt === "number"
    ) {
      return parsed as EditorBackup
    }
    return null
  } catch {
    return null
  }
}

export function clearEditorBackup(slug: string): void {
  try {
    window.localStorage.removeItem(backupKey(slug))
  } catch {
    // ignorar
  }
}
