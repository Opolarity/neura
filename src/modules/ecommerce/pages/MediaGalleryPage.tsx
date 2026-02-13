import { useState } from "react";
import { ImageIcon } from "lucide-react";
import MediaDropzone from "../components/MediaDropzone";
import MediaGrid from "../components/MediaGrid";
import MediaDetailDialog from "../components/MediaDetailDialog";
import { useMedios } from "../hooks/useMedios";
import type { Medio } from "../types/medios.types";

const MediaGalleryPage = () => {
  const { medios, loading, uploading, handleUpload, handleDelete } = useMedios();
  const [selectedMedio, setSelectedMedio] = useState<Medio | null>(null);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <ImageIcon className="h-6 w-6 text-foreground" />
        <h1 className="text-2xl font-bold text-foreground">Galería de Medios</h1>
      </div>

      <MediaDropzone onUpload={handleUpload} uploading={uploading} />

      <MediaGrid
        medios={medios}
        loading={loading}
        onSelect={setSelectedMedio}
        onDelete={handleDelete}
      />

      <MediaDetailDialog
        medio={selectedMedio}
        open={!!selectedMedio}
        onClose={() => setSelectedMedio(null)}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default MediaGalleryPage;
