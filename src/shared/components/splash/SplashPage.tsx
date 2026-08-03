import { Loader2 } from "lucide-react"
import { useEffect } from "react"

export default function SplashPage() {
  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = original
    }
  }, [])

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Cargando...</p>
      </div>
    </div>
  )
}
