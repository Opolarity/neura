import { Button } from "@/components/ui/button";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react";

export interface PaginationState {
    p_page: number;
    p_size: number;
    total: number;
}

interface PaginationProps {
    pagination: PaginationState;
    onPageChange: (page: number) => void;
}

function Pagination({ pagination, onPageChange }: PaginationProps) {
    const { p_page, p_size, total } = pagination;
    const totalPages = Math.ceil(total / p_size);
    const startItem = total === 0 ? 0 : (p_page - 1) * p_size + 1;
    const endItem = Math.min(p_page * p_size, total);

    const canGoPrevious = p_page > 1;
    const canGoNext = p_page < totalPages;

    return (
        <div className="flex flex-row items-center gap-1">
            <Button
                onClick={() => onPageChange(1)}
                disabled={!canGoPrevious}
                variant="ghost"
                className="w-10 h-10 rounded-full cursor-pointer"
            >
                <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
                onClick={() => onPageChange(p_page - 1)}
                disabled={!canGoPrevious}
                variant="ghost"
                className="w-10 h-10 rounded-full cursor-pointer"
            >
                <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-2">
                {startItem} a {endItem} de {total}
            </span>
            <Button
                onClick={() => onPageChange(p_page + 1)}
                disabled={!canGoNext}
                variant="ghost"
                className="w-10 h-10 rounded-full cursor-pointer"
            >
                <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
                onClick={() => onPageChange(totalPages)}
                disabled={!canGoNext}
                variant="ghost"
                className="w-10 h-10 rounded-full cursor-pointer"
            >
                <ChevronsRight className="w-4 h-4" />
            </Button>
        </div>
    );
}

export default Pagination;
