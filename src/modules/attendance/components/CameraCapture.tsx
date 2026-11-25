import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { CameraOff } from "lucide-react";
import { cn } from "@/shared/utils/utils";

export interface CameraCaptureHandle {
  /** Foto actual como data URL JPEG (lado mayor 640 px), o null si no hay cámara. */
  capture: () => string | null;
}

interface CameraCaptureProps {
  className?: string;
  /** Avisa si la cámara está lista (para habilitar el botón de marcar). */
  onReadyChange?: (ready: boolean) => void;
}

/**
 * Vista previa de la cámara frontal para la foto de cada marca. La foto se
 * toma recién al marcar (capture), no se guarda nada en el navegador.
 */
export const CameraCapture = forwardRef<CameraCaptureHandle, CameraCaptureProps>(
  ({ className, onReadyChange }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
      let stream: MediaStream | null = null;
      let cancelado = false;
      const start = async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError("Este navegador no permite usar la cámara");
          return;
        }
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
            audio: false,
          });
          if (cancelado) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play().catch(() => undefined);
          }
          setReady(true);
        } catch {
          setError("Permite el acceso a la cámara para marcar");
        }
      };
      void start();
      return () => {
        cancelado = true;
        stream?.getTracks().forEach((t) => t.stop());
      };
    }, []);

    useEffect(() => {
      onReadyChange?.(ready);
    }, [ready, onReadyChange]);

    useImperativeHandle(ref, () => ({
      capture: () => {
        const video = videoRef.current;
        if (!video || !ready || !video.videoWidth) return null;
        const scale = Math.min(1, 640 / Math.max(video.videoWidth, video.videoHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/jpeg", 0.75);
      },
    }));

    return (
      <div className={cn("relative overflow-hidden rounded-lg border bg-muted aspect-[4/3]", className)}>
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
            <CameraOff className="w-8 h-8" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : (
          // Espejado: la persona se ve como en un espejo; la foto se guarda sin espejar.
          <video ref={videoRef} muted playsInline className="h-full w-full object-cover -scale-x-100" />
        )}
      </div>
    );
  },
);
CameraCapture.displayName = "CameraCapture";
