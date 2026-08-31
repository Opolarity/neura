import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import PaginationBar from "@/shared/components/pagination-bar/PaginationBar";
import WalkingBear from "@/shared/components/walking-bear/WalkingBear";
import { useSupportRequests } from "../hooks/useSupportRequests";
import { useSupportRequestDetail } from "../hooks/useSupportRequestDetail";
import { SupportDialog } from "../components/SupportDialog";
import { SupportRequestDetailSheet } from "../components/support-requests/SupportRequestDetailSheet";
import { SupportRequestsHeader } from "../components/support-requests/SupportRequestsHeader";
import { SupportRequestsFilterBar } from "../components/support-requests/SupportRequestsFilterBar";
import SupportRequestsFilterModal from "../components/support-requests/SupportRequestsFilterModal";
import { SupportRequestsTable } from "../components/support-requests/SupportRequestsTable";
import { SupportRequestsErrorState } from "../components/support-requests/SupportRequestsErrorState";

const SupportRequestsPage = () => {
  const {
    requests,
    facets,
    loading,
    errorState,
    filters,
    search,
    hasActiveFilters,
    pagination,
    dialogOpen,
    isOpenFilterModal,
    onSearchChange,
    onPageChange,
    onPageSizeChange,
    onOpenFilterModal,
    onCloseFilterModal,
    onApplyFilter,
    clearFilters,
    refresh,
    openNewRequest,
    onDialogOpenChange,
  } = useSupportRequests();

  const detail = useSupportRequestDetail();

  return (
    <div className="h-full min-h-0 flex flex-col gap-4">
      <SupportRequestsHeader onNewRequest={openNewRequest} />

      <Card className="flex flex-col min-h-0 overflow-hidden">
        {/* Con un error en pantalla no hay tabla que filtrar (ni empresa
            registrada, ni conexión, ni sesión): el buscador y el botón de
            filtrar solo dispararían consultas que van a volver a fallar. La
            salida es el "Reintentar" de la propia alerta. */}
        {!errorState && (
          <CardHeader className="!p-4">
            <SupportRequestsFilterBar
              search={search}
              hasActiveFilters={hasActiveFilters}
              onSearchChange={onSearchChange}
              onOpen={onOpenFilterModal}
            />
          </CardHeader>
        )}
        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
          {errorState ? (
            <>
              <SupportRequestsErrorState
                code={errorState.code}
                message={errorState.message}
                onRetry={refresh}
                retrying={loading}
              />
              {/* Sin paginación no hay dónde esconder al oso, así que aquí va
                  en flujo normal debajo de la alerta — no absolute. */}
              <WalkingBear />
            </>
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
            {/* El oso camina por detrás de la barra de paginación. El contenedor
                lleva `isolate` a propósito: sin un stacking context propio, el
                z-index negativo lo mandaría detrás del fondo de la Card y
                desaparecería. Con él, el -z-10 solo lo deja por debajo de la
                barra, que no tiene fondo y lo deja ver. Así no hay que tocar
                PaginationBar ni Pagination. */}
            <div className="relative w-full isolate">
              <div className="absolute inset-x-0 bottom-0 -z-10">
                <WalkingBear />
              </div>
              <PaginationBar
                pagination={pagination}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
              />
            </div>
          </CardFooter>
        )}
      </Card>

      <SupportRequestsFilterModal
        isOpen={isOpenFilterModal}
        filters={filters}
        facets={facets}
        onClose={onCloseFilterModal}
        onApply={onApplyFilter}
      />

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
    </div>
  );
};

export default SupportRequestsPage;
