import { supabase } from "@/integrations/supabase/client";
import {
    Order,
    ReturnType,
    Situation,
    ReturnItem,
    ReturnProduct
} from "../types/Returns.types";

export const returnsService = {
    async getOrders(userId: string) {
        const { data, error } = await supabase
            .from("orders")
            .select("id, document_number, customer_name, customer_lastname, total, created_at, document_type, shipping_cost")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return data as Order[];
    },

    async getExistingReturns() {
        const { data, error } = await supabase
            .from("returns")
            .select("order_id");

        if (error) throw error;
        return data;
    },

    async getModuleInfo(code: string) {
        const { data, error } = await supabase
            .from("modules")
            .select("id")
            .eq("code", code)
            .single();

        if (error) throw error;
        return data;
    },

    async getTypes(moduleId: number) {
        const { data, error } = await supabase
            .from("types")
            .select("*")
            .eq("module_id", moduleId);

        if (error) throw error;
        return data as ReturnType[];
    },

    async getSituations(moduleId: number) {
        const { data, error } = await supabase
            .from("situations")
            .select("*, statuses(id, code, name)")
            .eq("module_id", moduleId);

        if (error) throw error;
        return data;
    },

    async getDocumentTypes() {
        const { data, error } = await supabase
            .from("document_types")
            .select("*");

        if (error) throw error;
        return data;
    },

    async getPaymentMethods() {
        const { data, error } = await supabase
            .from("payment_methods")
            .select("*")
            .eq("active", true);

        if (error) throw error;
        return data;
    },

    async getOrderProducts(orderId: number) {
        const { data, error } = await supabase
            .from("order_products")
            .select(`
        *,
        variations (
          sku,
          products (
            title
          )
        )
      `)
            .eq("order_id", orderId);

        if (error) throw error;
        return data;
    },

    async getReturnProductsForDisplay(returnId: number) {
        const { data, error } = await supabase
            .from("returns_products")
            .select(`
        *,
        variations (
          sku,
          products (
            title
          )
        )
      `)
            .eq("return_id", returnId)
            .eq("output", false);

        if (error) throw error;
        return (data || []).map((rp: any) => ({
            id: rp.id,
            product_variation_id: rp.product_variation_id,
            quantity: rp.quantity,
            product_price: rp.product_amount || 0,
            product_discount: 0,
            variations: rp.variations,
        }));
    },

    async getDocumentProducts(params: { order_id?: number; return_id?: number }) {
        const { data, error } = await supabase.functions.invoke("get-return-order-products", {
            body: params,
        });

        if (error) throw error;
        return data as { header: any; products: any[] };
    },

    async createReturn(payload: any) {
        const { data, error } = await supabase.functions.invoke("create-returns", {
            body: payload,
        });

        if (error) throw error;
        return data;
    },

    async getReturns() {
        const { data, error } = await supabase.functions.invoke("get-returns");

        if (error) throw error;

        // Based on the provided sample, the structure is { returnsdata: { data: [...] } }
        const returnsData = data?.returnsdata?.data || [];

        return returnsData.map((item: any) => ({
            id: item.id,
            order_id: item.id_order,
            customer_document_number: item.customer_document_numer,
            customer_name: item.name,
            customer_lastname: `${item.last_name || ''} ${item.middle_name || ''} ${item.last_name2 || ''}`.trim(),
            reason: item.reason,
            total_refund_amount: item.total_refund_amount,
            created_at: item.created_at,
            types: { name: 'Devolución' },
            situations: { name: 'Pendiente' },
            total_exchange_difference: item.otal_exchange_difference ?? item.total_exchange_difference ?? 0
        })) as ReturnItem[];
    },

    async updateReturnFull(payload: any) {
        const { data, error } = await supabase.functions.invoke('update-return', {
            body: payload,
        });

        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || 'Error al actualizar la devolución');
        return data;
    },

    async getReturnDetails(id: number) {
        const { data, error } = await supabase.functions.invoke('get-return-details', {
            body: { return_id: id },
        });

        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || 'Error al obtener los detalles del retorno');
        return data.data as any;
    },

    async getReturnById(id: number) {
        const { data, error } = await supabase
            .from('returns')
            .select(`
        *,
        types(id, name, code)
      `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async getReturnProducts(returnId: number) {
        const { data, error } = await supabase
            .from('returns_products')
            .select(`
        *,
        variations (
          sku,
          products (
            title
          )
        )
      `)
            .eq('return_id', returnId);

        if (error) throw error;
        return data;
    },

    async updateReturn(id: number, payload: any) {
        const { error } = await supabase
            .from('returns')
            .update(payload)
            .eq('id', id);

        if (error) throw error;
    },

    async deleteReturnProducts(returnId: number) {
        const { error } = await supabase
            .from('returns_products')
            .delete()
            .eq('return_id', returnId);

        if (error) throw error;
    },

    async insertReturnProducts(products: any[]) {
        const { error } = await (supabase as any)
            .from('returns_products')
            .insert(products);

        if (error) throw error;
    },

    async getStatusByCode(code: string) {
        const { data, error } = await supabase
            .from('statuses')
            .select('*')
            .eq('code', code)
            .single();

        if (error) throw error;
        return data;
    },

    async getStatusById(id: number) {
        const { data, error } = await supabase
            .from('statuses')
            .select('code')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async uploadReturnVoucher(file: File): Promise<string> {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `return-vouchers/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('sales')
            .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('sales')
            .getPublicUrl(filePath);

        return publicUrl;
    },
};
