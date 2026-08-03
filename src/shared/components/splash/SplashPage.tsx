import { useEffect } from "react"
import SplashImage from "@/assets/splash-image.png"

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
      <img className="aspect-square w-3/5 max-w-[180px] min-w-[64px]" src={SplashImage} alt="image-splash.png" />
    </div>
  )
}
