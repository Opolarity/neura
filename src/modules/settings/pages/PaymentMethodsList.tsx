import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import PaginationBar from '@/shared/components/pagination-bar/PaginationBar';
import PaymentMethodsTable from '../components/paymentMethods/PaymentMethodsTable';
import usePaymentMethods from '../hooks/usePaymentMethods';
import { PaymentMethodFormDialog } from '../components/paymentMethods/PaymentMethodFormDialog';

const PaymentMethodsList = () => {
    const {
        paymentMethods,
        loading,
        saving,
        editingItem,
        openFormModal,
        pagination,
        handleEditItemChange,
        handleOpenChange,
        savePaymentMethod,
        handlePageChange,
        handleSizeChange,
    } = usePaymentMethods();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Listado de Métodos de Pago</h1>
                    <p className="text-muted-foreground mt-2">
                        Administra los métodos de pago del sistema
                    </p>
                </div>
                <Button
                    className="gap-2"
                    onClick={() => {
                        handleEditItemChange(null);
                        handleOpenChange(true);
                    }}
                >
                    <Plus className="w-4 h-4" />
                    Crear Método de Pago
                </Button>
            </div>

            {/* Payment Methods Table */}
            <Card>
                <CardContent className="p-0">
                    <PaymentMethodsTable
                        paymentMethods={paymentMethods}
                        loading={loading}
                    />
                </CardContent>
                <CardFooter>
                    <PaginationBar
                        pagination={pagination}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handleSizeChange}
                    />
                </CardFooter>
            </Card>

            <PaymentMethodFormDialog
                key={editingItem?.id ?? "new"}
                open={openFormModal}
                item={editingItem}
                saving={saving}
                onSaved={savePaymentMethod}
                onOpenChange={handleOpenChange}
            />
        </div>
    );
};

export default PaymentMethodsList;
