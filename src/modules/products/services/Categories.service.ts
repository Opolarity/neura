import { supabase } from "@/integrations/supabase/client";
import { Category } from "../types/Categories.type";

export const categoriesData = async () => {
  const { data, error } = await supabase.functions.invoke('get-categories-product-count');
            
  if (error) throw error;
  return data ?? [];
}