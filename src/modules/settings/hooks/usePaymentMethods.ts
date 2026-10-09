import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PaymentMethod, PaymentMethodPayload, PaymentMethodsFilters } from '../types/PaymentMethods.types';
import { CreatePaymentMethod, DeletePaymentMethod, getActivePaymentMethods, PaymentMethodsApi, RemovePaymentMethodImage, UpdatePaymentMethod, UploadPaymentMethodImage } from '../services/PaymentMethods.services';
import { PaymentMethodsAdapter } from '../adapters/PaymentMethods.adapter';
import { useToast } from '@/hooks/use-toast';
import { PaginationState } from '@/shared/components/pagination/Pagination';
import { toastError } from "@/shared/utils/toastError";

const usePaymentMethods = () => {
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editingItem, setEditingItem] = useState<PaymentMethod | null>(null);
    const [itemToDelete, setItemToDelete] = useState<PaymentMethod | null>(null);
    const [openFormModal, setOpenFormModal] = useState(false);
    const [filters, setFilters] = useState<PaymentMethodsFilters>({
        page: 1,
        size: 20,
    });
    const [pagination, setPagination] = useState<PaginationState>({
        p_page: 1,
        p_size: 20,
        total: 0,
    });
    const { toast } = useToast();

    const load = async (filtersObj?: PaymentMethodsFilters) => {
        try {
            const dataResponse = await PaymentMethodsApi(filtersObj ?? filters);
            const { data, pagination: paginationData } = PaymentMethodsAdapter(dataResponse);
            setPaymentMethods(data);
            setPagination(paginationData);
        } catch (error) {
            console.error('Error fetching payment methods:', error);
            toastError(error, "No se pudieron cargar los métodos de pago");
        }
    };

    const loadInitial = async () => {
        setLoading(true);
        try {
            await load();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInitial();
    }, []);

    const handleEditItemChange = (item: PaymentMethod | null) => {
        setEditingItem(item);
    };

    const handleOpenChange = (isOpen: boolean) => {
        setOpenFormModal(isOpen);
    };

    const savePaymentMethod = async ({ image, ...payload }: PaymentMethodPayload) => {
        setSaving(true);
        // Si el guardado falla, la imagen recién subida se borra para no dejar
        // archivos sueltos en el bucket.
        let uploadedUrl: string | null = null;
        try {
            const isUpdate = payload.id != null;
            if (image) {
                uploadedUrl = await UploadPaymentMethodImage(image);
                payload.image_url = uploadedUrl;
            }
            if (isUpdate) {
                await UpdatePaymentMethod(payload);
            } else {
                await CreatePaymentMethod(payload as Omit<PaymentMethod, 'id'>);
            }
            // La imagen anterior sobra si se reemplazó o se quitó.
            const previousUrl = editingItem?.image_url;
            if (isUpdate && previousUrl && payload.image_url !== undefined && payload.image_url !== previousUrl) {
                await RemovePaymentMethodImage(previousUrl);
            }
            uploadedUrl = null;
            await load();
            toast({
                title: "Éxito",
                description: isUpdate ? "Método de pago actualizado" : "Método de pago creado",
                variant: "success",
            });
        } catch (error: any) {
            console.error("Error saving payment method:", error);
            toastError(error, "Error al guardar");
            if (uploadedUrl) await RemovePaymentMethodImage(uploadedUrl);
        } finally {
            setSaving(false);
            setOpenFormModal(false);
        }
    };

    const deletePaymentMethod = async (id: number) => {
        setIsDeleting(true);
        try {
            await DeletePaymentMethod(id);
            await load();
            toast({
                title: "Éxito",
                description: "Método de pago eliminado",
                variant: "success",
            });
        } catch (error) {
            console.error("Error deleting payment method:", error);
            toastError(error, "Error al eliminar el método de pago");
        } finally {
            setIsDeleting(false);
            setItemToDelete(null);
        }
    };

    const handlePageChange = async (page: number) => {
        const newFilters = { ...filters, page };
        await load(newFilters);
        setFilters(newFilters);
        setPagination((prev) => ({ ...prev, p_page: page }));
    };

    const handleSizeChange = async (size: number) => {
        const newFilters = { ...filters, size, page: 1 };
        await load(newFilters);
        setFilters(newFilters);
        setPagination((prev) => ({ ...prev, p_size: size, p_page: 1 }));
    };

    return {
        paymentMethods,
        loading,
        saving,
        isDeleting,
        editingItem,
        itemToDelete,
        openFormModal,
        pagination,
        handleEditItemChange,
        setItemToDelete,
        handleOpenChange,
        savePaymentMethod,
        deletePaymentMethod,
        handlePageChange,
        handleSizeChange,
    };
}

export default usePaymentMethods;

export const useActivePaymentMethods = () => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['payment-methods', 'active'],
        queryFn: getActivePaymentMethods,
    });

    return {
        paymentMethods: data ?? [],
        loading: isLoading,
        error,
    };
};
