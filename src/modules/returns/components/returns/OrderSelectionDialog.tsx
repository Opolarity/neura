import React from "react";
import { useNavigate } from "react-router-dom";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Order, ReturnType } from "../../types/Returns.types";

interface OrderSelectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    returnTypes: ReturnType[];
    selectedReturnType: string;
    onReturnTypeChange: (value: string) => void;
    orderSearch: string;
    onOrderSearchChange: (value: string) => void;
    paginatedOrders: Order[];
    selectedOrderId?: number;
    onOrderSelect: (order: Order) => void;
    totalPages: number;
    currentPage: number;
    onPageChange: (page: number) => void;
    onConfirm: () => void;
    formatCurrency: (amount: number) => string;
}

export const OrderSelectionDialog = ({
    open,
    onOpenChange,
    returnTypes,
    selectedReturnType,
    onReturnTypeChange,
    orderSearch,
    onOrderSearchChange,
    paginatedOrders,
    selectedOrderId,
    onOrderSelect,
    totalPages,
    currentPage,
    onPageChange,
    onConfirm,
    formatCurrency
}: OrderSelectionDialogProps) => {
    const navigate = useNavigate();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Seleccionar Orden y Tipo de Devolución</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="returnType">Tipo de Devolución/Cambio *</Label>
                            <Select value={selectedReturnType} onValueChange={onReturnTypeChange}>
                                <SelectTrigger id="returnType">
                                    <SelectValue placeholder="Seleccione el tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {returnTypes.map((type) => (
                                        <SelectItem key={type.id} value={type.id.toString()}>
                                            {type.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="orderSearch">Buscar Orden</Label>
                            <Input
                                id="orderSearch"
                                placeholder="Buscar por número o cliente..."
                                value={orderSearch}
                                onChange={(e) => onOrderSearchChange(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <Label>Órdenes Disponibles</Label>
                        <div className="grid gap-2 mt-2">
                            {paginatedOrders.length === 0 ? (
                                <p className="text-center text-muted-foreground py-4">
                                    {orderSearch ? "No se encontraron órdenes" : "No hay órdenes disponibles para devolución"}
                                </p>
                            ) : (
                                paginatedOrders.map((order) => (
                                    <Card
                                        key={order.id}
                                        className={`cursor-pointer transition-colors ${selectedOrderId === order.id ? "border-primary bg-primary/5" : "hover:bg-accent"
                                            }`}
                                        onClick={() => onOrderSelect(order)}
                                    >
                                        <CardContent className="p-3">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium text-sm">Orden #{order.document_number}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {order.customer_name} {order.customer_lastname}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium text-sm">{formatCurrency(order.total)}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(order.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onPageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    Anterior
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    Página {currentPage} de {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onPageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    Siguiente
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => navigate("/returns")}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={!selectedOrderId || !selectedReturnType}
                    >
                        Continuar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
