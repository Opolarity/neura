import { useEffect, useRef } from "react";

import { cn } from "@/shared/utils/utils";

// Sprites: oso polar pixel-art propio (97x64, alineado abajo-centro, mirando a la derecha).
const WALK_SRC = "/images/pets/bear-walk-v3.gif";
// Al llegar a cada extremo el oso ataca y se cae; se queda tumbado hasta reanudar la caminata.
const ATTACK_SRC = "/images/pets/bear-attack-v2.gif";

export type WalkingBearProps = {
  /** alto del sprite en px */
  height?: number;
  /** recorrido maximo en px; si el contenedor es mas angosto, manda el contenedor */
  maxTravel?: number;
  className?: string;
};

export default function WalkingBear({ height = 64, maxTravel = 200, className }: WalkingBearProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    const img = imgRef.current;
    if (!host || !img) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let width = host.clientWidth || 320;
    let dir: 1 | -1 = 1;
    let x = 0;
    let walking = true;
    let holdUntil = 0;
    let raf = 0;
    let last = performance.now();

    const imgW = () => img.getBoundingClientRect().width || height;

    const setWalking = (on: boolean) => {
      walking = on;
      const src = on ? WALK_SRC : ATTACK_SRC;
      if (!img.src.endsWith(src)) img.src = src;
    };

    const onResize = () => {
      width = host.clientWidth || width;
    };
    window.addEventListener("resize", onResize);

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      width = host.clientWidth || width;

      if (walking) {
        x += dir * 18 * dt;
        const maxX = Math.min(maxTravel, Math.max(0, width - imgW()));
        if (x <= 0) {
          x = 0;
          dir = 1;
          setWalking(false);
          holdUntil = now + (2500 + Math.random() * 2500);
        } else if (x >= maxX) {
          x = maxX;
          dir = -1;
          setWalking(false);
          holdUntil = now + (2500 + Math.random() * 2500);
        }
      } else if (now >= holdUntil) {
        setWalking(true);
      }

      img.style.transform = `translateX(${x.toFixed(1)}px) scaleX(${dir === -1 ? -1 : 1})`;
    };

    setWalking(true);
    if (reduced) {
      img.style.transform = `translateX(${Math.max(0, width / 2 - imgW() / 2).toFixed(0)}px)`;
    } else {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [height, maxTravel]);

  return (
    <div
      ref={hostRef}
      // Solo escritorio: en movil y tablet (<1024px) el oso no se muestra.
      className={cn("hidden lg:block", className)}
      // flexShrink 0: dentro de un flex-col con alto acotado (paginas con tabla
      // llena) el contenedor se comprimia y recortaba al oso por arriba.
      style={{ position: "relative", height, flexShrink: 0, overflow: "hidden" }}
      aria-hidden="true"
    >
      <img
        ref={imgRef}
        alt=""
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          height,
          width: "auto",
          imageRendering: "pixelated",
          willChange: "transform",
        }}
      />
    </div>
  );
}
