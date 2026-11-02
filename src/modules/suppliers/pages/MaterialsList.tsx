import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { useMaterials } from "../hooks/useMaterials";
import { MaterialsFilterBar } from "../components/materials/MaterialsFilterBar";
import { MaterialsFilterModal } from "../components/materials/MaterialsFilterModal";
import { MaterialsTable } from "../components/materials/MaterialsTable";
import {
  materialClassesApi,
  supplierOptionsApi,
} from "../services/materials.service";
import {
  Material,
  MaterialClass,
  SupplierOption,
} from "../types/materials.types";
import MaterialsHeader from "../components/materials/MaterialsHeader";
import { MaterialDeleteDialog } from "../components/materials/MaterialDeleteDialog";

const MaterialsList = () => {
  const navigate = useNavigate();
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const [classes, setClasses] = useState<MaterialClass[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);

  const {
    materials,
    pagination,
    loading,
    search,
    filters,
    hasActiveFilters,
    handleSearchChange,
    handleApplyFilters,
    handlePageChange,
    handlePageSizeChange,
    deleteTarget,
    setDeleteTarget,
    deleting,
    confirmDelete,
  } = useMaterials();

  // Catálogos para la barra de filtros
  useEffect(() => {
    const loadFilterCatalogs = async () => {
      try {
        const [materialClasses, supplierList] = await Promise.all([
          materialClassesApi(),
          supplierOptionsApi(),
        ]);
        setClasses(materialClasses);
        setSuppliers(supplierList);
      } catch (error) {
        console.error(error);
      }
    };
    loadFilterCatalogs();
  }, []);

  // La ficha es una pagina: entre datos, stock por almacen e historial de
  // precios ya no cabia en un modal.
  const openCreate = () => navigate("/suppliers/materials/new");

  const openEdit = (material: Material) =>
    navigate(`/suppliers/materials/${material.id}`);

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <MaterialsHeader onCreate={openCreate} />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="!p-4">
          <MaterialsFilterBar
            search={search}
            onSearchChange={handleSearchChange}
            onOpen={() => setFilterModalOpen(true)}
            hasActiveFilters={hasActiveFilters}
          />
        </CardHeader>

        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          <MaterialsTable
            materials={materials}
            loading={loading}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
          />
        </CardContent>

        <CardFooter className="!p-0">
          <PaginationBar
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardFooter>
      </Card>

      <MaterialsFilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onApply={handleApplyFilters}
        filters={filters}
        classes={classes}
        suppliers={suppliers}
      />

      <MaterialDeleteDialog
        target={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        deleting={deleting}
      />

    </div>
  );
};

export default MaterialsList;
