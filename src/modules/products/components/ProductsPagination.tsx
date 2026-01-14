import PageSizeSelector from "./PageSizeSelector";
import { PaginationState } from "../types/Products.types";
import Pagination from "@/shared/components/pagination/Pagination";

interface ProductsPaginationProps {
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export default function ProductsPagination({
  pagination,
  onPageChange,
  onPageSizeChange,
}: ProductsPaginationProps) {
  return (
    <div className="w-full flex flex-row justify-center gap-2 p-6">
      <PageSizeSelector
        size={pagination.p_size}
        onPageSizeChange={onPageSizeChange}
      />

      <Pagination pagination={pagination} onPageChange={onPageChange} />
    </div>
  );
}
