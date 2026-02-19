import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { returnsService } from "../services/Returns.service";
import { typesByModuleCode } from "@/shared/services/service";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import {
    Order,
    OrderProduct,
    ReturnProduct,
    ExchangeProduct,
    ReturnType,
    Situation,
    ReturnPayment,
} from "../types/Returns.types";

const createEmptyPayment = (): ReturnPayment => ({
    id: crypto.randomUUID(),
    paymentMethodId: "",
    amount: "",
});

export const useCreateReturn = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showOrderModal, setShowOrderModal] = useState(true);
    const [returnTypes, setReturnTypes] = useState<ReturnType[]>([]);
    const [situations, setSituations] = useState<Situation[]>([]);
    const [documentTypes, setDocumentTypes] = useState<any[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [selectedReturnType, setSelectedReturnType] = useState<string>("");
    const [returnTypeCode, setReturnTypeCode] = useState<string>("");
    const [orderProducts, setOrderProducts] = useState<OrderProduct[]>([]);
    const [moduleId, setModuleId] = useState<number>(0);
    const [userProfile, setUserProfile] = useState<any>(null);

    // Form fields
    const [reason, setReason] = useState("");
    const [documentType, setDocumentType] = useState("");
    const [documentNumber, setDocumentNumber] = useState("");
    const [shippingReturn, setShippingReturn] = useState(false);
    const [shippingCost, setShippingCost] = useState<number>(0);
    const [situationId, setSituationId] = useState("");
    const [returnProducts, setReturnProducts] = useState<ReturnProduct[]>([]);
    const [exchangeProducts, setExchangeProducts] = useState<ExchangeProduct[]>([]);

    // Multiple payment methods (same pattern as CreateSale)
    const [payments, setPayments] = useState<ReturnPayment[]>([]);
    const [currentPayment, setCurrentPayment] = useState<ReturnPayment>(createEmptyPayment());

    // Edge function state (used for both CAM and non-CAM order selection)
    const [orderSourceType, setOrderSourceType] = useState<"orders" | "returns">("orders");
    const [edgeSearch, setEdgeSearch] = useState("");
    const [edgePagination, setEdgePagination] = useState<PaginationState>({ p_page: 1, p_size: 20, total: 0 });
    const [edgeItems, setEdgeItems] = useState<any[]>([]);
    const [edgeLoading, setEdgeLoading] = useState(false);
    const [selectedEdgeItem, setSelectedEdgeItem] = useState<any>(null);

    // Derived return type code from selected type (before confirmation)
    const selectedReturnTypeCode = useMemo(() => {
        if (!selectedReturnType) return "";
        return returnTypes.find((t) => t.id === parseInt(selectedReturnType))?.code || "";
    }, [selectedReturnType, returnTypes]);

    // For non-CAM types always fetch orders; for CAM use orderSourceType
    const effectiveSource = selectedReturnTypeCode === "CAM" ? orderSourceType : "orders";

    useEffect(() => {
        loadInitialData();
    }, []);

    // Fetch edge data whenever a type is selected and modal is open
    useEffect(() => {
        if (!showOrderModal || !selectedReturnType) return;
        const source = selectedReturnTypeCode === "CAM" ? orderSourceType : "orders";
        setEdgeSearch("");
        setEdgePagination({ p_page: 1, p_size: 20, total: 0 });
        fetchEdgeData(source, 1, 20, "");
    }, [selectedReturnType, showOrderModal]);

    const loadInitialData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuario no autenticado");

            const { data: profileData } = await supabase
                .from("profiles")
                .select("*, branches(*)")
                .eq("UID", user.id)
                .single();

            setUserProfile(profileData);

            const moduleData = await returnsService.getModuleInfo("RTU");
            setModuleId(moduleData.id);

            const [typesData, situationsData, docTypesData, paymentMethodsData] = await Promise.all([
                typesByModuleCode("RTU"),
                returnsService.getSituations(moduleData.id),
                returnsService.getDocumentTypes(),
                returnsService.getPaymentMethods(),
            ]);

            setReturnTypes(typesData as ReturnType[]);
            setSituations(
                (situationsData || []).map((s: any) => ({
                    ...s,
                    code: s.code || s.statuses?.code,
                    status_id: s.status_id,
                }))
            );
            setDocumentTypes(docTypesData);
            setPaymentMethods(paymentMethodsData);
        } catch (error: any) {
            console.error("Error loading data:", error);
            toast.error("Error al cargar los datos");
        } finally {
            setLoading(false);
        }
    };

    const fetchEdgeData = async (
        source: "orders" | "returns",
        page: number,
        size: number,
        search: string
    ) => {
        setEdgeLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke("get-return-order-and-return", {
                body: {
                    order: source === "orders",
                    returns: source === "returns",
                    size,
                    page,
                    search: search || null,
                },
            });

            if (error) throw error;

            const items = Array.isArray(data) ? data : (data?.data || []);
            const total = data?.total_rows ?? data?.total ?? items.length;

            setEdgeItems(items);
            setEdgePagination({ p_page: page, p_size: size, total });
        } catch (err: any) {
            console.error("Error fetching edge data:", err);
            toast.error("Error al cargar los datos");
        } finally {
            setEdgeLoading(false);
        }
    };

    const handleEdgeSourceChange = (source: "orders" | "returns") => {
        setOrderSourceType(source);
        setSelectedEdgeItem(null);
        setEdgePagination((prev) => ({ ...prev, p_page: 1 }));
        fetchEdgeData(source, 1, edgePagination.p_size, edgeSearch);
    };

    const handleEdgeSearchChange = (search: string) => {
        setEdgeSearch(search);
        setEdgePagination((prev) => ({ ...prev, p_page: 1 }));
        fetchEdgeData(effectiveSource, 1, edgePagination.p_size, search);
    };

    const handleEdgePageChange = (page: number) => {
        setEdgePagination((prev) => ({ ...prev, p_page: page }));
        fetchEdgeData(effectiveSource, page, edgePagination.p_size, edgeSearch);
    };

    const handleEdgePageSizeChange = (size: number) => {
        setEdgePagination((prev) => ({ ...prev, p_size: size, p_page: 1 }));
        fetchEdgeData(effectiveSource, 1, size, edgeSearch);
    };

    const handleEdgeItemSelect = (item: any) => {
        setSelectedEdgeItem(item);
        // Always use item.id: SP distinguishes orders vs CAM-returns by checking both tables
        setSelectedOrder({
            id: item.id,
            document_number: item.document_number || String(item.id),
            customer_name: item.customer_name || item.customer_document_number || "",
            customer_lastname: "",
            total: item.total ?? item.total_refund_amount ?? 0,
            created_at: item.date || item.created_at || "",
            document_type: item.document_type || 1,
            shipping_cost: item.shipping_cost || null,
        });
    };

    const handleOrderSelect = async () => {
        if (!selectedOrder || !selectedReturnType) {
            toast.error("Debe seleccionar una orden y un tipo de devolución");
            return;
        }

        const selectedType = returnTypes.find((t) => t.id === parseInt(selectedReturnType));
        setReturnTypeCode(selectedType?.code || "");

        try {
            // When CAM selects from an existing return, fetch returns_products; otherwise order_products
            const isFromReturn = selectedType?.code === "CAM" && orderSourceType === "returns";
            const orderProductsData = isFromReturn
                ? await returnsService.getReturnProductsForDisplay(selectedOrder.id)
                : await returnsService.getOrderProducts(selectedOrder.id);
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

    // ── Payment methods ────────────────────────────────────────────────────────
    const addPayment = useCallback(() => {
        if (!currentPayment.paymentMethodId || !currentPayment.amount) {
            toast.error("Seleccione un método de pago y monto");
            return;
        }
        const amount = parseFloat(currentPayment.amount);
        if (isNaN(amount) || amount <= 0) {
            toast.error("El monto debe ser mayor a cero");
            return;
        }
        setPayments((prev) => [...prev, { ...currentPayment, id: crypto.randomUUID() }]);
        setCurrentPayment(createEmptyPayment());
    }, [currentPayment]);

    const removePayment = useCallback((id: string) => {
        setPayments((prev) => prev.filter((p) => p.id !== id));
    }, []);

    // ── Return products ────────────────────────────────────────────────────────
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

    // ── Exchange products ──────────────────────────────────────────────────────
    const addExchangeProduct = (product: any) => {
        const termsNames = product.terms?.map((t: any) => t.name).join(" - ") || "";
        const newProduct: ExchangeProduct = {
            variation_id: product.variationId,
            product_name: product.productTitle,
            variation_name: termsNames,
            sku: product.sku || "",
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

    // ── Totals ─────────────────────────────────────────────────────────────────
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
        return calculateReturnTotal() - calculateExchangeTotal();
    };

    const getSelectedSituation = () => {
        return situations.find((s) => s.id === parseInt(situationId));
    };

    // ── Submit ─────────────────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedOrder || !selectedReturnType || !situationId) {
            toast.error("Complete todos los campos requeridos");
            return;
        }

        const validPayments = payments.filter((p) => p.paymentMethodId && p.amount);
        //if (validPayments.length === 0) {
        //    toast.error("Agregue al menos un método de pago");
        //    return;
        //}

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

            const getBusinessAccountId = (methodId: string) =>
                paymentMethods.find((pm) => pm.id === parseInt(methodId))?.business_account_id || null;

            const firstPayment = validPayments[0] ?? null;

            const payload = {
                module_code: "RTU",
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
                payment_method_id: firstPayment ? parseInt(firstPayment.paymentMethodId) : null,
                business_account_id: firstPayment ? getBusinessAccountId(firstPayment.paymentMethodId) : null,
                payments: validPayments.map((p) => ({
                    payment_method_id: parseInt(p.paymentMethodId),
                    amount: parseFloat(p.amount),
                    business_account_id: getBusinessAccountId(p.paymentMethodId),
                })),
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
        returnTypes,
        situations,
        documentTypes,
        paymentMethods,
        selectedOrder,
        setSelectedOrder,
        selectedReturnType,
        setSelectedReturnType,
        selectedReturnTypeCode,
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
        payments,
        currentPayment,
        setCurrentPayment,
        addPayment,
        removePayment,
        returnProducts,
        exchangeProducts,
        orderSourceType,
        edgeSearch,
        edgePagination,
        edgeItems,
        edgeLoading,
        selectedEdgeItem,
        handleEdgeSourceChange,
        handleEdgeSearchChange,
        handleEdgePageChange,
        handleEdgePageSizeChange,
        handleEdgeItemSelect,
        handleOrderSelect,
        toggleReturnProduct,
        addExchangeProduct,
        removeExchangeProduct,
        updateExchangeProduct,
        calculateReturnTotal,
        calculateExchangeTotal,
        calculateDifference,
        handleSubmit,
    };
};
