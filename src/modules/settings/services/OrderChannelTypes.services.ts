import { supabase } from "@/integrations/supabase/client";
import { OrderChannelType, OrderChannelTypesFilters, CreateOrderChannelPayload, UpdateOrderChannelPayload } from "../types/OrderChannelTypes.types";

export const GetOrderChannelTypes = async (
    filters: OrderChannelTypesFilters
): Promise<{ data: OrderChannelType[]; count: number }> => {
    const from = (filters.page - 1) * filters.size;
    const to = from + filters.size - 1;

    let query = supabase
        .from("sale_types")
        .select("*", { count: "exact" })
        .eq("is_active", true)
        .order("id", { ascending: true })
        .range(from, to);

    if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return { data: data ?? [], count: count ?? 0 };
};

export const GetOrderChannelTypeDetails = async (id: number): Promise<{
    saleType: OrderChannelType;
    paymentMethodIds: number[];
    warehouseIds: number[];
}> => {
    const [saleTypeRes, paymentMethodsRes, warehousesRes] = await Promise.all([
        supabase.from("sale_types").select("*").eq("id", id).single(),
        supabase.from("payment_method_sale_type").select("payment_method_id").eq("sale_type_id", id),
        supabase.from("sale_type_warehouses").select("warehouse_id").eq("sale_type_id", id),
    ]);

    if (saleTypeRes.error) throw saleTypeRes.error;

    return {
        saleType: saleTypeRes.data as OrderChannelType,
        paymentMethodIds: (paymentMethodsRes.data ?? []).map((r: any) => r.payment_method_id),
        warehouseIds: (warehousesRes.data ?? []).map((r: any) => r.warehouse_id),
    };
};

export const CreateSaleType = async (payload: CreateOrderChannelPayload): Promise<OrderChannelType> => {
    const { data, error } = await supabase
        .from("sale_types")
        .insert({
            name: payload.name,
            code: payload.code,
            factura_serie_id: payload.factura_serie_id,
            boleta_serie_id: payload.boleta_serie_id,
            business_acount_id: payload.business_acount_id ?? null,
            pos_sale_type: payload.pos_sale_type,
            is_active: payload.is_active,
        })
        .select()
        .single();

    if (error) throw error;

    // Save payment methods
    if (payload.paymentMethods && payload.paymentMethods.length > 0) {
        const links = payload.paymentMethods.map(pmId => ({
            sale_type_id: data.id,
            payment_method_id: pmId,
        }));
        const { error: linkError } = await supabase.from("payment_method_sale_type").insert(links);
        if (linkError) console.error("Error linking payment methods:", linkError);
    }

    // Save warehouses
    if (payload.warehouses && payload.warehouses.length > 0) {
        const links = payload.warehouses.map(wId => ({
            sale_type_id: data.id,
            warehouse_id: wId,
        }));
        const { error: linkError } = await supabase.from("sale_type_warehouses").insert(links);
        if (linkError) console.error("Error linking warehouses:", linkError);
    }

    return data as OrderChannelType;
};

export const UpdateSaleType = async (payload: UpdateOrderChannelPayload): Promise<OrderChannelType> => {
    const { data, error } = await supabase
        .from("sale_types")
        .update({
            name: payload.name,
            code: payload.code,
            factura_serie_id: payload.factura_serie_id,
            boleta_serie_id: payload.boleta_serie_id,
            business_acount_id: payload.business_acount_id ?? null,
            pos_sale_type: payload.pos_sale_type,
            is_active: payload.is_active,
        })
        .eq("id", payload.id)
        .select()
        .single();

    if (error) throw error;

    // Re-sync payment methods
    await supabase.from("payment_method_sale_type").delete().eq("sale_type_id", payload.id);
    if (payload.paymentMethods && payload.paymentMethods.length > 0) {
        const links = payload.paymentMethods.map(pmId => ({
            sale_type_id: payload.id,
            payment_method_id: pmId,
        }));
        const { error: linkError } = await supabase.from("payment_method_sale_type").insert(links);
        if (linkError) console.error("Error linking payment methods:", linkError);
    }

    // Re-sync warehouses
    await supabase.from("sale_type_warehouses").delete().eq("sale_type_id", payload.id);
    if (payload.warehouses && payload.warehouses.length > 0) {
        const links = payload.warehouses.map(wId => ({
            sale_type_id: payload.id,
            warehouse_id: wId,
        }));
        const { error: linkError } = await supabase.from("sale_type_warehouses").insert(links);
        if (linkError) console.error("Error linking warehouses:", linkError);
    }

    return data as OrderChannelType;
};

export const GetInvoiceSeries = async (): Promise<{ id: number; serie: string | null; invoice_type_id: number; invoice_provider_id: number; type_code: string | null }[]> => {
    const { data, error } = await supabase
        .from("invoice_series")
        .select("id, serie, invoice_type_id, invoice_provider_id, types:invoice_type_id(code)")
        .eq("is_active", true)
        .order("id");

    if (error) throw error;
    return (data ?? []).map((item: any) => ({
        id: item.id,
        serie: item.serie,
        invoice_type_id: item.invoice_type_id,
        invoice_provider_id: item.invoice_provider_id,
        type_code: item.types?.code || null,
    }));
};

export const GetWarehouses = async (): Promise<{ id: number; name: string }[]> => {
    const { data, error } = await supabase
        .from("warehouses")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

    if (error) throw error;
    return data ?? [];
};

export const GetCajas = async (): Promise<{ id: number; name: string }[]> => {
    // Business accounts where type code = 'CHR' (cajas)
    const { data, error } = await supabase
        .from("business_accounts")
        .select("id, name, types:business_account_type_id(code)")
        .eq("is_active", true)
        .order("name");

    if (error) throw error;

    // Filter by type code CHR
    return (data ?? [])
        .filter((ba: any) => ba.types?.code === 'CHR')
        .map((ba: any) => ({ id: ba.id, name: ba.name }));
};
