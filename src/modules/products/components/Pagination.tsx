import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  startRecord: number;
  endRecord: number;
  onPageChange: (page: number) => void;
}

function Pagination({
  page,
  totalPages,
  startRecord,
  endRecord,
  onPageChange,
}: PaginationProps) {
  return (
    <div className="flex flex-row items-center gap-1">
      <Button
        onClick={() => onPageChange(1)}
        disabled={page === 1}
        variant="ghost"
        className="w-10 h-10 rounded-full cursor-pointer"
      >
        <ChevronsLeft className="w-4 h-4" />
      </Button>
      <Button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        variant="ghost"
        className="w-10 h-10 rounded-full cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      {startRecord} - {endRecord} de {totalPages}
      <Button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        variant="ghost"
        className="w-10 h-10 rounded-full cursor-pointer"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
      <Button
        onClick={() => onPageChange(totalPages)}
        disabled={page === totalPages}
        variant="ghost"
        className="w-10 h-10 rounded-full cursor-pointer"
      >
        <ChevronsRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

export default Pagination;
