import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useSuppliers } from "../hooks/useSuppliers";
import { SuppliersFilterBar } from "../components/suppliers/SuppliersFilterBar";
import { SuppliersTable } from "../components/suppliers/SuppliersTable";
import { AddSupplierModal } from "../components/suppliers/AddSupplierModal";
import { EditSupplierModal } from "../components/suppliers/EditSupplierModal";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import SuppliersHeader from "../components/suppliers/SuppliersHeader";
import { Supplier } from "../types/suppliers.types";

const SuppliersList = () => {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);

  const {
    suppliers,
    pagination,
    loading,
    search,
    handleSearchChange,
    handlePageChange,
    handlePageSizeChange,
    reload,
  } = useSuppliers();

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <SuppliersHeader onCreate={() => setAddModalOpen(true)} />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader>
          <SuppliersFilterBar search={search} onSearchChange={handleSearchChange} />
        </CardHeader>
        <CardContent className="p-0 flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-hidden">
            <SuppliersTable
              suppliers={suppliers}
              loading={loading}
              onEdit={setEditing}
            />
          </div>
          <PaginationBar
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardContent>
      </Card>

      {/* Modal de creación — se monta al abrir para partir con el formulario limpio */}
      {addModalOpen && (
        <AddSupplierModal
          open={addModalOpen}
          onOpenChange={setAddModalOpen}
          onCreated={reload}
        />
      )}

      {/* Edición — igual, se monta con el proveedor elegido para que el
          formulario arranque con SUS datos y no con los del anterior. */}
      {editing && (
        <EditSupplierModal
          open
          onOpenChange={(open) => !open && setEditing(null)}
          supplier={editing}
          onSaved={reload}
        />
      )}
    </div>
  );
};

export default SuppliersList;
