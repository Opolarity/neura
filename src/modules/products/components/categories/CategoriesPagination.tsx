import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CategoriesPagination as PaginationType } from '../../types/Categories.type';

interface CategoriesPaginationProps {
  pagination: PaginationType;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const pageSizeOptions = [20, 50, 100];

export const CategoriesPagination = ({
  pagination,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: CategoriesPaginationProps) => {
  const totalPages = Math.ceil(pagination.total / pageSize);
  const currentPage = pagination.page;
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, pagination.total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      {/* Page size selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Mostrar</span>
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="w-[80px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">por página</span>
      </div>

      {/* Results info */}
      <div className="text-sm text-muted-foreground">
        Mostrando {pagination.total > 0 ? startItem : 0} - {endItem} de {pagination.total} categorías
      </div>

      {/* Page navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>

        <span className="text-sm px-3">
          Página {currentPage} de {totalPages || 1}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
