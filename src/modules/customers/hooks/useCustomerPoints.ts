import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { toast } from "sonner";

export interface CustomerPoint {
  id: number;
  points: number | null;
  ordersQuantity: number;
  fullName: string;
  documentNumber: string;
  documentType: string;
  customerSince: string;
  email: string | null;
}

export const useCustomerPoints = () => {
  const [data, setData] = useState<CustomerPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: 0,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const from = (pagination.p_page - 1) * pagination.p_size;
      const to = from + pagination.p_size - 1;

      let query = supabase
        .from("customer_profile")
        .select(
          `
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
            email,
            document_types(name)
          )
        `,
          { count: "exact" }
        )
        .order("points", { ascending: false })
        .range(from, to);

      if (search.trim()) {
        query = query.or(
          `name.ilike.%${search}%,last_name.ilike.%${search}%,document_number.ilike.%${search}%`,
          { foreignTable: "accounts" }
        );
      }

      const { data: rows, error, count } = await query;

      if (error) throw error;

      const mapped: CustomerPoint[] = (rows ?? []).map((row: any) => {
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
          email: acc.email ?? null,
        };
      });

      setData(mapped);
      setPagination((prev) => ({ ...prev, total: count ?? 0 }));
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar puntos de clientes");
    } finally {
      setLoading(false);
    }
  }, [pagination.p_page, pagination.p_size, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPagination((prev) => ({ ...prev, p_page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, p_page: page }));
  };

  const handlePageSizeChange = (size: number) => {
    setPagination((prev) => ({ ...prev, p_size: size, p_page: 1 }));
  };

  return {
    data,
    loading,
    search,
    pagination,
    handleSearchChange,
    handlePageChange,
    handlePageSizeChange,
    reload: fetchData,
  };
};
