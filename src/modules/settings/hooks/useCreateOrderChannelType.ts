import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { CreateSaleType, GetOrderChannelTypeDetails, UpdateSaleType, GetInvoiceSeries, GetWarehouses, GetCajas } from '../services/OrderChannelTypes.services';
import { getPaymentMethodsIsActiveTrueAndActiveTrue } from '@/shared/services/service';

interface FormData {
    name: string;
    code: string;
    tax_serie_id: number | '';
    business_acount_id: number | '' | null;
    pos_sale_type: boolean;
    is_active: boolean;
}

interface PaymentMethodOption {
    id: number;
    name: string;
    business_accounts?: { name: string };
}

interface InvoiceSerieOption {
    id: number;
    fac_serie: string;
    bol_serie: string;
    invoice_provider_id: number;
}

export interface WarehouseOption {
    id: number;
    name: string;
}

export interface CajaOption {
    id: number;
    name: string;
}

const useCreateOrderChannelType = () => {
    const navigate = useNavigate();
    const { id: channelTypeId } = useParams();
    const isEdit = Boolean(channelTypeId);
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [optionsLoading, setOptionsLoading] = useState(true);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethodOption[]>([]);
    const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<Set<number>>(new Set());
    const [invoiceSeries, setInvoiceSeries] = useState<InvoiceSerieOption[]>([]);
    const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
    const [selectedWarehouses, setSelectedWarehouses] = useState<number[]>([]);
    const [cajas, setCajas] = useState<CajaOption[]>([]);

    const [formData, setFormData] = useState<FormData>({
        name: '',
        code: '',
        tax_serie_id: '',
        business_acount_id: null,
        pos_sale_type: false,
        is_active: true,
    });

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const promises: Promise<any>[] = [
                    getPaymentMethodsIsActiveTrueAndActiveTrue(),
                    GetInvoiceSeries(),
                    GetWarehouses(),
                    GetCajas(),
                ];

                if (isEdit && channelTypeId) {
                    promises.push(GetOrderChannelTypeDetails(parseInt(channelTypeId)));
                }

                const results = await Promise.all(promises);
                const paymentMethodsData = results[0];
                const invoiceSeriesData = results[1];
                const warehousesData = results[2];
                const cajasData = results[3];

                setPaymentMethods(paymentMethodsData);
                setInvoiceSeries(invoiceSeriesData);
                setWarehouses(warehousesData);
                setCajas(cajasData);

                if (isEdit && results[4]) {
                    const { saleType, paymentMethodIds, warehouseIds } = results[4];
                    setFormData({
                        name: saleType.name,
                        code: saleType.code ?? '',
                        tax_serie_id: saleType.tax_serie_id,
                        business_acount_id: saleType.business_acount_id ?? null,
                        pos_sale_type: saleType.pos_sale_type,
                        is_active: saleType.is_active,
                    });
                    setSelectedPaymentMethods(new Set(paymentMethodIds));
                    setSelectedWarehouses(warehouseIds);
                }
            } catch (error) {
                console.error("Error loading options:", error);
                toast({
                    title: "Error",
                    description: "No se pudieron cargar las opciones",
                    variant: "destructive"
                });
            } finally {
                setOptionsLoading(false);
            }
        };
        fetchOptions();
    }, [toast, isEdit, channelTypeId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [id]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [id]: value }));
        }
    };

    const togglePaymentMethod = (id: number) => {
        setSelectedPaymentMethods(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleWarehouse = (id: number) => {
        setSelectedWarehouses(prev => {
            if (prev.includes(id)) {
                return prev.filter(w => w !== id);
            }
            return [...prev, id];
        });
    };

    const setSelectedWarehouseSingle = (id: number) => {
        setSelectedWarehouses([id]);
    };

    const handlePosToggle = (checked: boolean) => {
        setFormData(prev => ({ ...prev, pos_sale_type: checked }));
        if (checked && selectedWarehouses.length > 1) {
            // When switching to POS, keep only the first warehouse
            setSelectedWarehouses(prev => prev.length > 0 ? [prev[0]] : []);
        }
        if (!checked) {
            // Clear caja when disabling POS
            setFormData(prev => ({ ...prev, business_acount_id: null }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!formData.name || !formData.code || !formData.tax_serie_id) {
            toast({
                title: "Error",
                description: "Por favor complete todos los campos requeridos (nombre, código y serie)",
                variant: "destructive"
            });
            setLoading(false);
            return;
        }

        try {
            const payload = {
                name: formData.name,
                code: formData.code,
                tax_serie_id: Number(formData.tax_serie_id),
                business_acount_id: formData.business_acount_id ? Number(formData.business_acount_id) : null,
                pos_sale_type: formData.pos_sale_type,
                is_active: formData.is_active,
                paymentMethods: Array.from(selectedPaymentMethods),
                warehouses: selectedWarehouses,
            };

            if (isEdit && channelTypeId) {
                await UpdateSaleType({ ...payload, id: parseInt(channelTypeId) });
                toast({ title: "Éxito", description: "Canal de venta actualizado correctamente" });
            } else {
                await CreateSaleType(payload);
                toast({ title: "Éxito", description: "Canal de venta creado correctamente" });
            }
            navigate('/settings/order-channel-types');
        } catch (error: any) {
            console.error("Error saving sale type:", error);
            toast({
                title: "Error",
                description: error.message || (isEdit ? "Error al actualizar" : "Error al crear"),
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return {
        formData,
        loading,
        optionsLoading,
        paymentMethods,
        selectedPaymentMethods,
        invoiceSeries,
        warehouses,
        selectedWarehouses,
        cajas,
        isEdit,
        handleChange,
        togglePaymentMethod,
        toggleWarehouse,
        setSelectedWarehouseSingle,
        handlePosToggle,
        handleSubmit,
        setFormData,
    };
};

export default useCreateOrderChannelType;
