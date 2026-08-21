import { useEffect, useRef } from "react";

// Sprites: oso polar (white) de vscode-pets (github.com/tonybaloney/vscode-pets), MIT License.
const WALK_SRC = "/images/pets/bear-walk.gif";
const IDLE_SRC = "/images/pets/bear-idle.gif";

export type WalkingBearProps = {
  /** alto del sprite en px */
  height?: number;
  className?: string;
};

export default function WalkingBear({ height = 64, className }: WalkingBearProps) {
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
      const src = on ? WALK_SRC : IDLE_SRC;
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
        x += dir * 36 * dt;
        const maxX = Math.max(0, width - imgW());
        if (x <= 0) {
          x = 0;
          dir = 1;
          setWalking(false);
          holdUntil = now + (1500 + Math.random() * 2500);
        } else if (x >= maxX) {
          x = maxX;
          dir = -1;
          setWalking(false);
          holdUntil = now + (1500 + Math.random() * 2500);
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
  }, [height]);

  return (
    <div
      ref={hostRef}
      className={className}
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
