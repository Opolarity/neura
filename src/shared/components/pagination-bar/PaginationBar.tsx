import PageLimit from "@/shared/components/page-limit/PageLimit";
import { PaginationState } from "@/shared/components/pagination/Pagination";
import Pagination from "@/shared/components/pagination/Pagination";

interface PaginationBarProps {
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export default function PaginationBar({
  pagination,
  onPageChange,
  onPageSizeChange,
}: PaginationBarProps) {
  return (
    <div className="w-full flex flex-row justify-center gap-2 p-6">
      <PageLimit size={pagination.p_size} onPageSizeChange={onPageSizeChange} />

      <Pagination pagination={pagination} onPageChange={onPageChange} />
    </div>
  );
}
