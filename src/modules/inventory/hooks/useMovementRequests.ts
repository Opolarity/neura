import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MovementRequestListItem } from "../types/MovementRequestList.types";
import { getUserWarehouse } from "../services/Movements.service";
import { getUserWarehouseAdapter } from "../adapters/Movements.adapter";

export const useMovementRequests = () => {
  const [requests, setRequests] = useState<MovementRequestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userWarehouseId, setUserWarehouseId] = useState<number | null>(null);
  const { toast } = useToast();

  const loadRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("stock_movement_requests")
        .select(`
          id,
          created_by,
          out_warehouse_id,
          in_warehouse_id,
          created_at,
          updated_at,
          out_warehouse:warehouses!stock_movement_requests_out_warehouse_id_fkey(name),
          in_warehouse:warehouses!stock_movement_requests_in_warehouse_id_fkey(name),
          stock_movement_request_situations!inner(
            status_id,
            situation_id,
            message,
            last_row,
            warehouse_id,
            statuses(name),
            situations(name),
            situation_warehouse:warehouses!stock_movement_request_situations_warehouse_id_fkey(name)
          )
        `)
        .eq("stock_movement_request_situations.last_row", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped: MovementRequestListItem[] = (data || []).map((r: any) => {
        const situation = r.stock_movement_request_situations?.[0];
        return {
          id: r.id,
          createdBy: r.created_by,
          outWarehouseName: r.out_warehouse?.name ?? "—",
          inWarehouseName: r.in_warehouse?.name ?? "—",
          situationName: situation?.situations?.name ?? "—",
          lastMessageWarehouseId: situation?.warehouse_id ?? null,
          lastMessageWarehouseName: situation?.situation_warehouse?.name ?? null,
          message: situation?.message ?? null,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        };
      });

      setRequests(mapped);
    } catch (error: any) {
      console.error("Error loading movement requests:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las solicitudes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const userRes = await getUserWarehouse();
        const userAdp = getUserWarehouseAdapter(userRes);
        setUserWarehouseId(userAdp.warehouse_id);
      } catch (e) {
        console.error("Error loading user warehouse:", e);
      }
      loadRequests();
    };
    init();
  }, []);

  return { requests, loading, userWarehouseId, reload: loadRequests };
};
