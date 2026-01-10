import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface PaginationProps {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

function Pagination({ total, page, pageSize, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize) || 1;
  const startRecord = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-row items-center gap-2 bg-white p-1 rounded-full border border-gray-100 shadow-sm">
      <Button
        variant="ghost"
        size="icon"
        className="w-9 h-9 rounded-full hover:bg-slate-100 text-slate-500 transition-colors disabled:opacity-30"
        onClick={() => onPageChange(1)}
        disabled={page === 1}
      >
        <ChevronsLeft className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="w-9 h-9 rounded-full hover:bg-slate-100 text-slate-500 transition-colors disabled:opacity-30"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      <div className="px-3 py-1 bg-cyan-50/50 rounded-full">
        <span className="text-xs font-medium text-slate-600">
          {startRecord} - {endRecord} de {total}
        </span>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="w-9 h-9 rounded-full hover:bg-slate-100 text-slate-500 transition-colors disabled:opacity-30"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="w-9 h-9 rounded-full hover:bg-slate-100 text-slate-500 transition-colors disabled:opacity-30"
        onClick={() => onPageChange(totalPages)}
        disabled={page === totalPages}
      >
        <ChevronsRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

export default Pagination;
