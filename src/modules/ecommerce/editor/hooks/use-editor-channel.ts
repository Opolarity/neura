import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { setEditorChannelId } from "@/modules/ecommerce/editor/lib/editor-channel";

export interface EditorChannel {
  id: number;
  name: string;
  url: string;
  code: string;
}

// Solo los canales con url: son las tiendas (los de CRM y chatbot no tienen
// páginas que editar).
async function getCanalesDeTienda(): Promise<EditorChannel[]> {
  const { data, error } = await supabase
    .from("channels")
    .select("id, name, url, code")
    .not("url", "is", null)
    .order("id");
  if (error) throw error;
  return (data ?? []) as EditorChannel[];
}

type EstadoCanales = "cargando" | "listo" | "sin-canales" | "error";

/**
 * Canal del ecommerce que se está editando: el de `?canal=` si existe, y si no
 * el primero. La lista son los canales de `channels` con url (las tiendas).
 */
export function useEditorChannel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [canales, setCanales] = useState<EditorChannel[]>([]);
  const [estado, setEstado] = useState<EstadoCanales>("cargando");

  useEffect(() => {
    let vigente = true;
    getCanalesDeTienda()
      .then((lista) => {
        if (!vigente) return;
        setCanales(lista);
        setEstado(lista.length > 0 ? "listo" : "sin-canales");
      })
      .catch(() => {
        if (vigente) setEstado("error");
      });
    return () => {
      vigente = false;
    };
  }, []);

  const pedido = Number(searchParams.get("canal"));
  const canal = canales.find((c) => c.id === pedido) ?? canales[0] ?? null;

  // Se fija durante el render y no en un efecto: los efectos de los hijos (la
  // carga de la página, el listado) corren ANTES que los del padre, y leerían
  // el canal anterior. Es una asignación idempotente a un valor de módulo.
  setEditorChannelId(canal?.id ?? null, canal?.code ?? null);

  const cambiarCanal = (id: number) => {
    setSearchParams((previo) => {
      const siguiente = new URLSearchParams(previo);
      siguiente.set("canal", String(id));
      siguiente.delete("page");
      return siguiente;
    });
  };

  return { canal, canales, estado, cambiarCanal };
}
