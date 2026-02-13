import { supabase } from "@/integrations/supabase/client";
import type { Medio } from "../types/medios.types";

export const getMedios = async (): Promise<Medio[]> => {
  const { data, error } = await supabase
    .from("visual_edits_medios" as any)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as any) ?? [];
};

export const uploadMedio = async (file: File): Promise<Medio> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const uuid = crypto.randomUUID();
  const ext = file.name.split(".").pop();
  const storagePath = `medios/${uuid}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("ecommerce")
    .upload(storagePath, file);

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from("ecommerce")
    .getPublicUrl(storagePath);

  const publicUrl = urlData.publicUrl;

  const { data, error } = await supabase
    .from("visual_edits_medios" as any)
    .insert({
      name: file.name,
      url: publicUrl,
      mimetype: file.type,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as any;
};

export const deleteMedio = async (medio: Medio): Promise<void> => {
  // Extract storage path from URL
  const urlParts = medio.url.split("/ecommerce/");
  if (urlParts.length > 1) {
    const storagePath = urlParts[urlParts.length - 1];
    await supabase.storage.from("ecommerce").remove([storagePath]);
  }

  const { error } = await supabase
    .from("visual_edits_medios" as any)
    .delete()
    .eq("id", medio.id);

  if (error) throw error;
};
