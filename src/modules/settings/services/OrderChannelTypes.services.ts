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
}> => {
    const [saleTypeRes, paymentMethodsRes] = await Promise.all([
        supabase.from("sale_types").select("*").eq("id", id).single(),
        supabase.from("payment_method_sale_type").select("payment_method_id").eq("sale_type_id", id),
    ]);

    if (saleTypeRes.error) throw saleTypeRes.error;

    return {
        saleType: saleTypeRes.data as OrderChannelType,
        paymentMethodIds: (paymentMethodsRes.data ?? []).map((r: any) => r.payment_method_id),
    };
};

export const CreateSaleType = async (payload: CreateOrderChannelPayload): Promise<OrderChannelType> => {
    const { data, error } = await supabase
        .from("sale_types")
        .insert({
            name: payload.name,
            code: payload.code,
            tax_serie_id: payload.tax_serie_id,
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

    return data as OrderChannelType;
};

export const UpdateSaleType = async (payload: UpdateOrderChannelPayload): Promise<OrderChannelType> => {
    const { data, error } = await supabase
        .from("sale_types")
        .update({
            name: payload.name,
            code: payload.code,
            tax_serie_id: payload.tax_serie_id,
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

    return data as OrderChannelType;
};

export const GetInvoiceSeries = async (): Promise<{ id: number; fac_serie: string; bol_serie: string; invoice_provider_id: number }[]> => {
    const { data, error } = await supabase
        .from("invoice_series")
        .select("id, fac_serie, bol_serie, invoice_provider_id")
        .eq("is_active", true)
        .order("id");

    if (error) throw error;
    return data ?? [];
};
