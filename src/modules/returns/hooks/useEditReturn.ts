import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { returnsService } from '../services/Returns.service';
import {
    OrderProduct,
    ReturnProduct,
    ExchangeProduct,
    ReturnPayment,
} from '../types/Returns.types';

const createEmptyPayment = (): ReturnPayment => ({
    id: crypto.randomUUID(),
    paymentMethodId: '',
    amount: '',
});

export const useEditReturn = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [situations, setSituations] = useState<any[]>([]);
    const [documentTypes, setDocumentTypes] = useState<any[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [returnTypes, setReturnTypes] = useState<any[]>([]);
    const [selectedReturnType, setSelectedReturnType] = useState<string>('');
    const [returnTypeCode, setReturnTypeCode] = useState<string>('');
    const [orderProducts, setOrderProducts] = useState<OrderProduct[]>([]);
    const [displayOrderId, setDisplayOrderId] = useState<number>(0);
    const [moduleId, setModuleId] = useState<number>(0);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [orderTotal, setOrderTotal] = useState<number>(0);
    const [shippingCost, setShippingCost] = useState<number>(0);

    // Multiple payments (same pattern as CreateReturn)
    const [payments, setPayments] = useState<ReturnPayment[]>([]);
    const [currentPayment, setCurrentPayment] = useState<ReturnPayment>(createEmptyPayment());

    // Voucher modal
    const voucherFileInputRef = useRef<HTMLInputElement>(null);
    const [voucherModalOpen, setVoucherModalOpen] = useState(false);
    const [selectedVoucherPreview, setSelectedVoucherPreview] = useState<string | null>(null);

    // Form fields
    const [reason, setReason] = useState('');
    const [documentType, setDocumentType] = useState('');
    const [documentNumber, setDocumentNumber] = useState('');
    const [shippingReturn, setShippingReturn] = useState(false);
    const [situationId, setSituationId] = useState('');
    const [returnProducts, setReturnProducts] = useState<ReturnProduct[]>([]);
    const [exchangeProducts, setExchangeProducts] = useState<ExchangeProduct[]>([]);

    useEffect(() => {
        if (id) loadReturnData();
    }, [id]);

    const loadReturnData = async () => {
        setLoading(true);
        try {
            const details = await returnsService.getReturnDetails(Number(id));

            const response = await returnsService.getDocumentProducts({ order_id: details.order_id });
            const rawOrderProducts = response?.products ?? [];
            const header = response?.header ?? {};

            const orderProductsData: OrderProduct[] = rawOrderProducts.map((p: any) => ({
                id: p.id,
                product_variation_id: p.product_variation_id,
                product_name: p.product_name,
                sku: p.sku ?? '',
                quantity: p.quantity,
                product_price: p.product_price,
                product_discount: p.product_discount ?? 0,
                terms: p.terms ?? [],
            }));
            setDisplayOrderId(details.order_id);
            setShippingCost(header.shipping_cost || 0);
            setOrderTotal(header.total || 0);
            const docTypesData = await returnsService.getDocumentTypes();

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuario no autenticado');
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*, branches(*)')
                .eq('UID', user.id)
                .single();
            setUserProfile(profileData);

            const moduleData = await returnsService.getModuleInfo('RTU');
            setModuleId(moduleData.id);
            const [situationsData, typesData, paymentMethodsData] = await Promise.all([
                returnsService.getSituations(moduleData.id),
                returnsService.getTypes(moduleData.id),
                returnsService.getPaymentMethods(),
            ]);

            setReason(details.reason || '');
            setDocumentType(details.customer_document_type_id?.toString() || '');
            setDocumentNumber(details.customer_document_number);
            setShippingReturn(details.shipping_return);
            setSituationId(details.situation_id.toString());
            setSelectedReturnType(details.return_type_id.toString());
            setReturnTypeCode(details.return_type_code || '');
            setOrderProducts(orderProductsData || []);
            setDocumentTypes(docTypesData || []);
            setSituations(situationsData || []);
            setReturnTypes(typesData || []);
            setPaymentMethods(paymentMethodsData || []);

            // output=false → prenda que ENTRA (devuelta a tienda)
            // output=true  → prenda que SALE (cambio al cliente)
            if (details.return_type_code === 'DVT') {
                const allOrderProducts = orderProductsData?.map((op) => ({
                    product_variation_id: op.product_variation_id,
                    quantity: op.quantity,
                    product_name: op.product_name ?? op.variations?.products?.title ?? '',
                    sku: op.sku ?? op.variations?.sku ?? '',
                    variation_name: op.terms?.map(t => t.term_name).join(' / ') ?? '',
                    price: op.product_price,
                    output: false,
                })) || [];
                setReturnProducts(allOrderProducts);
            } else {
                const formattedReturnProducts = (details.return_products || [])
                    .filter((rp: any) => !rp.output)
                    .map((rp: any) => {
                        const orderProd = orderProductsData.find(op => op.product_variation_id === rp.product_variation_id);
                        return {
                            product_variation_id: rp.product_variation_id,
                            quantity: rp.quantity,
                            product_name: rp.product_name || '',
                            sku: orderProd?.sku ?? '',
                            variation_name: orderProd?.terms?.map(t => t.term_name).join(' / ') ?? '',
                            price: rp.product_amount || 0,
                            output: false,
                        };
                    });
                setReturnProducts(formattedReturnProducts);
            }

            if (details.return_type_code === 'CAM') {
                const loadedExchangeProducts = (details.return_products || [])
                    .filter((rp: any) => rp.output)
                    .map((rp: any) => ({
                        variation_id: rp.product_variation_id,
                        product_name: rp.product_name || '',
                        variation_name: '',
                        sku: '',
                        quantity: rp.quantity,
                        price: rp.product_amount || 0,
                        discount: 0,
                        linked_return_index: null,
                    }));
                setExchangeProducts(loadedExchangeProducts);
            }

            // Load existing payments from details
            if (details.payment_methods && details.payment_methods.length > 0) {
                const loadedPayments: ReturnPayment[] = details.payment_methods.map((pm: any) => ({
                    id: crypto.randomUUID(),
                    paymentMethodId: pm.payment_method_id.toString(),
                    amount: pm.amount.toString(),
                }));
                setPayments(loadedPayments);
            }

        } catch (error: any) {
            console.error('Error loading return:', error);
            toast.error('Error al cargar la devolución');
            navigate('/returns');
        } finally {
            setLoading(false);
        }
    };

    const addPayment = useCallback(() => {
        if (!currentPayment.paymentMethodId || !currentPayment.amount) {
            toast.error('Seleccione un método de pago y monto');
            return;
        }
        const amount = parseFloat(currentPayment.amount);
        if (isNaN(amount) || amount <= 0) {
            toast.error('El monto debe ser mayor a cero');
            return;
        }
        setPayments((prev) => [...prev, { ...currentPayment, id: crypto.randomUUID() }]);
        setCurrentPayment(createEmptyPayment());
    }, [currentPayment]);

    const removePayment = useCallback((id: string) => {
        setPayments((prev) => prev.filter((p) => p.id !== id));
    }, []);

    const handleVoucherSelect = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setCurrentPayment((prev) => ({
                ...prev,
                voucherFile: file,
                voucherPreview: reader.result as string,
            }));
        };
        reader.readAsDataURL(file);
    }, []);

    const removeVoucher = useCallback(() => {
        setCurrentPayment((prev) => ({
            ...prev,
            voucherFile: undefined,
            voucherPreview: undefined,
        }));
    }, []);

    const addReturnProduct = (orderProduct: OrderProduct) => {
        const existingProduct = returnProducts.find(
            rp => rp.product_variation_id === orderProduct.product_variation_id
        );

        if (existingProduct) {
            toast.error('Este producto ya fue agregado');
            return;
        }

        const newReturnProduct: ReturnProduct = {
            product_variation_id: orderProduct.product_variation_id,
            quantity: 1,
            product_name: orderProduct.product_name ?? orderProduct.variations?.products?.title ?? '',
            sku: orderProduct.sku ?? orderProduct.variations?.sku ?? '',
            variation_name: orderProduct.terms?.map(t => t.term_name).join(' / ') ?? '',
            price: orderProduct.product_price,
            output: false,
        };

        setReturnProducts([...returnProducts, newReturnProduct]);
    };

    const removeReturnProduct = (index: number) => {
        setReturnProducts(returnProducts.filter((_, i) => i !== index));
    };

    const updateReturnProductQuantity = (index: number, quantity: number) => {
        const orderProduct = orderProducts.find(
            op => op.product_variation_id === returnProducts[index].product_variation_id
        );

        if (orderProduct && quantity > orderProduct.quantity) {
            toast.error(`La cantidad no puede exceder ${orderProduct.quantity}`);
            return;
        }

        const updated = [...returnProducts];
        updated[index].quantity = quantity;
        setReturnProducts(updated);
    };

    // ── Exchange products (same interface as CreateReturn's ReturnSelectionCambio) ──
    const addExchangeProduct = (product: any) => {
        const existingProduct = exchangeProducts.find(
            ep => ep.variation_id === product.variationId
        );

        if (existingProduct) {
            toast.error('Este producto ya fue agregado');
            return;
        }

        const termsNames = product.terms?.map((t: any) => t.name).join(' - ') || '';
        const newProduct: ExchangeProduct = {
            variation_id: product.variationId,
            product_name: product.productTitle,
            variation_name: termsNames,
            sku: product.sku || '',
            quantity: 1,
            price: product.prices?.[0]?.price || 0,
            discount: 0,
            linked_return_index: null,
            imageUrl: product.imageUrl,
            stock: product.stock,
        };

        setExchangeProducts([...exchangeProducts, newProduct]);
    };

    const removeExchangeProduct = (index: number) => {
        setExchangeProducts(exchangeProducts.filter((_, i) => i !== index));
    };

    const updateExchangeProduct = (index: number, field: string, value: any) => {
        setExchangeProducts(
            exchangeProducts.map((p, i) => (i === index ? { ...p, [field]: value } : p))
        );
    };

    // ── Totals ────────────────────────────────────────────────────────────────────
    const calculateReturnTotal = () => {
        if (returnTypeCode === 'DVT') {
            return orderProducts.reduce((sum, p) => sum + p.product_price * p.quantity, 0);
        }
        return returnProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);
    };

    const calculateExchangeTotal = () => {
        return exchangeProducts.reduce((sum, p) => {
            return sum + p.price * (1 - p.discount / 100) * p.quantity;
        }, 0);
    };

    const calculateDifference = () => {
        return calculateReturnTotal() - calculateExchangeTotal();
    };

    const calculateTotals = () => {
        const returnTotal = calculateReturnTotal();
        const newTotal = calculateExchangeTotal();
        return {
            returnTotal,
            newTotal,
            difference: newTotal - returnTotal,
        };
    };

    const handleSave = async () => {
        if (returnTypeCode === 'DVP' && returnProducts.length === 0) {
            toast.error('Debe agregar al menos un producto a devolver');
            return;
        }

        if (!situationId) {
            toast.error('Debe seleccionar una situación');
            return;
        }

        if (returnTypeCode === 'CAM') {
            if (returnProducts.length === 0) {
                toast.error('Debe seleccionar productos a devolver');
                return;
            }
            if (exchangeProducts.length === 0) {
                toast.error('Debe agregar productos de cambio');
                return;
            }
        }

        setSaving(true);
        try {
            const productsTotal = calculateReturnTotal();
            const totalRefundAmount = productsTotal; // SP adds shipping_cost automatically
            const totalExchangeDifference = returnTypeCode === 'CAM'
                ? calculateExchangeTotal() - (productsTotal + (shippingReturn ? shippingCost : 0))
                : -(productsTotal + (shippingReturn ? shippingCost : 0));

            let allReturnProducts: any[] = [];
            if (returnTypeCode === 'DVT') {
                allReturnProducts = orderProducts.map(p => ({
                    product_variation_id: p.product_variation_id,
                    quantity: p.quantity,
                    product_amount: p.product_price,
                    output: false,
                }));
            } else {
                allReturnProducts = returnProducts.map(p => ({
                    product_variation_id: p.product_variation_id,
                    quantity: p.quantity,
                    product_amount: p.price,
                    output: false,
                }));
            }

            if (returnTypeCode === 'CAM' && exchangeProducts.length > 0) {
                allReturnProducts = [
                    ...allReturnProducts,
                    ...exchangeProducts.map(p => ({
                        product_variation_id: p.variation_id,
                        quantity: p.quantity,
                        product_amount: p.price * (1 - p.discount / 100),
                        output: true,
                    })),
                ];
            }

            const selectedSituation = situations.find(s => s.id === Number(situationId));

            // Upload vouchers before sending
            const paymentsWithUrls = await Promise.all(
                payments.map(async (p) => {
                    if (p.voucherFile) {
                        const url = await returnsService.uploadReturnVoucher(p.voucherFile);
                        return { ...p, voucherUrl: url };
                    }
                    return p;
                })
            );

            const payload = {
                return_id: Number(id),
                return_type_id: Number(selectedReturnType),
                return_type_code: returnTypeCode,
                customer_document_type_id: documentType ? Number(documentType) : 0,
                customer_document_number: documentNumber,
                reason: reason || '',
                shipping_return: shippingReturn,
                shipping_cost: shippingReturn ? shippingCost : null,
                situation_id: Number(situationId),
                status_id: selectedSituation?.status_id || 0,
                module_id: moduleId,
                module_code: 'RTU',
                total_refund_amount: totalRefundAmount,
                total_exchange_difference: totalExchangeDifference,
                return_products: allReturnProducts,
                payment_methods: paymentsWithUrls.map(p => ({
                    payment_method_id: Number(p.paymentMethodId),
                    amount: parseFloat(p.amount),
                    voucher_url: p.voucherUrl || null,
                })),
                business_account_id: userProfile?.business_account_id || 0,
                branch_id: userProfile?.branch_id || 1,
                warehouse_id: userProfile?.branches?.warehouse_id || 1,
            };

            await returnsService.updateReturnFull(payload);

            toast.success('Devolución actualizada exitosamente');
            navigate('/returns');
        } catch (error: any) {
            console.error('Error updating return:', error);
            toast.error('Error al actualizar la devolución');
        } finally {
            setSaving(false);
        }
    };

    return {
        loading,
        saving,
        displayOrderId,
        situations,
        documentTypes,
        returnTypes,
        selectedReturnType,
        returnTypeCode,
        orderProducts,
        reason,
        setReason,
        documentType,
        setDocumentType,
        documentNumber,
        setDocumentNumber,
        shippingReturn,
        setShippingReturn,
        shippingCost,
        setShippingCost,
        situationId,
        setSituationId,
        returnProducts,
        exchangeProducts,
        paymentMethods,
        payments,
        currentPayment,
        setCurrentPayment,
        addPayment,
        removePayment,
        voucherFileInputRef,
        handleVoucherSelect,
        removeVoucher,
        voucherModalOpen,
        setVoucherModalOpen,
        selectedVoucherPreview,
        setSelectedVoucherPreview,
        addReturnProduct,
        removeReturnProduct,
        updateReturnProductQuantity,
        addExchangeProduct,
        removeExchangeProduct,
        updateExchangeProduct,
        orderTotal,
        calculateReturnTotal,
        calculateExchangeTotal,
        calculateDifference,
        calculateTotals,
        handleSave,
    };
};
