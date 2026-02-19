import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { returnsService } from '../services/Returns.service';
import {
    OrderProduct,
    ReturnProduct,
    ExchangeProduct as NewProduct,
    SearchProduct,
    ProductSearchPagination,
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
    const [orderId, setOrderId] = useState<number>(0);

    // Multiple payments (same pattern as CreateReturn)
    const [payments, setPayments] = useState<ReturnPayment[]>([]);
    const [currentPayment, setCurrentPayment] = useState<ReturnPayment>(createEmptyPayment());

    // Form fields
    const [reason, setReason] = useState('');
    const [documentType, setDocumentType] = useState('');
    const [documentNumber, setDocumentNumber] = useState('');
    const [shippingReturn, setShippingReturn] = useState(false);
    const [situationId, setSituationId] = useState('');
    const [returnProducts, setReturnProducts] = useState<ReturnProduct[]>([]);
    const [newProducts, setNewProducts] = useState<NewProduct[]>([]);

    // Product search with pagination
    const [searchQuery, setSearchQuery] = useState('');
    const [searchProducts, setSearchProducts] = useState<SearchProduct[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchPagination, setSearchPagination] = useState<ProductSearchPagination>({ page: 1, size: 10, total: 0 });
    const debouncedSearch = useDebounce(searchQuery, 300);

    useEffect(() => {
        if (id) loadReturnData();
    }, [id]);

    const loadReturnData = async () => {
        setLoading(true);
        try {
            const returnData = await returnsService.getReturnById(Number(id));
            const returnProductsData = await returnsService.getReturnProducts(Number(id));
            const orderProductsData = await returnsService.getOrderProducts(returnData.order_id);
            const docTypesData = await returnsService.getDocumentTypes();

            const moduleData = await returnsService.getModuleInfo('RTU');
            const [situationsData, typesData, paymentMethodsData] = await Promise.all([
                returnsService.getSituations(moduleData.id),
                returnsService.getTypes(moduleData.id),
                returnsService.getPaymentMethods(),
            ]);

            // Load variations for CAM exchange product names
            const { data: productsData } = await supabase
                .from('variations')
                .select('id, sku, products (id, title)');

            setOrderId(returnData.order_id);
            setReason(returnData.reason || '');
            setDocumentType(returnData.customer_document_type_id?.toString() || '');
            setDocumentNumber(returnData.customer_document_number);
            setShippingReturn(returnData.shipping_return);
            setSituationId(returnData.situation_id.toString());
            setSelectedReturnType(returnData.return_type_id.toString());
            setReturnTypeCode(returnData.types?.code || '');
            setOrderProducts(orderProductsData || []);
            setDocumentTypes(docTypesData || []);
            setSituations(situationsData || []);
            setReturnTypes(typesData || []);
            setPaymentMethods(paymentMethodsData || []);

            // output=false → products being RETURNED (coming back to store)
            // output=true  → exchange products going OUT to customer
            if (returnData.types?.code === 'DVT') {
                const allOrderProducts = orderProductsData?.map((op: any) => ({
                    product_variation_id: op.product_variation_id,
                    quantity: op.quantity,
                    product_name: op.variations.products.title,
                    sku: op.variations.sku,
                    price: op.product_price,
                    output: false,
                })) || [];
                setReturnProducts(allOrderProducts);
            } else {
                const formattedReturnProducts = returnProductsData
                    ?.filter((rp: any) => !rp.output)
                    .map((rp: any) => ({
                        product_variation_id: rp.product_variation_id,
                        quantity: rp.quantity,
                        product_name: rp.variations.products.title,
                        sku: rp.variations.sku,
                        price: rp.product_amount || 0,
                        output: false,
                    })) || [];
                setReturnProducts(formattedReturnProducts);
            }

            if (returnData.types?.code === 'CAM') {
                const newProds = returnProductsData
                    ?.filter((rp: any) => rp.output)
                    .map((rp: any) => {
                        const variation = productsData?.find((p: any) => p.id === rp.product_variation_id);
                        return {
                            variation_id: rp.product_variation_id,
                            product_name: variation?.products?.title || rp.variations?.products?.title || '',
                            variation_name: variation?.sku || rp.variations?.sku || '',
                            sku: variation?.sku || rp.variations?.sku || '',
                            quantity: rp.quantity,
                            price: rp.product_amount || 0,
                            discount: 0,
                            linked_return_index: null,
                        };
                    }) || [];
                setNewProducts(newProds);
            }

        } catch (error: any) {
            console.error('Error loading return:', error);
            toast.error('Error al cargar la devolución');
            navigate('/returns');
        } finally {
            setLoading(false);
        }
    };

    const fetchSearchProducts = useCallback(async (page: number = 1, search: string = '') => {
        setSearchLoading(true);
        try {
            const params = new URLSearchParams({
                p_page: page.toString(),
                p_size: '10',
            });
            if (search) params.append('p_search', search);

            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-sale-products?${params.toString()}`,
                {
                    headers: {
                        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) throw new Error('Error fetching products');

            const result = await response.json();
            setSearchProducts(result.data || []);
            setSearchPagination(result.page || { page: 1, size: 10, total: 0 });
        } catch (error) {
            console.error('Error fetching search products:', error);
            setSearchProducts([]);
        } finally {
            setSearchLoading(false);
        }
    }, []);

    useEffect(() => {
        if (returnTypeCode === 'CAM' && debouncedSearch) {
            fetchSearchProducts(1, debouncedSearch);
        }
    }, [debouncedSearch, returnTypeCode, fetchSearchProducts]);

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

    const handleSearchPageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= Math.ceil(searchPagination.total / searchPagination.size)) {
            fetchSearchProducts(newPage, debouncedSearch);
        }
    };

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
            product_name: orderProduct.variations.products.title,
            sku: orderProduct.variations.sku,
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

    const addProductFromSearch = (product: SearchProduct) => {
        const existingProduct = newProducts.find(
            np => np.variation_id === product.variationId
        );

        if (existingProduct) {
            toast.error('Este producto ya fue agregado');
            return;
        }

        const price = product.prices?.[0]?.sale_price || product.prices?.[0]?.price || 0;
        const newProduct: any = {
            variation_id: product.variationId,
            product_name: product.productTitle,
            variation_name: product.terms.map(t => t.name).join(' / ') || product.sku,
            sku: product.sku,
            quantity: 1,
            price: price,
            discount: 0,
            imageUrl: product.imageUrl,
            stock: product.stock,
            linked_return_index: null
        };

        setNewProducts([...newProducts, newProduct]);
        toast.success('Producto agregado');
    };

    const removeNewProduct = (index: number) => {
        setNewProducts(newProducts.filter((_, i) => i !== index));
    };

    const updateNewProductQuantity = (index: number, quantity: number) => {
        const updated = [...newProducts];
        updated[index].quantity = quantity;
        setNewProducts(updated);
    };

    const updateNewProductDiscount = (index: number, discount: number) => {
        const updated = [...newProducts];
        updated[index].discount = discount;
        setNewProducts(updated);
    };

    const calculateTotals = () => {
        let returnTotal = 0;

        if (returnTypeCode === 'DVT') {
            returnTotal = orderProducts.reduce((sum, product) => {
                return sum + (product.product_price * product.quantity);
            }, 0);
        } else {
            returnTotal = returnProducts.reduce((sum, product) => {
                return sum + (product.price * product.quantity);
            }, 0);
        }

        const newTotal = newProducts.reduce((sum, product) => {
            return sum + ((product.price - product.discount) * product.quantity);
        }, 0);

        return {
            returnTotal,
            newTotal,
            difference: newTotal - returnTotal
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
            if (newProducts.length === 0) {
                toast.error('Debe agregar productos de cambio');
                return;
            }
        }

        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuario no autenticado');

            const totals = calculateTotals();

            const payload = {
                order_id: orderId,
                return_type_id: Number(selectedReturnType),
                customer_document_type_id: documentType ? Number(documentType) : null,
                customer_document_number: documentNumber,
                reason: reason || null,
                shipping_return: shippingReturn,
                situation_id: Number(situationId),
                status_id: situations.find(s => s.id === Number(situationId))?.status_id,
                total_refund_amount: (returnTypeCode === 'DVT' || returnTypeCode === 'DVP') ? totals.returnTotal : null,
                total_exchange_difference: returnTypeCode === 'CAM' ? totals.difference : null,
            };

            await returnsService.updateReturn(Number(id), payload);
            await returnsService.deleteReturnProducts(Number(id));

            let returnProductsToInsert = [];
            if (returnTypeCode === 'DVT') {
                returnProductsToInsert = orderProducts.map(p => ({
                    return_id: Number(id),
                    product_variation_id: p.product_variation_id,
                    quantity: p.quantity,
                    product_amount: p.product_price,
                    output: true
                }));
            } else {
                returnProductsToInsert = returnProducts.map(product => ({
                    return_id: Number(id),
                    product_variation_id: product.product_variation_id,
                    quantity: product.quantity,
                    product_amount: product.price,
                    output: true
                }));
            }

            await returnsService.insertReturnProducts(returnProductsToInsert);

            if (returnTypeCode === 'CAM' && newProducts.length > 0) {
                const newProductsToInsert = newProducts.map(product => ({
                    return_id: Number(id),
                    product_variation_id: product.variation_id,
                    quantity: product.quantity,
                    product_amount: product.price - product.discount,
                    output: false
                }));
                await returnsService.insertReturnProducts(newProductsToInsert);
            }

            const selectedSituation = situations.find(s => s.id === Number(situationId));
            if (selectedSituation) {
                const statusData = await returnsService.getStatusById(selectedSituation.status_id);
                if (statusData?.code === 'CFM') {
                    // Logic for stock movements (as in original)
                    // Simplified for brevity in hook, should ideally be in service or backend
                    // Keeping it here for now to match original logic
                    let allReturnProducts = [];
                    if (returnTypeCode === 'DVT') {
                        allReturnProducts = orderProducts.map(p => ({
                            product_variation_id: p.product_variation_id,
                            quantity: p.quantity,
                            output: false
                        }));
                    } else {
                        allReturnProducts = returnProducts.map(p => ({
                            product_variation_id: p.product_variation_id,
                            quantity: p.quantity,
                            output: false
                        }));
                    }

                    if (returnTypeCode === 'CAM' && newProducts.length > 0) {
                        allReturnProducts = [
                            ...allReturnProducts,
                            ...newProducts.map(p => ({
                                product_variation_id: p.variation_id,
                                quantity: p.quantity,
                                output: true
                            }))
                        ];
                    }

                    for (const product of allReturnProducts) {
                        const returnMovementType: any = await returnsService.getStatusByCode('ENT'); // Assuming ENT exists for entries
                        // This part is very specific to stock logic, better kept in a more central place or service
                        // For now, I'll keep it as is but using service for the fetch
                        await (supabase as any).from('stock_movements').insert({
                            product_variation_id: product.product_variation_id,
                            quantity: product.output ? -product.quantity : product.quantity,
                            created_by: user.id,
                            movement_type: 1, // Defaulting to 1 as in original if not found
                            warehouse_id: 1,
                            completed: true,
                        });

                        const { data: currentStock }: any = await supabase
                            .from('product_stock')
                            .select('stock')
                            .eq('product_variation_id', product.product_variation_id)
                            .eq('warehouse_id', 1)
                            .single();

                        if (currentStock) {
                            const newStock = currentStock.stock + (product.output ? -product.quantity : product.quantity);
                            await supabase
                                .from('product_stock')
                                .update({ stock: newStock })
                                .eq('product_variation_id', product.product_variation_id)
                                .eq('warehouse_id', 1);
                        }
                    }
                }
            }

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
        situationId,
        setSituationId,
        returnProducts,
        newProducts,
        paymentMethods,
        payments,
        currentPayment,
        setCurrentPayment,
        addPayment,
        removePayment,
        searchQuery,
        setSearchQuery,
        searchProducts,
        searchLoading,
        searchPagination,
        handleSearchPageChange,
        addReturnProduct,
        removeReturnProduct,
        updateReturnProductQuantity,
        addProductFromSearch,
        removeNewProduct,
        updateNewProductQuantity,
        updateNewProductDiscount,
        calculateTotals,
        handleSave,
    };
};
