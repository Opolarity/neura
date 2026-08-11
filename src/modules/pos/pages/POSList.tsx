import POSListHeader from "../components/POSListHeader";
import POSListFilterBar from "../components/POSListFilterBar";
import POSListTable from "../components/POSListTable";
import { usePOSList } from "../hooks/usePOSList";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";

const POSList = () => {
  const {
    sessions,
    users,
    loading,
    search,
    pagination,
    appliedModalFilters,
    onSearchChange,
    onPageChange,
    handlePageSizeChange,
    applyModalFilters,
    resetModalFilters,
    goToPOS,
  } = usePOSList();

  return (
    <div className="h-full min-h-0 flex flex-col gap-6">
      <POSListHeader handleGoToPOS={goToPOS} />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader>
          <POSListFilterBar
            search={search}
            onSearchChange={onSearchChange}
            users={users}
            appliedModalFilters={appliedModalFilters}
            onApplyModalFilters={applyModalFilters}
            onResetModalFilters={resetModalFilters}
          />
        </CardHeader>
        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          <POSListTable
            sessions={sessions}
            loading={loading}
            search={search}
          />
        </CardContent>

        <CardFooter>
          <PaginationBar
            pagination={pagination}
            onPageChange={onPageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardFooter>
      </Card>
    </div>
  );
};

export default POSList;
