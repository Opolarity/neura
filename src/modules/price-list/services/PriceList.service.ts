import { supabase } from "@/integrations/supabase/client";
import type { PriceListItem } from "../types/PriceList.types";

export const getPriceLists = async (): Promise<PriceListItem[]> => {
  const { data, error } = await supabase
    .from("price_list")
    .select("*")
    .order("id", { ascending: true });

  if (error) throw error;
  return data as PriceListItem[];
};
