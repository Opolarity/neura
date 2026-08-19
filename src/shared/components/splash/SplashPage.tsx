import { useEffect } from "react"
import LoaderContent from "@/shared/components/loader/LoaderContent"

interface SplashPageProps {
  message?: string
}

// Loader de arranque: es el único a pantalla completa, porque mientras se
// resuelven sesión y permisos todavía no hay sidebar ni header que mostrar.
// El mensaje se pasa por prop (lo pinta LoaderContent); sin prop cae en el
// "Cargando..." por defecto.
export default function SplashPage({ message }: SplashPageProps) {
  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = original
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <LoaderContent message={message} />
    </div>
  )
}
