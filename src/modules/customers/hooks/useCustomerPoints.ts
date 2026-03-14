import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CustomerPoint {
  id: number;
  points: number | null;
  ordersQuantity: number;
  fullName: string;
  documentNumber: string;
  documentType: string;
  customerSince: string;
}

export const useCustomerPoints = () => {
  const [data, setData] = useState<CustomerPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: rows, error } = await supabase
        .from("customer_profile")
        .select(`
          id,
          points,
          orders_quantity,
          accounts!inner(
            name,
            middle_name,
            last_name,
            last_name2,
            document_number,
            created_at,
            document_types(name)
          )
        `)
        .order("points", { ascending: false });

      if (!error && rows) {
        const mapped: CustomerPoint[] = rows.map((row: any) => {
          const acc = row.accounts ?? {};
          const parts = [acc.name, acc.middle_name, acc.last_name, acc.last_name2]
            .filter(Boolean)
            .join(" ");
          return {
            id: row.id,
            points: row.points,
            ordersQuantity: row.orders_quantity ?? 0,
            fullName: parts || "—",
            documentNumber: acc.document_number ?? "—",
            documentType: acc.document_types?.name ?? "—",
            customerSince: acc.created_at ?? "",
          };
        });
        setData(mapped);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const term = search.toLowerCase();
    return data.filter(
      (c) =>
        c.fullName.toLowerCase().includes(term) ||
        c.documentNumber.toLowerCase().includes(term)
    );
  }, [data, search]);

  return { data: filtered, loading, search, setSearch };
};
