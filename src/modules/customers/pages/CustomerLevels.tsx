import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import CustomerLevelsHeader from "@/modules/customers/components/customer-levels/CustomerLevelsHeader";
import CustomerLevelsTable from "@/modules/customers/components/customer-levels/CustomerLevelsTable";
import { CustomerLevelFormDialog } from "@/modules/customers/components/customer-levels/CustomerLevelFormDialog";
import { CustomerLevelDeleteDialog } from "@/modules/customers/components/customer-levels/CustomerLevelDeleteDialog";
import { useCustomerLevels } from "@/modules/customers/hooks/useCustomerLevels";
import { deactivateCustomerLevel, saveCustomerLevel } from "@/modules/customers/services/customerLevels.service";
import { toastError } from "@/shared/utils/toastError";
import type { CustomerLevel, CustomerLevelPayload } from "@/modules/customers/types/customerLevels.types";

export default function CustomerLevels() {
  const { levels, isLoading, error, reload } = useCustomerLevels();
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [isOpenDelete, setIsOpenDelete] = useState(false);
  const [editLevel, setEditLevel] = useState<CustomerLevel | undefined>(undefined);
  const [deleteLevel, setDeleteLevel] = useState<CustomerLevel | undefined>(undefined);

  const handleOpenCreate = () => {
    setEditLevel(undefined);
    setIsOpenForm(true);
  };

  const handleOpenEdit = (level: CustomerLevel) => {
    setEditLevel(level);
    setIsOpenForm(true);
  };

  const handleOpenDelete = (level: CustomerLevel) => {
    setDeleteLevel(level);
    setIsOpenDelete(true);
  };

  // El error del RPC (solape, decimales, rango) se propaga hasta el hook del
  // formulario, que lo muestra con toastError; aqui solo recargamos al terminar.
  const handleSave = async (payload: CustomerLevelPayload) => {
    await saveCustomerLevel(payload);
    reload();
  };

  const handleConfirmDelete = async () => {
    if (!deleteLevel) return;
    try {
      await deactivateCustomerLevel(deleteLevel);
      setIsOpenDelete(false);
      setTimeout(() => setDeleteLevel(undefined), 300);
      reload();
    } catch (err) {
      toastError(err, "No se pudo desactivar el nivel");
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <CustomerLevelsHeader onOpen={handleOpenCreate} />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardContent className="p-0 flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <CustomerLevelsTable
              levels={levels}
              isLoading={isLoading}
              error={error}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
            />
          </div>
        </CardContent>
      </Card>

      <CustomerLevelFormDialog
        open={isOpenForm}
        onOpenChange={(open) => {
          setIsOpenForm(open);
          if (!open) setTimeout(() => setEditLevel(undefined), 300);
        }}
        onSave={handleSave}
        editLevel={editLevel}
      />

      <CustomerLevelDeleteDialog
        open={isOpenDelete}
        onOpenChange={setIsOpenDelete}
        levelName={deleteLevel?.name}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
