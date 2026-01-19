import React, { useMemo } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Loader2, Plus, Trash2, ArrowLeft, Check } from "lucide-react";
import { useCreateSaleLogic } from "../store/CreateSale.logic";
import { cn } from "@/shared/utils/utils";
import { SaleSidebar } from "../components/SaleSidebar";

const CreateSale = () => {
  const {
    loading,
    saving,
    formData,
    products,
    salesData,
    searchQuery,
    selectedVariation,
    paymentMethod,
    paymentAmount,
    confirmationCode,
    clientFound,
    searchingClient,
    orderId,
    orderSituation,
    availableShippingCosts,
    setOrderSituation,
    handleInputChange,
    setSearchQuery,
    setSelectedVariation,
    setPaymentMethod,
    setPaymentAmount,
    setConfirmationCode,
    searchClient,
    addProduct,
    removeProduct,
    updateProduct,
    calculateSubtotal,
    calculateDiscount,
    calculateTotal,
    handleSubmit,
    navigate,
  } = useCreateSaleLogic();

  const [open, setOpen] = React.useState(false);

  // Flatten all variations with product info for search
  const allVariations = useMemo(() => {
    if (!salesData?.products) return [];

    return salesData.products.flatMap((product) =>
      product.variations.map((variation: any) => ({
        ...variation,
        product_id: product.id,
        product_title: product.title,
      }))
    );
  }, [salesData?.products]);

  // Filter variations by search query (product name or SKU)
  const filteredVariations = useMemo(() => {
    if (!searchQuery) return allVariations;

    const query = searchQuery.toLowerCase();
    return allVariations.filter((variation) => {
      const productTitle = variation.product_title.toLowerCase();
      const sku = variation.sku?.toLowerCase() || "";
      const termsNames = variation.terms
        .map((t: any) => t.terms.name.toLowerCase())
        .join(" ");

      return (
        productTitle.includes(query) ||
        sku.includes(query) ||
        termsNames.includes(query)
      );
    });
  }, [allVariations, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/sales")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold">
            {orderId ? "Editar Venta" : "Crear Venta"}
          </h1>
        </div>
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/sales")}
          >
            Cancelar
          </Button>
          <Button type="submit" form="sale-form" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {orderId ? "Actualizar Venta" : "Crear Venta"}
          </Button>
        </div>
      </div>

      <div className="flex gap-6 items-start">
        <form
          id="sale-form"
          onSubmit={handleSubmit}
          className="flex-1 space-y-6"
          style={{ width: "70%" }}
        >
          {/* Sale Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información de la Venta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div className="md:col-span-2">
                  <Label>Tipo de Venta</Label>
                  <Select
                    value={formData.sale_type}
                    onValueChange={(v) => handleInputChange("sale_type", v)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione" />
                    </SelectTrigger>
                    <SelectContent>
                      {salesData?.saleTypes.map((st) => (
                        <SelectItem key={st.id} value={st.id.toString()}>
                          {st.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center md:col-span-2 space-x-2">
                  <Checkbox
                    id="with_shipping"
                    checked={formData.with_shipping}
                    onCheckedChange={(checked) =>
                      handleInputChange("with_shipping", checked as boolean)
                    }
                  />
                  <Label htmlFor="with_shipping" className="cursor-pointer">
                    Con envío
                  </Label>
                  <Checkbox
                    id="employee_sale"
                    checked={formData.employee_sale}
                    onCheckedChange={(checked) =>
                      handleInputChange("employee_sale", checked as boolean)
                    }
                  />
                  <Label htmlFor="employee_sale" className="cursor-pointer">
                    Venta a empleado
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Documento</Label>
                  <Select
                    value={formData.document_type}
                    onValueChange={(v) => handleInputChange("document_type", v)}
                    required
                  >
                    <SelectTrigger>
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
                <div>
                  <Label>Número de Documento</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.document_number}
                      onChange={(e) =>
                        handleInputChange("document_number", e.target.value)
                      }
                      onBlur={searchClient}
                      required
                      disabled={!formData.document_type}
                    />
                    {searchingClient && (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {clientFound !== null && (
                  <>
                    {clientFound ? (
                      <div className="md:col-span-3">
                        <Label>Nombre Completo</Label>
                        <Input
                          value={`${formData.customer_name} ${formData.customer_lastname}${formData.customer_lastname2 ? " " + formData.customer_lastname2 : ""}`}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                    ) : (
                      <>
                        <div>
                          <Label>Nombre</Label>
                          <Input
                            value={formData.customer_name}
                            onChange={(e) =>
                              handleInputChange("customer_name", e.target.value)
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label>Apellido Paterno</Label>
                          <Input
                            value={formData.customer_lastname}
                            onChange={(e) =>
                              handleInputChange(
                                "customer_lastname",
                                e.target.value
                              )
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label>Apellido Materno</Label>
                          <Input
                            value={formData.customer_lastname2}
                            onChange={(e) =>
                              handleInputChange(
                                "customer_lastname2",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {formData.with_shipping && (
            <>
              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle>Dirección de Envío</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>País</Label>
                    <Select
                      value={formData.country_id}
                      onValueChange={(v) => handleInputChange("country_id", v)}
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
                    <Label>Estado/Provincia</Label>
                    <Select
                      value={formData.state_id}
                      onValueChange={(v) => handleInputChange("state_id", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione" />
                      </SelectTrigger>
                      <SelectContent>
                        {salesData?.states
                          .filter(
                            (s) =>
                              !formData.country_id ||
                              s.country_id.toString() === formData.country_id
                          )
                          .map((s) => (
                            <SelectItem key={s.id} value={s.id.toString()}>
                              {s.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Ciudad</Label>
                    <Select
                      value={formData.city_id}
                      onValueChange={(v) => handleInputChange("city_id", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione" />
                      </SelectTrigger>
                      <SelectContent>
                        {salesData?.cities
                          .filter(
                            (c) =>
                              !formData.state_id ||
                              c.state_id.toString() === formData.state_id
                          )
                          .map((c) => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                              {c.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Barrio</Label>
                    <Select
                      value={formData.neighborhood_id}
                      onValueChange={(v) =>
                        handleInputChange("neighborhood_id", v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione" />
                      </SelectTrigger>
                      <SelectContent>
                        {salesData?.neighborhoods
                          .filter(
                            (n) =>
                              !formData.city_id ||
                              n.city_id.toString() === formData.city_id
                          )
                          .map((n) => (
                            <SelectItem key={n.id} value={n.id.toString()}>
                              {n.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Dirección</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) =>
                        handleInputChange("address", e.target.value)
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Referencia</Label>
                    <Input
                      value={formData.address_reference}
                      onChange={(e) =>
                        handleInputChange("address_reference", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label>Persona que Recibe</Label>
                    <Input
                      value={formData.reception_person}
                      onChange={(e) =>
                        handleInputChange("reception_person", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label>Teléfono de Recepción</Label>
                    <Input
                      value={formData.reception_phone}
                      onChange={(e) =>
                        handleInputChange("reception_phone", e.target.value)
                      }
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  {formData.country_id &&
                    formData.state_id &&
                    formData.city_id &&
                    formData.neighborhood_id && (
                      <>
                        <div>
                          <Label>Método de Envío</Label>
                          {availableShippingCosts.length > 0 ? (
                            <Select
                              value={formData.shipping_method}
                              onValueChange={(v) =>
                                handleInputChange("shipping_method", v)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione método de envío" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableShippingCosts.map((sc) => (
                                  <SelectItem
                                    key={sc.id}
                                    value={sc.id.toString()}
                                  >
                                    {sc.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="text-sm text-muted-foreground p-2 border rounded">
                              Aún no hay método de envío para esta zona
                            </div>
                          )}
                        </div>
                        <div>
                          <Label>Costo de Envío</Label>
                          <Input
                            type="number"
                            value={formData.shipping_cost}
                            onChange={(e) =>
                              handleInputChange("shipping_cost", e.target.value)
                            }
                            placeholder="0.00"
                            step="0.01"
                            disabled={!formData.shipping_method}
                            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      </>
                    )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Products */}
          <Card>
            <CardHeader>
              <CardTitle>Productos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Buscar Producto o Variación</Label>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                      >
                        {selectedVariation
                          ? `${selectedVariation.product_title} - ${
                              selectedVariation.terms
                                .map((t: any) => t.terms.name)
                                .join(" / ") || selectedVariation.sku
                            }`
                          : "Buscar por nombre o SKU..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput
                          placeholder="Buscar producto o SKU..."
                          value={searchQuery}
                          onValueChange={setSearchQuery}
                        />
                        <CommandList>
                          <CommandEmpty>
                            No se encontraron productos.
                          </CommandEmpty>
                          <CommandGroup>
                            {filteredVariations.map((variation) => {
                              const termsNames = variation.terms
                                .map((t: any) => t.terms.name)
                                .join(" / ");
                              const displayName = termsNames || variation.sku;

                              return (
                                <CommandItem
                                  key={variation.id}
                                  value={`${variation.product_title} ${variation.sku} ${termsNames}`}
                                  onSelect={() => {
                                    setSelectedVariation(variation);
                                    setOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedVariation?.id === variation.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {variation.product_title}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                      {displayName}{" "}
                                      {variation.sku && `(${variation.sku})`}
                                    </span>
                                  </div>
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={addProduct}
                    className="w-full"
                    disabled={!selectedVariation}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar
                  </Button>
                </div>
              </div>

              {products.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="w-24">Cantidad</TableHead>
                      <TableHead className="w-32">Precio</TableHead>
                      <TableHead className="w-32">Descuento</TableHead>
                      <TableHead className="w-32">Subtotal</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {product.product_name} - {product.variation_name}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={product.quantity}
                            onChange={(e) =>
                              updateProduct(
                                index,
                                "quantity",
                                parseInt(e.target.value) || 0
                              )
                            }
                            min="1"
                            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            onWheel={(e) => e.currentTarget.blur()}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={product.price}
                            onChange={(e) =>
                              updateProduct(
                                index,
                                "price",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            min="0"
                            step="0.01"
                            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            onWheel={(e) => e.currentTarget.blur()}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={product.discount}
                            onChange={(e) =>
                              updateProduct(
                                index,
                                "discount",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            min="0"
                            step="0.01"
                            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            onWheel={(e) => e.currentTarget.blur()}
                          />
                        </TableCell>
                        <TableCell>
                          S/{" "}
                          {(
                            product.quantity *
                            (product.price - product.discount)
                          ).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeProduct(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              <div className="flex justify-end space-y-2">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold">
                      S/ {calculateSubtotal().toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Descuento:</span>
                    <span className="font-semibold">
                      -S/ {calculateDiscount().toFixed(2)}
                    </span>
                  </div>
                  {formData.with_shipping && formData.shipping_cost && (
                    <div className="flex justify-between">
                      <span>Envío:</span>
                      <span className="font-semibold">
                        S/ {parseFloat(formData.shipping_cost).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>S/ {calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader>
              <CardTitle>Información de Pago</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Método de Pago</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione" />
                  </SelectTrigger>
                  <SelectContent>
                    {salesData?.paymentMethods.map((pm) => (
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
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={calculateTotal().toFixed(2)}
                  step="0.01"
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  onWheel={(e) => e.currentTarget.blur()}
                />
              </div>
              <div>
                <Label>Código de Confirmación</Label>
                <Input
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </form>

        {/* Sidebar - Fixed */}
        <aside
          className="flex-shrink-0 sticky top-6"
          style={{ width: "30%", height: "calc(100vh - 8rem)" }}
        >
          <SaleSidebar
            orderId={orderId ? parseInt(orderId) : undefined}
            selectedSituation={orderSituation}
            onSituationChange={setOrderSituation}
            situations={salesData?.situations || []}
          />
        </aside>
      </div>
    </div>
  );
};

export default CreateSale;
