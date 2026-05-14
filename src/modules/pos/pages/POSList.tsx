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
    <div className="space-y-6">
      <POSListHeader handleGoToPOS={goToPOS} />

      <Card>
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
        <CardContent className="p-0">
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
