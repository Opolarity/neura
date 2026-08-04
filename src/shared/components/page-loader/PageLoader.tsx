import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/utils/utils';

interface PageLoaderProps {
  message?: string;
  className?: string;
}

const PageLoader: React.FC<PageLoaderProps> = ({ message = "Cargando...", className }) => {
  return (
    <div className={cn("absolute inset-0 z-50 flex items-center justify-center bg-background/80", className)}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        {message && <p className="text-muted-foreground text-sm">{message}</p>}
      </div>
    </div>
  );
};

export default PageLoader;
