import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { useExplosions } from "../hooks/useExplosions";
import { ExplosionsFilterBar } from "../components/explosions/ExplosionsFilterBar";
import { ExplosionsFilterModal } from "../components/explosions/ExplosionsFilterModal";
import { ExplosionsTable } from "../components/explosions/ExplosionsTable";
import { Explosion } from "../types/explosions.types";
import ExplosionsHeader from "../components/explosions/ExplosionsHeader";
import { categoriesListApi } from "@/modules/products/services/Categories.service";
import { SimpleCategory } from "@/modules/products/types/Categories.types";

const ExplosionsList = () => {
  const navigate = useNavigate();
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [categories, setCategories] = useState<SimpleCategory[]>([]);

  const {
    explosions,
    pagination,
    loading,
    search,
    filters,
    hasActiveFilters,
    handleSearchChange,
    handleApplyFilters,
    handlePageChange,
    handlePageSizeChange,
  } = useExplosions();

  // Catálogo para el modal de filtros. Las categorías salen del módulo de
  // productos: son las mismas que etiquetan la prenda, no un catálogo propio
  // de desarrollos.
  useEffect(() => {
    categoriesListApi().then(setCategories).catch(console.error);
  }, []);

  const openEdit = (explosion: Explosion) =>
    navigate(`/suppliers/explosions/${explosion.id}`);

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <ExplosionsHeader onCreate={() => navigate("/suppliers/explosions/new")} />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="!p-4">
          <ExplosionsFilterBar
            search={search}
            onSearchChange={handleSearchChange}
            onOpen={() => setFilterModalOpen(true)}
            hasActiveFilters={hasActiveFilters}
          />
        </CardHeader>

        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          <ExplosionsTable
            explosions={explosions}
            loading={loading}
            onEdit={openEdit}
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

      <ExplosionsFilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onApply={handleApplyFilters}
        filters={filters}
        categories={categories}
      />
    </div>
  );
};

export default ExplosionsList;
