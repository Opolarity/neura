/**
 * Lee un archivo y devuelve su contenido en base64 PURO (sin el prefijo data
 * URI). Es como viajan los adjuntos hacia la API de soporte, tanto al crear una
 * solicitud como al responder en el hilo.
 */
export const readFileAsBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Quitar el prefijo data URI: la API acepta base64 puro
      resolve(result.substring(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error(`No se pudo leer "${file.name}"`));
    reader.readAsDataURL(file);
  });
