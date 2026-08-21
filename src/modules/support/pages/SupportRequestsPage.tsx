import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import WalkingBear from "@/shared/components/walking-bear/WalkingBear";
import { useSupportRequests } from "../hooks/useSupportRequests";
import { useSupportRequestDetail } from "../hooks/useSupportRequestDetail";
import { SupportDialog } from "../components/SupportDialog";
import { SupportRequestDetailSheet } from "../components/support-requests/SupportRequestDetailSheet";
import { SupportRequestsHeader } from "../components/support-requests/SupportRequestsHeader";
import { SupportRequestsFilterBar } from "../components/support-requests/SupportRequestsFilterBar";
import { SupportRequestsTable } from "../components/support-requests/SupportRequestsTable";
import { SupportRequestsErrorState } from "../components/support-requests/SupportRequestsErrorState";

const SupportRequestsPage = () => {
  const {
    requests,
    facets,
    loading,
    errorState,
    filters,
    hasActiveFilters,
    pagination,
    dialogOpen,
    onPageChange,
    onPageSizeChange,
    onRequestTypeChange,
    onReporterNameChange,
    onStatusChange,
    onOriginHostChange,
    clearFilters,
    refresh,
    openNewRequest,
    onDialogOpenChange,
  } = useSupportRequests();

  const detail = useSupportRequestDetail();

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <SupportRequestsHeader
        onNewRequest={openNewRequest}
        onRefresh={refresh}
        refreshing={loading}
      />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="!p-4">
          <SupportRequestsFilterBar
            requestType={filters.requestType}
            reporterName={filters.reporterName}
            status={filters.status}
            originHost={filters.originHost}
            facets={facets}
            hasActiveFilters={hasActiveFilters}
            onRequestTypeChange={onRequestTypeChange}
            onReporterNameChange={onReporterNameChange}
            onStatusChange={onStatusChange}
            onOriginHostChange={onOriginHostChange}
            onClearFilters={clearFilters}
            disabled={loading}
          />
        </CardHeader>
        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          {errorState ? (
            <SupportRequestsErrorState
              code={errorState.code}
              message={errorState.message}
              onRetry={refresh}
              retrying={loading}
            />
          ) : (
            <SupportRequestsTable
              requests={requests}
              loading={loading}
              hasActiveFilters={hasActiveFilters}
              onNewRequest={openNewRequest}
              onClearFilters={clearFilters}
              onViewDetail={detail.open}
            />
          )}
        </CardContent>

        {!errorState && pagination.total > 0 && (
          <CardFooter className="!p-0">
            <PaginationBar
              pagination={pagination}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
            />
          </CardFooter>
        )}
      </Card>

      {/* Se reutiliza el formulario que antes vivía en el Sidebar, sin cambios */}
      <SupportDialog open={dialogOpen} onOpenChange={onDialogOpenChange} />

      <SupportRequestDetailSheet
        open={detail.isOpen}
        detail={detail.detail}
        loading={detail.loading}
        sending={detail.sending}
        errorState={detail.errorState}
        onClose={detail.close}
        onRetry={detail.retry}
        onSendMessage={detail.sendMessage}
      />

      <WalkingBear className="w-full mt-auto" />
    </div>
  );
};

export default SupportRequestsPage;
