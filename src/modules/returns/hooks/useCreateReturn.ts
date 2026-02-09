import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { returnsService } from "../services/Returns.service";
import {
    Order,
    OrderProduct,
    ReturnProduct,
    ExchangeProduct,
    ReturnType,
    Situation
} from "../types/Returns.types";

export const useCreateReturn = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showOrderModal, setShowOrderModal] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [returnTypes, setReturnTypes] = useState<ReturnType[]>([]);
    const [situations, setSituations] = useState<Situation[]>([]);
    const [documentTypes, setDocumentTypes] = useState<any[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [selectedReturnType, setSelectedReturnType] = useState<string>("");
    const [returnTypeCode, setReturnTypeCode] = useState<string>("");
    const [orderProducts, setOrderProducts] = useState<OrderProduct[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [moduleId, setModuleId] = useState<number>(0);
    const [userProfile, setUserProfile] = useState<any>(null);

    // Form fields
    const [reason, setReason] = useState("");
    const [documentType, setDocumentType] = useState("");
    const [documentNumber, setDocumentNumber] = useState("");
    const [shippingReturn, setShippingReturn] = useState(false);
    const [shippingCost, setShippingCost] = useState<number>(0);
    const [situationId, setSituationId] = useState("");
    const [paymentMethodId, setPaymentMethodId] = useState("");
    const [returnProducts, setReturnProducts] = useState<ReturnProduct[]>([]);
    const [exchangeProducts, setExchangeProducts] = useState<ExchangeProduct[]>([]);

    // Product search for exchanges
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedVariation, setSelectedVariation] = useState<any>(null);
    const [open, setOpen] = useState(false);

    // Order search and pagination
    const [orderSearch, setOrderSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuario no autenticado");

            // Get user profile
            const { data: profileData } = await supabase
                .from("profiles")
                .select("*, branches(*)")
                .eq("UID", user.id)
                .single();

            setUserProfile(profileData);

            // Get data via service
            const ordersData = await returnsService.getOrders(user.id);
            const returnsData = await returnsService.getExistingReturns();
            const returnedOrderIds = new Set((returnsData || []).map((r: any) => r.order_id));
            const availableOrders = ordersData.filter(order => !returnedOrderIds.has(order.id));

            const moduleData = await returnsService.getModuleInfo("RTU");
            setModuleId(moduleData.id);

            const typesData = await returnsService.getTypes(moduleData.id);
            const situationsData = await returnsService.getSituations(moduleData.id);
            const docTypesData = await returnsService.getDocumentTypes();
            const paymentMethodsData = await returnsService.getPaymentMethods();

            // Get products for exchange
            const { data: productsData } = await supabase.functions.invoke("get-products-list");

            setOrders(availableOrders);
            setReturnTypes(typesData);
            setSituations(
                (situationsData || []).map((s: any) => ({
                    ...s,
                    code: s.code || s.statuses?.code,
                    status_id: s.status_id,
                }))
            );
            setDocumentTypes(docTypesData);
            setPaymentMethods(paymentMethodsData);
            setProducts(productsData?.products || []);
        } catch (error: any) {
            console.error("Error loading data:", error);
            toast.error("Error al cargar los datos");
        } finally {
            setLoading(false);
        }
    };

    const handleOrderSelect = async () => {
        if (!selectedOrder || !selectedReturnType) {
            toast.error("Debe seleccionar una orden y un tipo de devolución");
            return;
        }

        const selectedType = returnTypes.find((t) => t.id === parseInt(selectedReturnType));
        setReturnTypeCode(selectedType?.code || "");

        try {
            const orderProductsData = await returnsService.getOrderProducts(selectedOrder.id);
            setOrderProducts(orderProductsData || []);
            setDocumentType(selectedOrder.document_type.toString());
            setDocumentNumber(selectedOrder.document_number);
            setShippingCost(selectedOrder.shipping_cost || 0);

            if (selectedType?.code === "DVT") {
                const allProducts: ReturnProduct[] = (orderProductsData || []).map((p: any) => ({
                    product_variation_id: p.product_variation_id,
                    quantity: p.quantity,
                    product_name: p.variations.products.title,
                    sku: p.variations.sku,
                    price: p.product_price * (1 - p.product_discount / 100),
                    output: false,
                    maxQuantity: p.quantity,
                }));
                setReturnProducts(allProducts);
            }

            setShowOrderModal(false);
        } catch (error) {
            console.error("Error loading order products:", error);
            toast.error("Error al cargar los productos de la orden");
        }
    };

    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            const searchTerm = orderSearch.toLowerCase();
            return (
                order.document_number.toLowerCase().includes(searchTerm) ||
                order.customer_name?.toLowerCase().includes(searchTerm) ||
                order.customer_lastname?.toLowerCase().includes(searchTerm)
            );
        });
    }, [orders, orderSearch]);

    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const paginatedOrders = useMemo(() => {
        return filteredOrders.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage
        );
    }, [filteredOrders, currentPage, itemsPerPage]);

    const allVariations = useMemo(() => {
        if (!products) return [];
        return products.flatMap((product) =>
            product.variations.map((variation: any) => ({
                ...variation,
                product_id: product.id,
                product_title: product.title,
            }))
        );
    }, [products]);

    const filteredVariations = useMemo(() => {
        if (!searchQuery) return allVariations;
        const query = searchQuery.toLowerCase();
        return allVariations.filter((variation) => {
            const productTitle = variation.product_title.toLowerCase();
            const sku = variation.sku?.toLowerCase() || "";
            const termsNames = variation.terms?.map((t: any) => t.terms.name.toLowerCase()).join(" ") || "";
            return productTitle.includes(query) || sku.includes(query) || termsNames.includes(query);
        });
    }, [allVariations, searchQuery]);

    const toggleReturnProduct = (product: OrderProduct, quantity: number) => {
        const existing = returnProducts.find(
            (p) => p.product_variation_id === product.product_variation_id
        );

        if (quantity === 0 && existing) {
            setReturnProducts(
                returnProducts.filter((p) => p.product_variation_id !== product.product_variation_id)
            );
        } else if (quantity > 0) {
            const newProduct: ReturnProduct = {
                product_variation_id: product.product_variation_id,
                quantity,
                product_name: product.variations.products.title,
                sku: product.variations.sku,
                price: product.product_price * (1 - product.product_discount / 100),
                output: false,
                maxQuantity: product.quantity,
            };

            if (existing) {
                setReturnProducts(
                    returnProducts.map((p) =>
                        p.product_variation_id === product.product_variation_id ? newProduct : p
                    )
                );
            } else {
                setReturnProducts([...returnProducts, newProduct]);
            }
        }
    };

    const addExchangeProduct = () => {
        if (!selectedVariation) {
            toast.error("Debe seleccionar un producto");
            return;
        }

        const termsNames = selectedVariation.terms?.map((t: any) => t.terms.name).join(" - ") || "";
        const newProduct: ExchangeProduct = {
            variation_id: selectedVariation.id,
            product_name: selectedVariation.product_title,
            variation_name: termsNames,
            sku: selectedVariation.sku || "",
            quantity: 1,
            price: selectedVariation.prices?.[0]?.price || 0,
            discount: 0,
            linked_return_index: null,
        };

        setExchangeProducts([...exchangeProducts, newProduct]);
        setSelectedVariation(null);
        setSearchQuery("");
        setOpen(false);
    };

    const removeExchangeProduct = (index: number) => {
        setExchangeProducts(exchangeProducts.filter((_, i) => i !== index));
    };

    const updateExchangeProduct = (index: number, field: string, value: any) => {
        setExchangeProducts(
            exchangeProducts.map((p, i) => (i === index ? { ...p, [field]: value } : p))
        );
    };

    const calculateReturnTotal = () => {
        return returnProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);
    };

    const calculateExchangeTotal = () => {
        return exchangeProducts.reduce((sum, p) => {
            const discountedPrice = p.price * (1 - p.discount / 100);
            return sum + discountedPrice * p.quantity;
        }, 0);
    };

    const calculateDifference = () => {
        const returnTotal = calculateReturnTotal();
        const exchangeTotal = calculateExchangeTotal();
        return returnTotal - exchangeTotal;
    };

    const getSelectedSituation = () => {
        return situations.find((s) => s.id === parseInt(situationId));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedOrder || !selectedReturnType || !situationId) {
            toast.error("Complete todos los campos requeridos");
            return;
        }

        if (!paymentMethodId) {
            toast.error("Seleccione un método de pago");
            return;
        }

        if (returnProducts.length === 0) {
            toast.error("Debe seleccionar al menos un producto a devolver");
            return;
        }

        setSaving(true);

        try {
            const selectedSituation = getSelectedSituation();
            const situationCode = selectedSituation?.code || "VIR";

            let totalRefundAmount = 0;
            let totalExchangeDifference = 0;

            if (returnTypeCode === "DVT" || returnTypeCode === "DVP") {
                totalRefundAmount = calculateReturnTotal();
            } else if (returnTypeCode === "CAM") {
                const difference = calculateDifference();
                if (difference >= 0) {
                    totalRefundAmount = difference;
                } else {
                    totalExchangeDifference = Math.abs(difference);
                }
            }

            const returnProductsPayload = returnProducts.map((p) => ({
                product_variation_id: p.product_variation_id,
                quantity: p.quantity,
                product_amount: p.price,
                output: false,
            }));

            const exchangeProductsPayload = exchangeProducts.map((p) => ({
                product_variation_id: p.variation_id,
                quantity: p.quantity,
                product_amount: p.price * (1 - p.discount / 100),
                output: true,
                vinculated_index: p.linked_return_index,
            }));

            const allProducts = [...returnProductsPayload, ...exchangeProductsPayload];

            const payload = {
                order_id: selectedOrder.id,
                return_type_id: parseInt(selectedReturnType),
                return_type_code: returnTypeCode,
                customer_document_number: documentNumber,
                customer_document_type_id: parseInt(documentType),
                reason,
                shipping_return: shippingReturn,
                shipping_cost: shippingReturn ? shippingCost : 0,
                situation_id: parseInt(situationId),
                situation_code: situationCode,
                status_id: selectedSituation?.status_id || 1,
                module_id: moduleId,
                total_refund_amount: totalRefundAmount,
                total_exchange_difference: totalExchangeDifference,
                return_products: allProducts,
                payment_method_id: parseInt(paymentMethodId),
                business_account_id: paymentMethods.find(pm => pm.id === parseInt(paymentMethodId))?.business_account_id || 1,
                branch_id: userProfile?.branch_id || 1,
                warehouse_id: userProfile?.warehouse_id || 1,
            };

            const data = await returnsService.createReturn(payload);

            if (!data?.success) throw new Error(data?.error || "Error al crear la devolución");

            toast.success("Devolución/Cambio creado exitosamente");
            navigate("/returns");
        } catch (error: any) {
            console.error("Error creating return:", error);
            toast.error(error.message || "Error al crear la devolución/cambio");
        } finally {
            setSaving(false);
        }
    };

    return {
        loading,
        saving,
        showOrderModal,
        setShowOrderModal,
        orders,
        returnTypes,
        situations,
        documentTypes,
        paymentMethods,
        selectedOrder,
        setSelectedOrder,
        selectedReturnType,
        setSelectedReturnType,
        returnTypeCode,
        orderProducts,
        products,
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
        paymentMethodId,
        setPaymentMethodId,
        returnProducts,
        exchangeProducts,
        searchQuery,
        setSearchQuery,
        selectedVariation,
        setSelectedVariation,
        open,
        setOpen,
        orderSearch,
        setOrderSearch,
        currentPage,
        setCurrentPage,
        totalPages,
        paginatedOrders,
        filteredVariations,
        handleOrderSelect,
        toggleReturnProduct,
        addExchangeProduct,
        removeExchangeProduct,
        updateExchangeProduct,
        calculateReturnTotal,
        calculateExchangeTotal,
        calculateDifference,
        handleSubmit
    };
};
