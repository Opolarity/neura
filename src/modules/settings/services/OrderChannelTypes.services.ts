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
    branchIds: number[];
}> => {
    const [saleTypeRes, paymentMethodsRes, branchesRes] = await Promise.all([
        supabase.from("sale_types").select("*").eq("id", id).single(),
        supabase.from("payment_method_sale_type").select("payment_method_id").eq("sale_type_id", id),
        supabase.from("sale_type_branches").select("branch_id").eq("sale_type_id", id),
    ]);

    if (saleTypeRes.error) throw saleTypeRes.error;

    return {
        saleType: saleTypeRes.data as OrderChannelType,
        paymentMethodIds: (paymentMethodsRes.data ?? []).map((r: any) => r.payment_method_id),
        branchIds: (branchesRes.data ?? []).map((r: any) => r.branch_id),
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

    // Save branches
    if (payload.branches && payload.branches.length > 0) {
        const links = payload.branches.map(bId => ({
            sale_type_id: data.id,
            branch_id: bId,
        }));
        const { error: linkError } = await supabase.from("sale_type_branches").insert(links);
        if (linkError) console.error("Error linking branches:", linkError);
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

    // Re-sync branches
    await supabase.from("sale_type_branches").delete().eq("sale_type_id", payload.id);
    if (payload.branches && payload.branches.length > 0) {
        const links = payload.branches.map(bId => ({
            sale_type_id: payload.id,
            branch_id: bId,
        }));
        const { error: linkError } = await supabase.from("sale_type_branches").insert(links);
        if (linkError) console.error("Error linking branches:", linkError);
    }

    return data as OrderChannelType;
};

export const GetInvoiceSeries = async (): Promise<{ id: number; serie: string | null; invoice_type_id: number; invoice_provider_id: number; type_code: string | null; provider_description: string | null }[]> => {
    const { data, error } = await supabase
        .from("invoice_series")
        .select("id, serie, invoice_type_id, invoice_provider_id, types:invoice_type_id(code), invoice_providers:invoice_provider_id(description)")
        .eq("is_active", true)
        .order("id");

    if (error) throw error;
    return (data ?? []).map((item: any) => ({
        id: item.id,
        serie: item.serie,
        invoice_type_id: item.invoice_type_id,
        invoice_provider_id: item.invoice_provider_id,
        type_code: item.types?.code || null,
        provider_description: item.invoice_providers?.description || null,
    }));
};

export const GetBranches = async (): Promise<{ id: number; name: string }[]> => {
    const { data, error } = await supabase
        .from("branches")
        .select("id, name")
        .eq("is_active", true)
        .gt("id", 0)
        .order("name");

    if (error) throw error;
    return data ?? [];
};

export const GetCajas = async (currentSaleTypeId?: number): Promise<{ id: number; name: string }[]> => {
    // Business accounts where type code = 'CHR' (cajas)
    const { data, error } = await supabase
        .from("business_accounts")
        .select("id, name, types:business_account_type_id(code)")
        .eq("is_active", true)
        .order("name");

    if (error) throw error;

    const allCajas = (data ?? [])
        .filter((ba: any) => ba.types?.code === 'CHR')
        .map((ba: any) => ({ id: ba.id, name: ba.name }));

    // Get cajas already linked to other sale types
    const { data: linkedData, error: linkedError } = await supabase
        .from("sale_types")
        .select("business_acount_id")
        .not("business_acount_id", "is", null)
        .eq("is_active", true);

    if (linkedError) throw linkedError;

    const usedIds = new Set(
        (linkedData ?? [])
            .filter((st: any) => st.business_acount_id !== currentSaleTypeId ? true : true)
            .map((st: any) => st.business_acount_id as number)
    );

    // Exclude cajas used by OTHER sale types (keep the one used by current if editing)
    if (currentSaleTypeId) {
        // Find which business_acount_id the current sale type uses
        const { data: currentSt } = await supabase
            .from("sale_types")
            .select("business_acount_id")
            .eq("id", currentSaleTypeId)
            .single();
        if (currentSt?.business_acount_id) {
            usedIds.delete(currentSt.business_acount_id);
        }
    }

    return allCajas.filter(c => !usedIds.has(c.id));
};
