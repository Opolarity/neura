import { useState } from "react";
import MediaDropzone from "../components/MediaDropzone";
import MediaGrid from "../components/MediaGrid";
import MediaDetailDialog from "../components/MediaDetailDialog";
import MediaGalleryHeader from "../components/MediaGalleryHeader";
import MediaGalleryFilterModal from "../components/MediaGalleryFilterModal";
import { useMedios } from "../hooks/useMedios";
import { useMediaGallery } from "../hooks/useMediaGallery";
import type { Medio } from "../types/medios.types";
import type { MediaGalleryItem } from "../types/MediaGallery.types";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ComponentPermission } from "@/shared/components/component-permission";

const toMedio = (item: MediaGalleryItem): Medio => ({
  id: item.id,
  name: item.name,
  url: item.url,
  mimetype: item.mimetype,
  created_at: item.createdAt,
  created_by: item.createdBy,
});

const MediaGalleryPage = () => {
  const { uploading, handleUpload, handleDelete } = useMedios();
  const {
    items,
    loading,
    pagination,
    filters,
    onPageChange,
    handlePageSizeChange,
    applyFilters,
    refetch,
  } = useMediaGallery();

  const [selectedMedio, setSelectedMedio] = useState<Medio | null>(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const medios = items.map(toMedio);

  const hasActiveFilters = !!(filters.startDate || filters.endDate);

  const handleDelete_ = async (medio: Medio) => {
    await handleDelete(medio);
    refetch();
  };

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <MediaGalleryHeader
        onOpenFilters={() => setFilterModalOpen(true)}
        hasActiveFilters={hasActiveFilters}
      />

      {/* La dropzone entera es el control de subida —el área completa es
          clicable y acepta drag&drop—, así que se oculta como un bloque. */}
      <ComponentPermission codeIn={["ecommerce_media.create"]}>
        <MediaDropzone onUpload={handleUpload} uploading={uploading} />
      </ComponentPermission>

      {/* Sin CardHeader: la galería no tiene barra de filtros dentro de la Card.
          Solo el grid scrollea; la paginación queda fija en el footer. */}
      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardContent className="p-4 flex-1 min-h-0 overflow-y-auto">
          <MediaGrid
            medios={medios}
            loading={loading}
            onSelect={setSelectedMedio}
            onDelete={handleDelete_}
          />
        </CardContent>

        <CardFooter className="!p-0">
          <PaginationBar
            pagination={pagination}
            onPageChange={onPageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardFooter>
      </Card>

      <MediaDetailDialog
        medio={selectedMedio}
        open={!!selectedMedio}
        onClose={() => setSelectedMedio(null)}
        onDelete={handleDelete_}
      />

      <MediaGalleryFilterModal
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        filters={filters}
        onApply={applyFilters}
      />
    </div>
  );
};

export default MediaGalleryPage;
