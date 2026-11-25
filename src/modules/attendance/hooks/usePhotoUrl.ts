import { useEffect, useState } from "react";
import { getPhotoUrlApi } from "../services/attendance.service";

/** URL firmada (30 min) de una foto del bucket privado; null mientras carga o si no hay. */
export const usePhotoUrl = (path: string | null) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    setUrl(null);
    if (path) {
      void getPhotoUrlApi(path).then((u) => {
        if (vigente) setUrl(u);
      });
    }
    return () => {
      vigente = false;
    };
  }, [path]);

  return url;
};
