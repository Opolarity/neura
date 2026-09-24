import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import AuditLogHeader from "../components/AuditLogHeader";
import AuditLogFilterBar from "../components/AuditLogFilterBar";
import AuditLogTable from "../components/AuditLogTable";
import AuditLogFilterModal from "../components/AuditLogFilterModal";
import AuditLogDetailSheet from "../components/AuditLogDetailSheet";
import { useAuditLog } from "../hooks/useAuditLog";

const AuditLogPage = () => {
  const {
    entries,
    pagination,
    loading,
    error,
    search,
    filters,
    actors,
    hasActiveFilters,
    isOpenFilterModal,
    selected,
    onSearchChange,
    onOpenFilterModal,
    onCloseFilterModal,
    onApplyFilter,
    onClearFilters,
    onPageChange,
    onPageSizeChange,
    onSelect,
    onCloseDetail,
  } = useAuditLog();

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <AuditLogHeader />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="!p-4">
          <AuditLogFilterBar
            search={search}
            onSearchChange={onSearchChange}
            onOpenFilterModal={onOpenFilterModal}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={onClearFilters}
          />
        </CardHeader>

        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          {error ? (
            <div className="p-8 text-center text-destructive">{error}</div>
          ) : (
            <AuditLogTable
              entries={entries}
              loading={loading}
              hasFilters={hasActiveFilters || !!filters.search}
              onView={onSelect}
            />
          )}
        </CardContent>

        <CardFooter className="!p-0">
          <PaginationBar
            pagination={pagination}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </CardFooter>
      </Card>

      <AuditLogFilterModal
        isOpen={isOpenFilterModal}
        filters={filters}
        actors={actors}
        onClose={onCloseFilterModal}
        onApply={onApplyFilter}
      />

      <AuditLogDetailSheet entry={selected} onClose={onCloseDetail} />
    </div>
  );
};

export default AuditLogPage;
