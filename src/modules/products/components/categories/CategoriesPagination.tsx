import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
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
  const { page, total } = pagination;
  const totalPages = Math.ceil(total / pageSize);
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className="flex items-center justify-center gap-4 py-4">
      {/* Selector de tamaño de página */}
      <Select
        value={pageSize.toString()}
        onValueChange={(value) => onPageSizeChange(Number(value))}
      >
        <SelectTrigger className="w-[80px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {pageSizeOptions.map((option) => (
            <SelectItem key={option} value={option.toString()}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Controles de paginación */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onPageChange(1)}
          disabled={!canGoPrevious}
          className="h-8 w-8"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onPageChange(page - 1)}
          disabled={!canGoPrevious}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Indicador de página */}
        <span className="text-sm text-muted-foreground px-2">
          {startItem} a {endItem} de {total}
        </span>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoNext}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onPageChange(totalPages)}
          disabled={!canGoNext}
          className="h-8 w-8"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
