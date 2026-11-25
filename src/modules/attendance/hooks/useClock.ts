import { useEffect, useState } from "react";

/** La hora actual (ISO) actualizada cada segundo, para mostrar un reloj. */
export const useClock = () => {
  const [now, setNow] = useState(() => new Date().toISOString());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date().toISOString()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
};
