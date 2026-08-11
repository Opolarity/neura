import { supabase } from "@/integrations/supabase/client";

export const getParameter = async (name: string): Promise<string> => {
  const { data } = await supabase
    .from("parameters")
    .select("value")
    .eq("name", name)
    .maybeSingle();
  return data?.value || "";
};

export const getParameters = async (
  names: string[],
): Promise<Record<string, string>> => {
  const { data } = await supabase
    .from("parameters")
    .select("name, value")
    .in("name", names);
  const result: Record<string, string> = {};
  for (const name of names) result[name] = "";
  for (const row of data || []) result[row.name] = row.value || "";
  return result;
};

export interface ParameterRow {
  id: number;
  name: string;
  value: string;
}

export const getAllParameters = async (): Promise<ParameterRow[]> => {
  const { data, error } = await supabase
    .from("parameters")
    .select("id, name, value")
    .order("name");

  if (error) throw error;
  return (data as ParameterRow[]) ?? [];
};

/**
 * Guarda un conjunto de parámetros por nombre. La tabla no tiene unique
 * constraint en `name`, así que no se puede usar upsert: se consulta primero
 * qué nombres existen, se actualizan esos y se insertan los nuevos.
 */
export const saveParameters = async (
  entries: Record<string, string>,
): Promise<void> => {
  const names = Object.keys(entries);
  if (names.length === 0) return;

  const { data: existing, error: selectError } = await supabase
    .from("parameters")
    .select("id, name")
    .in("name", names);

  if (selectError) throw selectError;

  const existingByName = new Map<string, number>();
  for (const row of existing || []) existingByName.set(row.name, row.id);

  for (const name of names) {
    const id = existingByName.get(name);
    if (id === undefined) continue;
    const { error } = await supabase
      .from("parameters")
      .update({ value: entries[name] })
      .eq("id", id);
    if (error) throw error;
  }

  const toInsert = names
    .filter((name) => !existingByName.has(name))
    .map((name) => ({ name, value: entries[name] }));

  if (toInsert.length > 0) {
    const { error } = await supabase.from("parameters").insert(toInsert);
    if (error) throw error;
  }
};

export const deleteParameter = async (id: number): Promise<void> => {
  const { error } = await supabase.from("parameters").delete().eq("id", id);
  if (error) throw error;
};

export const uploadInvoiceLogo = async (file: File): Promise<string> => {
  const uuid = crypto.randomUUID();
  const ext = file.name.split(".").pop();
  const storagePath = `branding/${uuid}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("sales")
    .upload(storagePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("sales").getPublicUrl(storagePath);
  return data.publicUrl;
};
