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
import { PaginationState } from "@/shared/components/pagination/Pagination";
import { ReturnType } from "../../types/Returns.types";
import { OrderSelectionTable } from "./OrderSelectionTable";

interface OrderSelectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    returnTypes: ReturnType[];
    selectedReturnType: string;
    onReturnTypeChange: (value: string) => void;
    // Edge function state (shared for both CAM and non-CAM)
    edgeItems: any[];
    edgePagination: PaginationState;
    edgeLoading: boolean;
    edgeSearch: string;
    onEdgeSearchChange: (search: string) => void;
    selectedEdgeItemId?: number;
    onEdgeItemSelect: (item: any) => void;
    onEdgePageChange: (page: number) => void;
    // CAM-only: source selector
    orderSourceType: "orders" | "returns";
    onOrderSourceTypeChange: (source: "orders" | "returns") => void;
    onConfirm: () => void;
    formatCurrency: (amount: number) => string;
}

export const OrderSelectionDialog = ({
    open,
    onOpenChange,
    returnTypes,
    selectedReturnType,
    onReturnTypeChange,
    edgeItems,
    edgePagination,
    edgeLoading,
    edgeSearch,
    onEdgeSearchChange,
    selectedEdgeItemId,
    onEdgeItemSelect,
    onEdgePageChange,
    orderSourceType,
    onOrderSourceTypeChange,
    onConfirm,
    formatCurrency
}: OrderSelectionDialogProps) => {
    const navigate = useNavigate();
    const selectedCode = returnTypes.find((t) => t.id.toString() === selectedReturnType)?.code ?? "";
    const isCAM = selectedCode === "CAM";

    const confirmDisabled = !selectedEdgeItemId || !selectedReturnType;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Seleccionar Orden y Tipo de Devolución</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Return type selector */}
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

                    {/* Search row: CAM shows source toggle, all modes show search input */}
                    {selectedReturnType && (
                        <div className="space-y-3">
                            <div className={`grid gap-4 ${isCAM ? "grid-cols-2" : "grid-cols-1"}`}>
                                {isCAM && (
                                    <div>
                                        <Label>Buscar en</Label>
                                        <Select
                                            value={orderSourceType}
                                            onValueChange={(v) =>
                                                onOrderSourceTypeChange(v as "orders" | "returns")
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="orders">Órdenes</SelectItem>
                                                <SelectItem value="returns">Retornos</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                <div>
                                    <Label htmlFor="edgeSearch">Buscar</Label>
                                    <Input
                                        id="edgeSearch"
                                        placeholder="Buscar por número o cliente..."
                                        value={edgeSearch}
                                        onChange={(e) => onEdgeSearchChange(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>
                                    {isCAM
                                        ? orderSourceType === "orders"
                                            ? "Órdenes Disponibles"
                                            : "Retornos Disponibles"
                                        : "Órdenes Disponibles"}
                                </Label>
                                <div className="mt-2">
                                    <OrderSelectionTable
                                        items={edgeItems}
                                        pagination={edgePagination}
                                        loading={edgeLoading}
                                        selectedId={selectedEdgeItemId}
                                        sourceType={isCAM ? orderSourceType : "orders"}
                                        onSelect={onEdgeItemSelect}
                                        onPageChange={onEdgePageChange}
                                        formatCurrency={formatCurrency}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => navigate("/returns")}>
                        Cancelar
                    </Button>
                    <Button onClick={onConfirm} disabled={confirmDisabled}>
                        Continuar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
