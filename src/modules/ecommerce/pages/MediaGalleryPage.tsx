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
    <div className="space-y-6 p-6">
      <MediaGalleryHeader
        onOpenFilters={() => setFilterModalOpen(true)}
        hasActiveFilters={hasActiveFilters}
      />

      <MediaDropzone onUpload={handleUpload} uploading={uploading} />

      <MediaGrid
        medios={medios}
        loading={loading}
        onSelect={setSelectedMedio}
        onDelete={handleDelete_}
      />

      <PaginationBar
        pagination={pagination}
        onPageChange={onPageChange}
        onPageSizeChange={handlePageSizeChange}
      />

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
