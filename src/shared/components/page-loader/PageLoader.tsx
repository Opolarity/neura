import React from 'react';
import LoaderContent from '@/shared/components/loader/LoaderContent';

interface PageLoaderProps {
  message?: string;
}

// Mismo aspecto que el splash de arranque, pero anclado al <main relative> del
// DashboardLayout: cubre sólo el área de contenido y deja el sidebar y el
// header visibles y usables.
const PageLoader: React.FC<PageLoaderProps> = ({ message = "Cargando..." }) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-background">
      <LoaderContent message={message} />
    </div>
  );
};

export default PageLoader;
