import { Card, CardContent, CardHeader } from "@/components/ui/card";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import { useSupportRequests } from "../hooks/useSupportRequests";
import { SupportDialog } from "../components/SupportDialog";
import { SupportRequestsHeader } from "../components/support-requests/SupportRequestsHeader";
import { SupportRequestsFilterBar } from "../components/support-requests/SupportRequestsFilterBar";
import { SupportRequestsTable } from "../components/support-requests/SupportRequestsTable";
import { SupportRequestsErrorState } from "../components/support-requests/SupportRequestsErrorState";

const SupportRequestsPage = () => {
  const {
    requests,
    loading,
    errorState,
    filters,
    pagination,
    dialogOpen,
    onPageChange,
    onPageSizeChange,
    onRequestTypeChange,
    refresh,
    openNewRequest,
    onDialogOpenChange,
  } = useSupportRequests();

  return (
    <div className="p-6 space-y-6">
      <SupportRequestsHeader
        onNewRequest={openNewRequest}
        onRefresh={refresh}
        refreshing={loading}
      />

      <Card>
        <CardHeader>
          <SupportRequestsFilterBar
            requestType={filters.requestType}
            onRequestTypeChange={onRequestTypeChange}
            disabled={loading}
          />
        </CardHeader>
        <CardContent className="p-0">
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
              filteredByType={filters.requestType !== null}
              onNewRequest={openNewRequest}
              onClearFilter={() => onRequestTypeChange(null)}
            />
          )}
        </CardContent>
      </Card>

      {!errorState && pagination.total > 0 && (
        <PaginationBar
          pagination={pagination}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}

      {/* Se reutiliza el formulario que antes vivía en el Sidebar, sin cambios */}
      <SupportDialog open={dialogOpen} onOpenChange={onDialogOpenChange} />
    </div>
  );
};

export default SupportRequestsPage;
