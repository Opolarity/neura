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
