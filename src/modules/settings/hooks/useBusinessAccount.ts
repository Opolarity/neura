import { useEffect, useState } from "react";
import {
  BusinessAccount,
  BusinessAccountFilters,
  BusinessAccountPayload,
} from "../types/BusinessAccount.types";
import {
  createBusinessAccountApi,
  deleteBusinessAccountApi,
  getBusinessAccountsApi,
  updateBusinessAccountApi,
} from "../services/BusinessAccount.services";
import { getBusinessAccountsAdapter } from "../adapters/BusinessAccount.adapter";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useBusinessAccount = () => {
  const [businessAccounts, setBusinessAccounts] = useState<BusinessAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingItem, setEditingItem] = useState<BusinessAccount | null>(null);
  const [itemToDelete, setItemToDelete] = useState<BusinessAccount | null>(null);
  const [openFormModal, setOpenFormModal] = useState(false);
  const [accountId, setAccountId] = useState<number | null>(null);
  const [filters, setFilters] = useState<Omit<BusinessAccountFilters, "account_id">>({
    page: 1,
    size: 20,
  });
  const [pagination, setPagination] = useState<PaginationState>({
    p_page: 1,
    p_size: 20,
    total: null,
  });

  const handleEditItemChange = (item: BusinessAccount | null) => {
    setEditingItem(item);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpenFormModal(isOpen);
  };

  const load = async (
    accId: number,
    newFilters?: Omit<BusinessAccountFilters, "account_id">
  ): Promise<void> => {
    try {
      const res = await getBusinessAccountsApi({
        account_id: accId,
        ...(newFilters ?? filters),
      });
      const { data, pagination } = getBusinessAccountsAdapter(res);
      setBusinessAccounts(data);
      setPagination(pagination);
    } catch (error) {
      console.error(error);
    }
  };

  const loadInitial = async (): Promise<void> => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.id) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("account_id")
        .eq("UID", session.user.id)
        .single();

      if (!profile?.account_id) return;

      setAccountId(profile.account_id);
      await load(profile.account_id);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitial();
  }, []);

  const saveBusinessAccount = async (payload: BusinessAccountPayload) => {
    setSaving(true);
    try {
      const isUpdate = payload.id != null;
      if (isUpdate) {
        await updateBusinessAccountApi(payload);
      } else {
        await createBusinessAccountApi(payload);
      }
      if (accountId) await load(accountId);
      toast.success(
        isUpdate
          ? "Cuenta de negocio actualizada correctamente"
          : "Cuenta de negocio creada correctamente"
      );
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar la cuenta de negocio");
    } finally {
      setSaving(false);
      setOpenFormModal(false);
    }
  };

  const deleteBusinessAccount = async (id: number) => {
    setIsDeleting(true);
    try {
      await deleteBusinessAccountApi(id);
      if (accountId) await load(accountId);
      toast.success("Cuenta de negocio eliminada correctamente");
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar la cuenta de negocio");
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  const handlePageChange = async (page: number) => {
    const newFilters = { ...filters, page };
    if (accountId) await load(accountId, newFilters);
    setPagination((prev) => ({ ...prev, p_page: page }));
    setFilters((prev) => ({ ...prev, page }));
  };

  const handlePageSizeChange = async (size: number) => {
    const newFilters = { ...filters, size, page: 1 };
    if (accountId) await load(accountId, newFilters);
    setPagination((prev) => ({ ...prev, p_size: size, p_page: 1 }));
    setFilters((prev) => ({ ...prev, size, page: 1 }));
  };

  return {
    businessAccounts,
    editingItem,
    itemToDelete,
    openFormModal,
    loading,
    saving,
    isDeleting,
    pagination,
    handleEditItemChange,
    setItemToDelete,
    saveBusinessAccount,
    deleteBusinessAccount,
    handleOpenChange,
    handlePageChange,
    handlePageSizeChange,
  };
};
