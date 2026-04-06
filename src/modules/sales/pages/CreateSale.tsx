import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  Plus,
  Trash2,
  ArrowLeft,
  Check,
  Package,
  User,
  Truck,
  Receipt,
  Search,
  Settings,
  Upload,
  CreditCard,
  MessageSquare,
  Paperclip,
  Send,
  X,
  Image as ImageIcon,
  Warehouse,
  Lock,
} from "lucide-react";
import { useCreateSale } from "../hooks/useCreateSale";
import { cn } from "@/shared/utils/utils";
import { formatCurrency, calculateLineSubtotal } from "../utils";
import { generateDeliveryLabel } from "../utils/generateDeliveryLabel";
import { generateRemisionGuide } from "../utils/generateRemisionGuide";
import { generateSaleExcel } from "../utils/generateSaleExcel";
import { useToast } from "@/hooks/use-toast";
import { VoucherPreviewModal } from "../components/sales/VoucherPreviewModal";
import { SalesHistoryModal } from "../components/SalesHistoryModal";
import { SalesInvoicesModal } from "../components/SalesInvoicesModal";
import { getOrdersSituationsById } from "../services";
import { getOrdersSituationsByIdAdapter } from "../adapters";

const CreateSale = () => {
  const {
    loading,
    saving,
    searchingClient,
    formData,
    products,
    payments,
    currentPayment,
    orderSituation,
    salesData,
    clientFound,
    selectedVariation,
    searchQuery,
    selectedStockTypeId,
    showPriceListModal,
    priceLists,
    priceListsLoading,
    userWarehouseId,
    userWarehouseName,
    userBranchAddress,
    loadingWarehouse,
    allShippingCosts,
    availableShippingCosts,
    filteredVariations,
    filteredStates,
    filteredCities,
    filteredNeighborhoods,
    subtotal,
    discountAmount,
    productDiscountAmount,
    total,
    orderId,
    isPersonaJuridica,
    isPhySituation,
    isComSituation,
    filteredSituations,
    availableSaleTypes,
    filteredPaymentMethods,
    allPaymentMethods,
    isAnonymousPurchase,
    needsBusinessAccountSelect,
    needsChangeBusinessAccountSelect,
    businessAccounts,
    // Change entries
    changeEntries,
    currentChangeEntry,
    // Server-side pagination
    productPage,
    productPagination,
    productsLoading,
    // Notes state
    notes,
    newNoteText,
    noteImagePreview,
    // Actions
    setOrderSituation,
    setSelectedVariation,
    setSearchQuery,
    handleStockTypeChange,
    handleInputChange,
    handlePaymentChange,
    addPayment,
    removePayment,
    handleSearchClient,
    handleSelectPriceList,
    handleProductPageChange,
    handleAnonymousToggle,
    addProduct,
    removeProduct,
    updateProduct,
    handleSubmit,
    navigate,
    // Notes actions
    setNewNoteText,
    addNote,
    removeNote,
    handleNoteImageSelect,
    removeNoteImage,
    // Change entry actions
    handleChangeEntryChange,
    handleChangeVoucherSelect,
    removeChangeVoucher,
    addChangeEntry,
    removeChangeEntry,
    // Voucher actions
    handleVoucherSelect,
    removeVoucher,
    historyModalOpen,
    createdOrderId,
    orderSituationTable,
    setHistoryModalOpen,
    // Order discounts
    orderDiscounts,
    addOrderDiscount,
    removeOrderDiscount,
    // Applied price rules
    appliedRules,
    isDirty,
  } = useCreateSale();

  const [invoicesModalOpen, setInvoicesModalOpen] = useState(false);
  const [showAddDiscount, setShowAddDiscount] = useState(false);
  const [newDiscountName, setNewDiscountName] = useState("");
  const [newDiscountAmount, setNewDiscountAmount] = useState("");

  const [open, setOpen] = useState(false);
  const [tempPriceListId, setTempPriceListId] = useState<string>("");
  const [tempSaleTypeId, setTempSaleTypeId] = useState<string>("");
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [selectedVoucherPreview, setSelectedVoucherPreview] = useState<
    string | null
  >(null);
  const [highlightedRowIndex, setHighlightedRowIndex] = useState<number | null>(
    null,
  );
  const noteFileInputRef = useRef<HTMLInputElement>(null);
  const voucherFileInputRef = useRef<HTMLInputElement>(null);
  const changeVoucherFileInputRef = useRef<HTMLInputElement>(null);
  const isAcceptingRef = useRef(false);
  const { toast } = useToast();

  // Total pages for product pagination
  const totalProductPages = Math.ceil(
    productPagination.total / productPagination.size,
  );

  // Get selected price list name
  const selectedPriceListName = useMemo(() => {
    if (!formData.priceListId) return null;
    const found = priceLists.find(
      (pl) => pl.id.toString() === formData.priceListId,
    );
    return found?.name || null;
  }, [formData.priceListId, priceLists]);

  //Vuelto = Pagado - Total
  const totalPaid = payments.reduce((acc, payment) => {
    return acc + (parseFloat(payment.amount) || 0);
  }, 0);

  const changeAmount = totalPaid - total;

  // Format note date
  const formatNoteDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Handle note file input change
  const handleNoteFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleNoteImageSelect(file);
    }
  };

  // Handle send note on Enter key
  const handleNoteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addNote();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sale Settings Modal */}
      <Dialog
        open={showPriceListModal}
        onOpenChange={(isOpenValue) => {
          if (!isOpenValue && !isAcceptingRef.current) {
            navigate("/sales");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Ajustes de venta
            </DialogTitle>
            <DialogDescription>
              Configure los ajustes iniciales para esta venta
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {priceListsLoading || loadingWarehouse ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Price List Select */}
                <div className="space-y-1">
                  <Label>Lista de precios</Label>
                  {priceLists.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                      No hay listas de precios disponibles
                    </p>
                  ) : (
                    <Select
                      value={tempPriceListId}
                      onValueChange={setTempPriceListId}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccione una lista de precios" />
                      </SelectTrigger>
                      <SelectContent>
                        {priceLists.map((priceList) => (
                          <SelectItem
                            key={priceList.id}
                            value={priceList.id.toString()}
                          >
                            {priceList.name}{" "}
                            {priceList.code && `(${priceList.code})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Warehouse Select (Locked) */}
                <div className="space-y-1">
                  <Label>Almacén</Label>
                  <Select value={userWarehouseId?.toString() || ""} disabled>
                    <SelectTrigger className="w-full bg-muted cursor-not-allowed">
                      <SelectValue>
                        {userWarehouseName || "Sin almacén asignado"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {userWarehouseId && (
                        <SelectItem value={userWarehouseId.toString()}>
                          {userWarehouseName}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sale Channel Select */}
                <div className="space-y-1">
                  <Label>Canal de Venta</Label>
                  {availableSaleTypes.length > 0 ? (
                    <Select
                      value={tempSaleTypeId}
                      onValueChange={setTempSaleTypeId}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccione un canal de venta" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSaleTypes.map((st) => (
                          <SelectItem key={st.id} value={st.id.toString()}>
                            {st.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">
                      No hay canales de venta disponibles
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => navigate("/sales")}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                isAcceptingRef.current = true;
                handleSelectPriceList(tempPriceListId, tempSaleTypeId);
              }}
              disabled={!tempPriceListId || !userWarehouseId || !tempSaleTypeId}
            >
              Aceptar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/sales")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-semibold text-foreground">
            {orderId ? "Editar Venta" : "Crear Venta"}
          </h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate("/sales")}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="sale-form"
            disabled={saving || (!!orderId && !isDirty)}
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {orderId ? "Actualizar Venta" : "Crear Venta"}
          </Button>
        </div>
      </div>

      <div className="flex gap-6 items-start">
        {/* Main Form - 70% */}
        <form
          id="sale-form"
          onSubmit={handleSubmit}
          className="flex-1 space-y-6"
          style={{ width: "70%" }}
        >
          {/* Products Section - First */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Productos</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                Agregue los artículos a la orden
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={cn(
                  "flex gap-3",
                  isPhySituation && "opacity-50 pointer-events-none",
                )}
              >
                {/* Stock Type Selector */}
                <Select
                  value={selectedStockTypeId}
                  onValueChange={handleStockTypeChange}
                >
                  <SelectTrigger className="w-auto min-w-[160px]">
                    <SelectValue placeholder="Tipo inventario" />
                  </SelectTrigger>
                  <SelectContent>
                    {salesData?.stockTypes?.map((st) => (
                      <SelectItem key={st.id} value={st.id.toString()}>
                        {st.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Product Search */}
                <div className="flex-1">
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-start text-muted-foreground font-normal"
                      >
                        <Search className="w-4 h-4 mr-2" />
                        {selectedVariation
                          ? `${selectedVariation.productTitle} - ${selectedVariation.terms.map((t) => t.name).join(" / ") || selectedVariation.sku}`
                          : "Buscar por nombre o SKU..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0 bg-popover">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Buscar producto o SKU..."
                          value={searchQuery}
                          onValueChange={setSearchQuery}
                        />

                        <CommandList>
                          {productsLoading ? (
                            <div className="flex justify-center py-6">
                              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                            </div>
                          ) : (
                            <>
                              <CommandEmpty>
                                No se encontraron productos.
                              </CommandEmpty>
                              <CommandGroup>
                                {filteredVariations.map((variation) => {
                                  const termsNames = variation.terms
                                    .map((t) => t.name)
                                    .join(" / ");
                                  const displayTerms = termsNames
                                    ? `${termsNames} (${variation.sku})`
                                    : variation.sku;
                                  return (
                                    <CommandItem
                                      key={variation.id}
                                      value={`${variation.productTitle} ${variation.sku} ${termsNames}`}
                                      onSelect={() => {
                                        setSelectedVariation(variation);
                                        setOpen(false);
                                      }}
                                      className="flex items-center gap-3 py-2"
                                    >
                                      <Check
                                        className={cn(
                                          "h-4 w-4 shrink-0",
                                          selectedVariation?.id === variation.id
                                            ? "opacity-100"
                                            : "opacity-0",
                                        )}
                                      />

                                      {/* Product Image */}
                                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted">
                                        {variation.imageUrl ? (
                                          <img
                                            src={variation.imageUrl}
                                            alt={variation.productTitle}
                                            className="h-full w-full object-cover"
                                          />
                                        ) : (
                                          <div className="flex h-full w-full items-center justify-center">
                                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                          </div>
                                        )}
                                      </div>
                                      {/* Product Info */}
                                      <div className="flex flex-1 flex-col min-w-0">
                                        <span className="font-medium truncate">
                                          {variation.productTitle}
                                        </span>
                                        <span className="text-sm text-muted-foreground truncate">
                                          {displayTerms}
                                        </span>
                                      </div>
                                      {/* Stock (filtered by selected stock type) */}
                                      <span
                                        className={cn(
                                          "shrink-0 text-xs font-medium px-2 py-0.5 rounded-full",
                                          variation.stock > 0
                                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                                        )}
                                      >
                                        {variation.stock}
                                      </span>
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </>
                          )}
                        </CommandList>
                        {/* Pagination controls */}
                        {totalProductPages > 1 && (
                          <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/50">
                            <span className="text-xs text-muted-foreground">
                              {(productPage - 1) * productPagination.size + 1}-
                              {Math.min(
                                productPage * productPagination.size,
                                productPagination.total,
                              )}{" "}
                              de {productPagination.total}
                            </span>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() =>
                                  handleProductPageChange(productPage - 1)
                                }
                                disabled={productPage <= 1 || productsLoading}
                              >
                                Anterior
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() =>
                                  handleProductPageChange(productPage + 1)
                                }
                                disabled={
                                  productPage >= totalProductPages ||
                                  productsLoading
                                }
                              >
                                Siguiente
                              </Button>
                            </div>
                          </div>
                        )}
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    const result = addProduct();
                    if (!result.added && result.existingIndex !== undefined) {
                      setHighlightedRowIndex(result.existingIndex);
                      setTimeout(() => setHighlightedRowIndex(null), 1500);
                    }
                  }}
                  disabled={!selectedVariation || !selectedStockTypeId}
                >
                  <Plus className="w-4 h-4 mr-2" /> Agregar
                </Button>
              </div>

              {products.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="w-20 text-center">
                        Cantidad
                      </TableHead>
                      <TableHead className="w-28 text-center">
                        Precio (S/)
                      </TableHead>
                      <TableHead className="w-24 text-center">
                        Desc. (S/)
                      </TableHead>
                      <TableHead className="w-28 text-right">
                        Subtotal
                      </TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product, index) => (
                      <TableRow
                        key={index}
                        className={cn(
                          highlightedRowIndex === index &&
                            "animate-highlight-row",
                        )}
                      >
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {product.productName} (
                              {product.variationName.replace(/ \/ /g, " - ")})
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {product.stockTypeName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-center">
                            <Input
                              type="number"
                              value={
                                product.quantity === 0 ? "" : product.quantity
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "") {
                                  updateProduct(index, "quantity", 0);
                                } else {
                                  updateProduct(
                                    index,
                                    "quantity",
                                    parseInt(val) || 0,
                                  );
                                }
                              }}
                              onBlur={() => {
                                if (product.quantity < 1) {
                                  updateProduct(index, "quantity", 1);
                                }
                              }}
                              min="1"
                              max={product.maxStock}
                              className="w-16 text-center"
                              disabled={isPhySituation}
                            />

                            <span className="text-xs text-muted-foreground mt-1">
                              Stock: {product.maxStock}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="relative flex items-center">
                            <Input
                              type="number"
                              value={product.price}
                              onChange={(e) =>
                                updateProduct(
                                  index,
                                  "price",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              min="0"
                              step="0.01"
                              className={cn(
                                "w-24 text-center",
                                product.fromOrder &&
                                  "bg-muted text-muted-foreground cursor-not-allowed pr-7",
                              )}
                              disabled={isPhySituation || !!product.fromOrder}
                            />
                            {product.fromOrder && (
                              <Lock className="absolute right-2 w-3 h-3 text-muted-foreground pointer-events-none" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="relative flex items-center">
                            <Input
                              type="number"
                              value={product.discountAmount}
                              readOnly={isComSituation || isPhySituation}
                              onChange={(e) =>
                                updateProduct(
                                  index,
                                  "discountAmount",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              min="0"
                              step="0.01"
                              className={cn(
                                "w-20 text-center",
                                (isComSituation || isPhySituation) &&
                                  "bg-muted text-muted-foreground cursor-not-allowed pr-7",
                              )}
                              disabled={isComSituation || isPhySituation}
                            />
                            {(isComSituation || isPhySituation) && (
                              <Lock className="absolute right-2 w-3 h-3 text-muted-foreground pointer-events-none" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(calculateLineSubtotal(product))}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeProduct(index)}
                            className="text-destructive hover:text-destructive"
                            disabled={isPhySituation}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Sale & Client Info - Second */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">
                  Información de la Venta
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent
              className={cn(
                "space-y-4",
                isPhySituation && "opacity-50 pointer-events-none",
              )}
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Canal de Venta</Label>
                  <Select
                    value={formData.saleType}
                    onValueChange={(v) => handleInputChange("saleType", v)}
                    disabled={!orderId}
                  >
                    <SelectTrigger
                      className={!orderId ? "bg-muted cursor-not-allowed" : ""}
                    >
                      <SelectValue placeholder="Seleccione" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSaleTypes.map((st) => (
                        <SelectItem key={st.id} value={st.id.toString()}>
                          {st.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label>Tipo Doc.</Label>
                    <Select
                      value={formData.documentType}
                      onValueChange={(v) => {
                        handleInputChange("documentType", v);
                        if (formData.documentNumber) handleSearchClient(v);
                      }}
                      disabled={isAnonymousPurchase}
                    >
                      <SelectTrigger
                        className={isAnonymousPurchase ? "opacity-50" : ""}
                      >
                        <SelectValue placeholder="Seleccione" />
                      </SelectTrigger>
                      <SelectContent>
                        {salesData?.documentTypes.map((dt) => (
                          <SelectItem key={dt.id} value={dt.id.toString()}>
                            {dt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label>Número</Label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.documentNumber}
                        onChange={(e) =>
                          handleInputChange("documentNumber", e.target.value)
                        }
                        onBlur={() => handleSearchClient()}
                        disabled={isAnonymousPurchase}
                        className={isAnonymousPurchase ? "opacity-50" : ""}
                      />

                      {searchingClient && (
                        <Loader2 className="w-5 h-5 animate-spin self-center" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Lista de Precios</Label>
                    <Input
                      value={selectedPriceListName || "Sin seleccionar"}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <Label>Almacén</Label>
                    <Input
                      value={userWarehouseName || "Sin asignar"}
                      disabled
                      className="bg-muted cursor-not-allowed"
                    />
                  </div>
                </div>
                <div>
                  <Label>{isPersonaJuridica ? "Razón Social" : "Nombre"}</Label>
                  <Input
                    value={formData.customerName}
                    onChange={(e) =>
                      handleInputChange("customerName", e.target.value)
                    }
                    disabled={isAnonymousPurchase || clientFound === true}
                    className={
                      isAnonymousPurchase || clientFound === true
                        ? "bg-muted"
                        : ""
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Lado izquierdo: Vendedor y Fecha */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Vendedor</Label>
                    <Input
                      value={formData.vendorName}
                      disabled
                      placeholder="Juan Pérez"
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <Label>Fecha</Label>
                    <Input
                      type="date"
                      value={formData.saleDate}
                      onChange={(e) =>
                        handleInputChange("saleDate", e.target.value)
                      }
                    />
                  </div>
                </div>

                {/* Lado derecho: Apellidos (solo para persona natural) */}
                {!isPersonaJuridica && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Apellido Paterno</Label>
                      <Input
                        value={formData.customerLastname}
                        onChange={(e) =>
                          handleInputChange("customerLastname", e.target.value)
                        }
                        disabled={isAnonymousPurchase || clientFound === true}
                        className={
                          isAnonymousPurchase || clientFound === true
                            ? "bg-muted"
                            : ""
                        }
                      />
                    </div>
                    <div>
                      <Label>Apellido Materno</Label>
                      <Input
                        value={formData.customerLastname2}
                        onChange={(e) =>
                          handleInputChange("customerLastname2", e.target.value)
                        }
                        disabled={isAnonymousPurchase || clientFound === true}
                        className={
                          isAnonymousPurchase || clientFound === true
                            ? "bg-muted"
                            : ""
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Email y Celular */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="Opcional"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Celular</Label>
                  <Input
                    type="tel"
                    placeholder="Opcional"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="withShipping"
                    checked={formData.withShipping}
                    onCheckedChange={(checked) =>
                      handleInputChange("withShipping", checked as boolean)
                    }
                  />

                  <Label
                    htmlFor="withShipping"
                    className="cursor-pointer font-medium"
                  >
                    Requiere Envío
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="anonymousPurchase"
                    checked={isAnonymousPurchase}
                    onCheckedChange={(checked) =>
                      handleAnonymousToggle(checked as boolean)
                    }
                  />

                  <Label
                    htmlFor="anonymousPurchase"
                    className="cursor-pointer font-medium"
                  >
                    Compra anónima
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address - Conditional */}
          {formData.withShipping && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Dirección de Envío</CardTitle>
                </div>
              </CardHeader>
              <CardContent
                className={cn(
                  "space-y-4",
                  isPhySituation && "opacity-50 pointer-events-none",
                )}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Método de Envío</Label>
                    {availableShippingCosts.length > 0 ? (
                      <Select
                        value={formData.shippingMethod}
                        onValueChange={(v) =>
                          handleInputChange("shippingMethod", v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione método de envío" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableShippingCosts.map((sc) => (
                            <SelectItem key={sc.id} value={sc.id.toString()}>
                              {sc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : formData.shippingMethod ? (
                      <div className="text-sm p-2 border rounded-md bg-muted/50">
                        {allShippingCosts.find(sc => sc.id.toString() === formData.shippingMethod)?.name ?? formData.shippingMethod}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground p-2 border rounded-md bg-muted/50">
                        Elige ubicación para ver envíos.
                      </div>
                    )}
                  </div>
                  <div>
                    <Label>Costo de envío</Label>
                    <Input
                      type="number"
                      value={formData.shippingCost}
                      onChange={(e) =>
                        handleInputChange("shippingCost", e.target.value)
                      }
                      placeholder="0"
                      className="w-full text-right"
                      disabled={!formData.shippingMethod}
                    />
                  </div>
                </div>

                {/* Fila 1: País y Departamento */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>País</Label>
                    <Select
                      value={formData.countryId}
                      onValueChange={(v) => handleInputChange("countryId", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione" />
                      </SelectTrigger>
                      <SelectContent>
                        {salesData?.countries.map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Departamento</Label>
                    <Select
                      value={formData.stateId}
                      onValueChange={(v) => handleInputChange("stateId", v)}
                      disabled={!formData.countryId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredStates.map((s) => (
                          <SelectItem key={s.id} value={s.id.toString()}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Fila 2: Provincia y Distrito */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Provincia</Label>
                    <Select
                      value={formData.cityId}
                      onValueChange={(v) => handleInputChange("cityId", v)}
                      disabled={!formData.stateId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCities.map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Distrito</Label>
                    <Select
                      value={formData.neighborhoodId}
                      onValueChange={(v) =>
                        handleInputChange("neighborhoodId", v)
                      }
                      disabled={!formData.cityId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredNeighborhoods.map((n) => (
                          <SelectItem key={n.id} value={n.id.toString()}>
                            {n.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Fila 3: Dirección y Referencia */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Dirección</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) =>
                        handleInputChange("address", e.target.value)
                      }
                      placeholder="Calle, número..."
                    />
                  </div>
                  <div>
                    <Label>
                      Referencia{" "}
                      <span className="text-muted-foreground text-xs">
                        (opcional)
                      </span>
                    </Label>
                    <Input
                      value={formData.addressReference}
                      onChange={(e) =>
                        handleInputChange("addressReference", e.target.value)
                      }
                      placeholder="Cerca de, frente a..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Persona que Recibe</Label>
                    <Input
                      value={formData.receptionPerson}
                      onChange={(e) =>
                        handleInputChange("receptionPerson", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label>Teléfono de Contacto</Label>
                    <Input
                      value={formData.receptionPhone}
                      onChange={(e) =>
                        handleInputChange("receptionPhone", e.target.value)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </form>

        {/* Sidebar - 30% */}
        <aside
          className="flex-shrink-0 sticky top-6 space-y-4"
          style={{ width: "30%" }}
        >
          {/* Order Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Estado del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <Select value={orderSituation} onValueChange={setOrderSituation}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {filteredSituations.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {createdOrderId && formData.phone && (
                <a
                  href={`https://api.whatsapp.com/send?phone=${formData.phone}&text=Hola%20${formData.customerName ?? "Crew"}%20%F0%9F%91%BD%F0%9F%91%8B%20Te%20comento%20que%20tu%20pedido%20${createdOrderId}%20est%C3%A1%20siendo%20procesado%20%F0%9F%9A%80.%20En%20un%20momento%20pasaremos%20a%20armar%20tu%20pedido%20%F0%9F%93%A6.`}
                  className="inline-flex items-center gap-2 bg-[#25D366] text-white mt-4 px-4 py-2 rounded-md font-medium hover:bg-[#1ebe5d] transition-colors"
                >
                  <svg
                    viewBox="0 0 31 30"
                    height="24"
                    fill="none"
                    className="shrink-0 text-white"
                  >
                    <title>wa-logo</title>
                    <path
                      d="M30.3139 14.3245C30.174 10.4932 28.5594 6.864 25.8073 4.1948C23.0552 1.52559 19.3784 0.0227244 15.5446 4.10118e-06H15.4722C12.8904 -0.00191309 10.3527 0.668375 8.10857 1.94491C5.86449 3.22145 3.99142 5.06026 2.67367 7.28039C1.35592 9.50053 0.6389 12.0255 0.593155 14.6068C0.547411 17.1882 1.17452 19.737 2.41278 22.0024L1.09794 29.8703C1.0958 29.8865 1.09712 29.9029 1.10182 29.9185C1.10651 29.9341 1.11448 29.9485 1.12518 29.9607C1.13588 29.973 1.14907 29.9828 1.16387 29.9896C1.17867 29.9964 1.19475 29.9999 1.21103 30H1.23365L9.01561 28.269C11.0263 29.2344 13.2282 29.7353 15.4586 29.7346C15.6004 29.7346 15.7421 29.7346 15.8838 29.7346C17.8458 29.6786 19.7773 29.2346 21.5667 28.4282C23.3562 27.6218 24.9682 26.469 26.3098 25.0363C27.6514 23.6036 28.696 21.9194 29.3832 20.0809C30.0704 18.2423 30.3867 16.2859 30.3139 14.3245ZM15.8099 27.1487C15.6923 27.1487 15.5747 27.1487 15.4586 27.1487C13.4874 27.1511 11.5444 26.6795 9.79366 25.7735L9.39559 25.5654L4.11815 26.8124L5.09221 21.4732L4.86604 21.0902C3.78579 19.2484 3.20393 17.157 3.17778 15.0219C3.15163 12.8869 3.68208 10.7819 4.71689 8.91419C5.75171 7.0465 7.25518 5.48059 9.07924 4.37067C10.9033 3.26076 12.985 2.64514 15.1194 2.58444C15.238 2.58444 15.3571 2.58444 15.4767 2.58444C18.6992 2.59399 21.7889 3.86908 24.0802 6.13498C26.3715 8.40087 27.681 11.4762 27.7265 14.6984C27.7719 17.9205 26.5498 21.0316 24.3234 23.3612C22.0969 25.6909 19.0444 27.0527 15.8235 27.1532L15.8099 27.1487Z"
                      fill="currentColor"
                    ></path>
                    <path
                      d="M10.2894 7.69007C10.1057 7.69366 9.92456 7.73407 9.75673 7.80892C9.5889 7.88377 9.43779 7.99154 9.31236 8.12584C8.95801 8.48923 7.96736 9.36377 7.91006 11.2003C7.85277 13.0369 9.13594 14.8538 9.31537 15.1086C9.49481 15.3635 11.7686 19.3306 15.5141 20.9395C17.7156 21.8879 18.6806 22.0507 19.3063 22.0507C19.5642 22.0507 19.7587 22.0236 19.9622 22.0115C20.6483 21.9693 22.1969 21.1762 22.5346 20.3137C22.8724 19.4512 22.895 18.6973 22.806 18.5465C22.7171 18.3957 22.4728 18.2872 22.1049 18.0942C21.737 17.9012 19.9321 16.9361 19.5928 16.8004C19.467 16.7419 19.3316 16.7066 19.1932 16.6964C19.1031 16.7011 19.0155 16.7278 18.938 16.774C18.8605 16.8203 18.7954 16.8847 18.7484 16.9618C18.4469 17.3372 17.7548 18.153 17.5225 18.3882C17.4718 18.4466 17.4093 18.4938 17.3392 18.5265C17.2691 18.5592 17.1928 18.5768 17.1154 18.5782C16.9728 18.5719 16.8333 18.5344 16.7068 18.4681C15.6135 18.0038 14.6167 17.339 13.768 16.5079C12.975 15.7263 12.3022 14.8315 11.7716 13.8526C11.5666 13.4726 11.7716 13.2766 11.9586 13.0987C12.1456 12.9208 12.3461 12.675 12.5391 12.4624C12.6975 12.2808 12.8295 12.0777 12.9312 11.8593C12.9838 11.7578 13.0104 11.6449 13.0085 11.5307C13.0067 11.4165 12.9765 11.3045 12.9206 11.2048C12.8317 11.0149 12.1667 9.14664 11.8546 8.39725C11.6013 7.75642 11.2997 7.73531 11.0358 7.7157C10.8187 7.70062 10.5699 7.69309 10.3211 7.68555H10.2894"
                      fill="currentColor"
                    ></path>
                  </svg>
                  <span>WhatsApp</span>
                </a>
              )}
            </CardContent>
            <CardFooter>
              {createdOrderId && (
                <div className="flex gap-3">
                  <em
                    className="italic text-sm underline cursor-pointer"
                    onClick={() => setHistoryModalOpen(true)}
                  >
                    historial
                  </em>
                  <em
                    className="italic text-sm underline cursor-pointer"
                    onClick={() => setInvoicesModalOpen(true)}
                  >
                    comprobantes
                  </em>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                    title="Generar etiqueta de envío"
                    onClick={() => {
                      const cityObj = filteredCities.find(
                        (c) => c.id.toString() === formData.cityId,
                      );
                      const stateObj = filteredStates.find(
                        (s) => s.id.toString() === formData.stateId,
                      );
                      const neighObj = filteredNeighborhoods.find(
                        (n) => n.id.toString() === formData.neighborhoodId,
                      );
                      generateDeliveryLabel({
                        customerName: formData.customerName,
                        customerLastname: formData.customerLastname,
                        customerLastname2: formData.customerLastname2,
                        documentNumber: formData.documentNumber,
                        address: formData.address,
                        addressReference: formData.addressReference,
                        receptionPerson: formData.receptionPerson,
                        receptionPhone: formData.receptionPhone,
                        phone: formData.phone,
                        cityName: cityObj?.name,
                        stateName: stateObj?.name,
                        neighborhoodName: neighObj?.name,
                        senderAddress: userBranchAddress,
                      });
                    }}
                  >
                    <Truck className="w-4 h-4" />
                  </button>
                  <em
                    className="italic text-sm underline cursor-pointer"
                    onClick={async () => {
                      const countryObj = salesData?.countries.find(
                        (c) => c.id.toString() === formData.countryId,
                      );
                      const stateObj = filteredStates.find(
                        (s) => s.id.toString() === formData.stateId,
                      );
                      const cityObj = filteredCities.find(
                        (c) => c.id.toString() === formData.cityId,
                      );
                      const neighObj = filteredNeighborhoods.find(
                        (n) => n.id.toString() === formData.neighborhoodId,
                      );
                      const shippingObj = availableShippingCosts.find(
                        (s) => s.id.toString() === formData.shippingMethod,
                      );
                      await generateRemisionGuide({
                        customerName: formData.customerName,
                        customerLastname: formData.customerLastname,
                        customerLastname2: formData.customerLastname2,
                        documentType: formData.documentType,
                        documentNumber: formData.documentNumber,
                        address: formData.address,
                        countryName: countryObj?.name,
                        stateName: stateObj?.name,
                        cityName: cityObj?.name,
                        neighborhoodName: neighObj?.name,
                        shippingMethodName: shippingObj?.name,
                        saleDate: formData.saleDate,
                        orderId: createdOrderId ?? undefined,
                        direccionPartida: userBranchAddress,
                        items: products.map((p) => ({
                          sku: p.sku,
                          productName: p.productName,
                          variationName: p.variationName,
                          quantity: p.quantity,
                        })),
                      });
                    }}
                  >
                    guía
                  </em>
                  <em
                    className="italic text-sm underline cursor-pointer"
                    onClick={() => {
                      generateSaleExcel({
                        orderId: createdOrderId ?? undefined,
                        saleDate: formData.saleDate,
                        customerName: formData.customerName,
                        customerLastname: formData.customerLastname,
                        customerLastname2: formData.customerLastname2,
                        documentNumber: formData.documentNumber,
                        items: products.map((p) => ({
                          sku: p.sku,
                          productName: p.productName,
                          variationName: p.variationName,
                          quantity: p.quantity,
                          price: p.price,
                        })),
                      });
                    }}
                  >
                    excel
                  </em>
                </div>
              )}
            </CardFooter>
          </Card>

          {/* Summary & Payment */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Resumen</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                {/* Custom order discounts */}
                {orderDiscounts.map((d) => (
                  <div
                    key={d.id}
                    className="flex justify-between text-sm items-center"
                  >
                    <span className="text-muted-foreground text-xs truncate max-w-[120px]">
                      {d.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <span
                        className={cn(
                          "text-xs",
                          d.amount >= 0
                            ? "text-emerald-600"
                            : "text-destructive",
                        )}
                      >
                        {d.amount >= 0 ? "+" : "-"}
                        {formatCurrency(Math.abs(d.amount))}
                      </span>
                      {!isPhySituation && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => removeOrderDiscount(d.id!)}
                        >
                          <X className="w-3 h-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Add discount button/form */}
                {!isPhySituation &&
                  (showAddDiscount ? (
                    <div className="space-y-2 p-2 border rounded-md bg-muted/30">
                      <Input
                        placeholder="Nombre del descuento"
                        value={newDiscountName}
                        onChange={(e) => setNewDiscountName(e.target.value)}
                        className="h-7 text-xs"
                      />
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Monto (+/-)"
                          value={newDiscountAmount}
                          onChange={(e) => setNewDiscountAmount(e.target.value)}
                          className="h-7 text-xs flex-1"
                        />
                        <Button
                          type="button"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            const amt = parseFloat(newDiscountAmount);
                            if (
                              !newDiscountName.trim() ||
                              isNaN(amt) ||
                              amt === 0
                            )
                              return;
                            addOrderDiscount(newDiscountName.trim(), amt);
                            setNewDiscountName("");
                            setNewDiscountAmount("");
                            setShowAddDiscount(false);
                          }}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Añadir
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setShowAddDiscount(false)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                      onClick={() => setShowAddDiscount(true)}
                    >
                      <Plus className="w-3 h-3" />
                      Añadir descuento
                    </button>
                  ))}

                {/* Applied price rules messages */}
                {appliedRules.length > 0 && (
                  <div className="flex flex-col gap-1">
                    {appliedRules.map((rule, i) => (
                      <div key={i} className="text-xs text-green-600">
                        {rule.message}
                      </div>
                    ))}
                  </div>
                )}

                {/* Total discount summary */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Descuento Total</span>
                  <span
                    className={cn(
                      "font-medium",
                      discountAmount > 0
                        ? "text-primary"
                        : discountAmount < 0
                          ? "text-destructive"
                          : "text-muted-foreground",
                    )}
                  >
                    {discountAmount > 0 ? "+" : discountAmount < 0 ? "-" : ""}
                    {formatCurrency(Math.abs(discountAmount))}
                  </span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-muted-foreground">Costo de Envío</span>
                  {formData.shippingCost || 0}
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(total)}</span>
                </div>
                {changeAmount > 0 && (
                  <div className="flex justify-between font-medium text-green-600 mt-2">
                    <span>Vuelto</span>
                    <span>{formatCurrency(changeAmount)}</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Lista de pagos agregados */}
              {payments.filter((p) => p.paymentMethodId).length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Pagos Registrados
                  </Label>
                  {payments
                    .filter((p) => p.paymentMethodId)
                    .map((p) => {
                      const method = allPaymentMethods.find(
                        (pm) => pm.id.toString() === p.paymentMethodId,
                      );
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                        >
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">
                              {method?.name || "Método"}
                            </span>
                            <span className="text-sm font-medium">
                              {formatCurrency(parseFloat(p.amount) || 0)}
                            </span>
                            {p.voucherPreview && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => {
                                  setSelectedVoucherPreview(
                                    p.voucherPreview || null,
                                  );
                                  setVoucherModalOpen(true);
                                }}
                                title="Ver comprobante"
                              >
                                <Paperclip className="w-3 h-3 text-primary" />
                              </Button>
                            )}
                          </div>
                          {!isComSituation && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removePayment(p.id)}
                            >
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Formulario para agregar nuevo pago */}
              <div
                className={cn(
                  "space-y-3 p-3 border rounded-md bg-muted/30",
                  isComSituation && "opacity-50 pointer-events-none",
                )}
              >
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Método de Pago</Label>
                    <Select
                      value={currentPayment.paymentMethodId}
                      onValueChange={(v) =>
                        handlePaymentChange("paymentMethodId", v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredPaymentMethods.map((pm) => (
                          <SelectItem key={pm.id} value={pm.id.toString()}>
                            {pm.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Monto</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={currentPayment.amount}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || parseFloat(val) >= 0) {
                          handlePaymentChange("amount", val);
                        }
                      }}
                      placeholder={Math.max(0, total - totalPaid).toFixed(2)}
                    />
                  </div>
                </div>

                {/* Business Account Select - shown when payment method has business_account_id = 0 */}
                {needsBusinessAccountSelect && (
                  <div>
                    <Label>Cuenta de destino</Label>
                    <Select
                      value={currentPayment.businessAccountId || ""}
                      onValueChange={(v) =>
                        handlePaymentChange("businessAccountId" as any, v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione cuenta" />
                      </SelectTrigger>
                      <SelectContent>
                        {businessAccounts?.map((ba) => (
                          <SelectItem key={ba.id} value={ba.id.toString()}>
                            {ba.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Voucher preview */}
                {currentPayment.voucherPreview && (
                  <div className="relative group">
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                      <img
                        src={currentPayment.voucherPreview}
                        alt="Comprobante"
                        className="h-12 w-12 object-cover rounded"
                      />

                      <span className="text-xs text-muted-foreground flex-1 truncate">
                        {currentPayment.voucherFile?.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={removeVoucher}
                      >
                        <X className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="file"
                    ref={voucherFileInputRef}
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleVoucherSelect(file);
                      }
                      e.target.value = "";
                    }}
                  />

                  <Button
                    type="button"
                    variant={
                      currentPayment.voucherPreview ? "default" : "outline"
                    }
                    size="sm"
                    className="w-full"
                    onClick={() => voucherFileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-0.5" />
                    {currentPayment.voucherPreview ? "Cambiar" : "Comprobante"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={addPayment}
                  >
                    <Plus className="w-4 h-4 mr-0.5" />
                    Agregar
                  </Button>
                </div>
              </div>

              {/* Sección de Vuelto - aparece cuando el pago supera el total */}
              {changeAmount > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-green-600 dark:text-green-400">
                      Vuelto — {formatCurrency(changeAmount)}
                    </Label>

                    {/* Lista de vueltos registrados */}
                    {changeEntries.filter((e) => e.paymentMethodId).length >
                      0 && (
                      <div className="space-y-2">
                        {changeEntries
                          .filter((e) => e.paymentMethodId)
                          .map((e) => {
                            const method = allPaymentMethods.find(
                              (pm) => pm.id.toString() === e.paymentMethodId,
                            );
                            return (
                              <div
                                key={e.id}
                                className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-md"
                              >
                                <div className="flex items-center gap-2">
                                  <CreditCard className="w-4 h-4 text-green-600 dark:text-green-400" />
                                  <span className="text-sm">
                                    {method?.name || "Método"}
                                  </span>
                                  <span className="text-sm font-medium">
                                    {formatCurrency(parseFloat(e.amount) || 0)}
                                  </span>
                                  {e.voucherPreview && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => {
                                        setSelectedVoucherPreview(
                                          e.voucherPreview || null,
                                        );
                                        setVoucherModalOpen(true);
                                      }}
                                      title="Ver comprobante"
                                    >
                                      <Paperclip className="w-3 h-3 text-primary" />
                                    </Button>
                                  )}
                                </div>
                                {!isComSituation && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => removeChangeEntry(e.id)}
                                  >
                                    <Trash2 className="w-3 h-3 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}

                    {/* Formulario para agregar vuelto */}
                    {(() => {
                      const existingChangeTotal = changeEntries.reduce(
                        (acc, e) => acc + (parseFloat(e.amount) || 0),
                        0,
                      );
                      const remainingChange =
                        changeAmount - existingChangeTotal;
                      if (remainingChange <= 0) return null;
                      return (
                        <div
                          className={cn(
                            "space-y-3 p-3 border border-green-200 dark:border-green-800 rounded-md bg-green-50/30 dark:bg-green-900/10",
                            isComSituation && "opacity-50 pointer-events-none",
                          )}
                        >
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label>Método de Pago</Label>
                              <Select
                                value={currentChangeEntry.paymentMethodId}
                                onValueChange={(v) =>
                                  handleChangeEntryChange("paymentMethodId", v)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione" />
                                </SelectTrigger>
                                <SelectContent>
                                  {filteredPaymentMethods.map((pm) => (
                                    <SelectItem
                                      key={pm.id}
                                      value={pm.id.toString()}
                                    >
                                      {pm.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Monto</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={currentChangeEntry.amount}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === "" || parseFloat(val) >= 0) {
                                    handleChangeEntryChange("amount", val);
                                  }
                                }}
                                placeholder={remainingChange.toFixed(2)}
                              />
                            </div>
                          </div>

                          {needsChangeBusinessAccountSelect && (
                            <div>
                              <Label>Cuenta de origen</Label>
                              <Select
                                value={
                                  currentChangeEntry.businessAccountId || ""
                                }
                                onValueChange={(v) =>
                                  handleChangeEntryChange(
                                    "businessAccountId" as any,
                                    v,
                                  )
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione cuenta" />
                                </SelectTrigger>
                                <SelectContent>
                                  {businessAccounts?.map((ba) => (
                                    <SelectItem
                                      key={ba.id}
                                      value={ba.id.toString()}
                                    >
                                      {ba.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {currentChangeEntry.voucherPreview && (
                            <div className="relative group">
                              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                                <img
                                  src={currentChangeEntry.voucherPreview}
                                  alt="Comprobante"
                                  className="h-12 w-12 object-cover rounded"
                                />

                                <span className="text-xs text-muted-foreground flex-1 truncate">
                                  {currentChangeEntry.voucherFile?.name}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={removeChangeVoucher}
                                >
                                  <X className="w-3 h-3 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="file"
                              ref={changeVoucherFileInputRef}
                              className="hidden"
                              accept="image/*,.pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleChangeVoucherSelect(file);
                                e.target.value = "";
                              }}
                            />

                            <Button
                              type="button"
                              variant={
                                currentChangeEntry.voucherPreview
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              className="w-full"
                              onClick={() =>
                                changeVoucherFileInputRef.current?.click()
                              }
                            >
                              <Upload className="w-4 h-4 mr-0.5" />
                              {currentChangeEntry.voucherPreview
                                ? "Cambiar"
                                : "Comprobante"}
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="w-full"
                              onClick={addChangeEntry}
                            >
                              <Plus className="w-4 h-4 mr-0.5" />
                              Agregar
                            </Button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Notes Card - Chat Style */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Notas del Pedido</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Notes list - Chat style */}
              <ScrollArea className="h-[200px] pr-2">
                {notes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
                    <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-sm">No hay notas aún</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="bg-muted/50 p-3 rounded-lg relative group"
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeNote(note.id)}
                        >
                          <X className="w-3 h-3 text-destructive" />
                        </Button>
                        {note.message && (
                          <p className="text-sm pr-6">{note.message}</p>
                        )}
                        {note.imagePreview && (
                          <div className="mt-2">
                            <img
                              src={note.imagePreview}
                              alt="Imagen adjunta"
                              className="max-w-full max-h-32 rounded-md object-cover"
                            />
                          </div>
                        )}
                        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                          <span className="font-medium">{note.userName}</span>
                          <span>{formatNoteDate(note.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Image preview before sending */}
              {noteImagePreview && (
                <div className="relative inline-block">
                  <img
                    src={noteImagePreview}
                    alt="Preview"
                    className="max-h-16 rounded-md object-cover"
                  />

                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-5 w-5"
                    onClick={removeNoteImage}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}

              {/* Input area */}
              <div className="flex gap-2 pt-2 border-t">
                <input
                  type="file"
                  ref={noteFileInputRef}
                  onChange={handleNoteFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className={cn(
                    "flex-shrink-0",
                    !orderId && "opacity-50 cursor-not-allowed",
                  )}
                  onClick={() => {
                    if (!orderId) {
                      toast({
                        title: "Acción no disponible",
                        description:
                          "Primero debe crear la venta para agregar notas",
                        variant: "destructive",
                      });
                      return;
                    }
                    noteFileInputRef.current?.click();
                  }}
                  disabled={!orderId}
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <div
                  className="flex-1"
                  onClick={() => {
                    if (!orderId) {
                      toast({
                        title: "Acción no disponible",
                        description:
                          "Primero debe crear la venta para agregar notas",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <Input
                    placeholder={
                      orderId
                        ? "Escribir nota..."
                        : "Guarde la venta para agregar notas"
                    }
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    onKeyDown={handleNoteKeyDown}
                    disabled={!orderId}
                    className={cn("w-full", !orderId && "cursor-not-allowed")}
                  />
                </div>
                <Button
                  type="button"
                  size="icon"
                  className={cn(
                    "flex-shrink-0",
                    !orderId && "opacity-50 cursor-not-allowed",
                  )}
                  onClick={() => {
                    if (!orderId) {
                      toast({
                        title: "Acción no disponible",
                        description:
                          "Primero debe crear la venta para agregar notas",
                        variant: "destructive",
                      });
                      return;
                    }
                    addNote();
                  }}
                  disabled={
                    !orderId || (!newNoteText.trim() && !noteImagePreview)
                  }
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Voucher Preview Modal */}
      <VoucherPreviewModal
        open={voucherModalOpen}
        onOpenChange={setVoucherModalOpen}
        voucherSrc={selectedVoucherPreview || ""}
      />

      <SalesHistoryModal
        orders={orderSituationTable}
        open={historyModalOpen}
        onOpenChange={setHistoryModalOpen}
      />

      {createdOrderId && (
        <SalesInvoicesModal
          orderId={createdOrderId}
          orderTotal={total}
          saleTypeId={Number(formData.saleType) || 0}
          open={invoicesModalOpen}
          onOpenChange={setInvoicesModalOpen}
        />
      )}
    </div>
  );
};

export default CreateSale;
