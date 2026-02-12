import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import PaginationBar from '@/shared/components/pagination-bar/PaginationBar';
import PaymentMethodsTable from '../components/paymentMethods/PaymentMethodsTable';
import usePaymentMethods from '../hooks/usePaymentMethods';

const PaymentMethodsList = () => {
    const {
        paymentMethods,
        loading,
        pagination,
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
                <Button asChild className="gap-2">
                    <Link to="/settings/payment-methods/create">
                        <Plus className="w-4 h-4" />
                        Crear Método de Pago
                    </Link>
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
        </div>
    );
};

export default PaymentMethodsList;
