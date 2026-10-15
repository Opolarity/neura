import { invokeFunction } from "@/integrations/supabase/invokeFunction";
import type { LearningTutorialsApiResponse } from "../types/Learning.types";

/**
 * Tutoriales en video publicados por OPOLARITY para este ERP. El tipo de ERP
 * lo fija la edge function puente; aquí se piden todos de una vez (son pocos)
 * y la pantalla filtra en el cliente.
 */
export const getLearningTutorials = async (): Promise<LearningTutorialsApiResponse> =>
  invokeFunction<LearningTutorialsApiResponse>("get-learning-tutorials", {
    method: "POST",
    networkMessage:
      "No se pudo conectar con el servicio de tutoriales. Revisa tu conexión e intenta nuevamente.",
    body: {},
  });
