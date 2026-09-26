import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronsUpDown, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageLoader } from "@/shared/components/page-loader";
import { cn } from "@/shared/utils/utils";
import { getTodayDate } from "@/shared/utils/date";
import CMovementSummary from "@/modules/inventory/components/create-movements/CMovementSummary";
import { useMaterialDispatch } from "../hooks/useMaterialDispatch";

const fmt = (value: number) =>
  new Intl.NumberFormat("es-PE", { maximumFractionDigits: 3 }).format(value);

/** Valor del selector de servicio cuando el envío es para toda la cotización. */
const TODOS = "__todos__";

/**
 * Enviar material a un taller.
 *
 * La misma pantalla que «Crear movimiento» de productos, para materiales: la
 * cabecera dice quién, desde qué almacén y cuándo; abajo se elige a dónde va
 * -- la orden, una cotización de esa orden, opcionalmente un servicio de la
 * cotización, y el almacén del taller donde entra -- y se agregan los
 * materiales con su cantidad. Al confirmar, la tela sale del almacén de
 * origen y entra en el del proveedor, atada a la cotización.
 *
 * Con la orden y la cotización puestas, las líneas se siembran solas con lo
 * que consumen esas prendas MENOS lo que el taller ya tiene. Todo lo que dice
 * la pantalla sobre eso son avisos: se puede subir la cantidad, quitar una
 * línea o agregar un material que no está en ninguna receta.
 */
const MaterialDispatchCreate = () => {
  const {
    loadingInitial,
    submitting,
    userSummary,
    orderSearch,
    setOrderSearch,
    orders,
    loadingOrders,
    selectedOrder,
    setSelectedOrder,
    quotations,
    loadingQuotations,
    selectedQuotation,
    setSelectedQuotation,
    selectedService,
    setSelectedService,
    supplierWarehouses,
    loadingSupplierWarehouses,
    selectedSupplierWarehouse,
    setSelectedSupplierWarehouse,
    materialSearch,
    setMaterialSearch,
    materials,
    loadingMaterials,
    selectedMaterial,
    setSelectedMaterial,
    isOptionTaken,
    originOptions,
    originWarehouseId,
    setOriginWarehouseId,
    plan,
    loadingPlan,
    lines,
    addMaterial,
    removeLine,
    setLineQuantity,
    canSubmit,
    submit,
  } = useMaterialDispatch();

  const [orderOpen, setOrderOpen] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);

  if (loadingInitial) {
    return <PageLoader message="Cargando datos del envío..." />;
  }

  const services = selectedQuotation?.services ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          Enviar material a servicio
        </h1>
        <div className="flex gap-3">
          <Link to="/suppliers/material-movements">
            <Button variant="outline">Cancelar</Button>
          </Link>
          <Button onClick={submit} disabled={!canSubmit}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear
          </Button>
        </div>
      </div>

      <Card className="flex flex-col gap-4 p-6">
        <CMovementSummary
          currentDate={getTodayDate()}
          userName={`${userSummary?.account_name ?? ""} ${userSummary?.account_last_name ?? ""} ${userSummary?.account_last_name2 ?? ""}`.trim()}
          warehouseName={
            originOptions.find((o) => o.warehouseId === originWarehouseId)?.name ?? ""
          }
          movementType="Envío de material a servicio"
        />

        {/* De dónde sale. Era fijo --el almacén del usuario-- y eso hacía
            invisible el caso que más cuesta: que el material esté en el taller
            de otro proveedor. El backend siempre admitió cualquier almacén del
            tenant como origen; lo que faltaba era ofrecerlo. */}
        <div className="flex flex-row gap-2">
          <div className="flex flex-1 flex-col gap-2">
            <Label>Almacén de origen *</Label>
            <Select
              value={originWarehouseId ? String(originWarehouseId) : ""}
              onValueChange={(value) => setOriginWarehouseId(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar almacén de origen" />
              </SelectTrigger>
              <SelectContent>
                {originOptions.map((option) => (
                  <SelectItem
                    key={option.warehouseId}
                    value={String(option.warehouseId)}
                  >
                    {option.name}
                    {option.isSupplier ? " · taller" : ""}
                    {/* Cuántas de las líneas de este envío tiene: es lo que
                        hace elegible un almacén que no es el tuyo. */}
                    {lines.length > 0
                      ? ` · ${option.conStock} de ${lines.length}`
                      : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* A dónde va: la orden, y de ella salen las cotizaciones. Los
            servicios se repiten por talla, así que el destino es la cotización,
            que es lo que agrupa esos servicios bajo un proveedor. */}
        <div className="flex flex-row gap-2">
          <div className="flex flex-1 flex-col gap-2">
            <Label>Orden de producción *</Label>
            <Popover open={orderOpen} onOpenChange={setOrderOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between font-normal"
                >
                  <span className="truncate">
                    {selectedOrder
                      ? `${selectedOrder.code ? `${selectedOrder.code} · ` : ""}${selectedOrder.name}`
                      : "Seleccionar orden..."}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command shouldFilter={false}>
                  <div className="p-2">
                    <Input
                      placeholder="Buscar orden por código o nombre..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                    />
                  </div>
                  <CommandList>
                    {loadingOrders ? (
                      <div className="text-muted-foreground p-3 text-sm">Buscando...</div>
                    ) : (
                      <CommandEmpty>No se encontraron órdenes</CommandEmpty>
                    )}
                    <CommandGroup>
                      {orders.map((order) => (
                        <CommandItem
                          key={order.id}
                          value={String(order.id)}
                          onSelect={() => {
                            setSelectedOrder(order);
                            setOrderOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedOrder?.id === order.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className="truncate">
                            {order.code ? `${order.code} · ` : ""}
                            {order.name}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-1 flex-col gap-2">
            <Label>Cotización *</Label>
            <Select
              value={selectedQuotation ? String(selectedQuotation.supplierQuotationId) : ""}
              onValueChange={(value) =>
                setSelectedQuotation(
                  quotations.find((q) => String(q.supplierQuotationId) === value) ?? null
                )
              }
              disabled={!selectedOrder || loadingQuotations}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !selectedOrder
                      ? "Elige primero la orden"
                      : loadingQuotations
                        ? "Cargando cotizaciones..."
                        : quotations.length === 0
                          ? "La orden no tiene cotizaciones"
                          : "Seleccionar cotización"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {quotations.map((quotation) => (
                  <SelectItem
                    key={quotation.supplierQuotationId}
                    value={String(quotation.supplierQuotationId)}
                  >
                    {/* Solo la descripcion: el proveedor va en su propio campo. */}
                    {quotation.description || quotation.code || `#${quotation.supplierQuotationId}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* El proveedor de la cotizacion, para que se lea sin abrir el
            selector: es a quien se le manda la tela. */}
        <div className="flex flex-row gap-2">
          <div className="flex flex-1 flex-col gap-2">
            <Label>Proveedor</Label>
            <Input
              className="bg-muted"
              disabled
              value={selectedQuotation?.supplierName ?? ""}
              placeholder="Se completa al elegir la cotización"
            />
          </div>
        </div>

        <div className="flex flex-row gap-2">
          {/* Opcional: vacío es «para todos los servicios de la cotización». */}
          <div className="flex flex-1 flex-col gap-2">
            <Label>Servicio (opcional)</Label>
            <Select
              value={selectedService ? String(selectedService.supplierServiceId) : TODOS}
              onValueChange={(value) =>
                setSelectedService(
                  value === TODOS
                    ? null
                    : services.find((s) => String(s.supplierServiceId) === value) ?? null
                )
              }
              disabled={!selectedQuotation}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los servicios de la cotización" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos los servicios de la cotización</SelectItem>
                {services.map((service) => (
                  <SelectItem
                    key={service.supplierServiceId}
                    value={String(service.supplierServiceId)}
                  >
                    {[service.processName, service.description].filter(Boolean).join(" — ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* A dónde entra la tela: un almacén DEL proveedor de la cotización.
              Sin almacenes, se crea uno en Producción > Almacén proveedores. */}
          <div className="flex flex-1 flex-col gap-2">
            <Label>Almacén del proveedor *</Label>
            <Select
              value={selectedSupplierWarehouse ? String(selectedSupplierWarehouse.warehouseId) : ""}
              onValueChange={(value) =>
                setSelectedSupplierWarehouse(
                  supplierWarehouses.find((w) => String(w.warehouseId) === value) ?? null
                )
              }
              disabled={!selectedQuotation || loadingSupplierWarehouses}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !selectedQuotation
                      ? "Elige primero la cotización"
                      : loadingSupplierWarehouses
                        ? "Cargando almacenes..."
                        : supplierWarehouses.length === 0
                          ? "El proveedor no tiene almacenes"
                          : "Seleccionar almacén"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {supplierWarehouses.map((warehouse) => (
                  <SelectItem key={warehouse.warehouseId} value={String(warehouse.warehouseId)}>
                    {warehouse.name}
                    {warehouse.address ? ` · ${warehouse.address}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedQuotation && !loadingSupplierWarehouses && supplierWarehouses.length === 0 && (
              <p className="text-muted-foreground text-xs">
                Crea uno en{" "}
                <Link to="/suppliers/warehouses/create" className="font-medium hover:underline">
                  Almacén proveedores
                </Link>
                .
              </p>
            )}
          </div>
        </div>

        {/* Qué va. */}
        <div className="flex flex-row gap-2">
          <div className="flex flex-1 flex-col gap-2">
            <Label>Material</Label>
            <Popover open={materialOpen} onOpenChange={setMaterialOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between font-normal"
                >
                  <span className="truncate">
                    {selectedMaterial?.label ?? "Buscar material..."}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command shouldFilter={false}>
                  <div className="p-2">
                    <Input
                      placeholder="Buscar por nombre..."
                      value={materialSearch}
                      onChange={(e) => setMaterialSearch(e.target.value)}
                    />
                  </div>
                  <CommandList>
                    {loadingMaterials ? (
                      <div className="text-muted-foreground p-3 text-sm">Buscando...</div>
                    ) : (
                      <CommandEmpty>No se encontraron materiales</CommandEmpty>
                    )}
                    <CommandGroup>
                      {materials
                        // Los ya agregados no se vuelven a ofrecer.
                        .filter((m) => !isOptionTaken(m))
                        .map((material) => (
                          <CommandItem
                            key={material.id}
                            value={String(material.id)}
                            onSelect={() => {
                              setSelectedMaterial(material);
                              setMaterialOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedMaterial?.id === material.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex min-w-0 flex-col">
                              <span className="truncate">{material.label}</span>
                              <span className="text-muted-foreground text-xs">
                                {material.code} · {material.materialClassName} · {material.measurementUnit}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-end">
            <Button type="button" onClick={addMaterial} disabled={!selectedMaterial}>
              <Plus className="mr-2 h-4 w-4" /> Agregar
            </Button>
          </div>
        </div>

        {/* De dónde salen las líneas sembradas, para que no parezcan magia. */}
        {loadingPlan ? (
          <p className="text-muted-foreground flex items-center gap-2 text-xs">
            <Loader2 className="h-3 w-3 animate-spin" />
            Calculando qué le falta al taller...
          </p>
        ) : (
          plan !== null && (
            <p className="text-muted-foreground text-xs">
              Sembrado con lo que consumen {plan.itemsCovered}{" "}
              {plan.itemsCovered === 1 ? "prenda" : "prendas"} de la orden, menos
              lo que ese taller ya tiene. Puedes cambiar las cantidades, quitar
              líneas o agregar materiales que no estén en la receta.
            </p>
          )
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>U/M</TableHead>
                <TableHead className="text-right">Necesita</TableHead>
                <TableHead className="text-right">Ya tiene el taller</TableHead>
                <TableHead className="text-right">Stock en origen</TableHead>
                <TableHead className="w-40 text-right">Cantidad a enviar</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground py-8 text-center">
                    Elige la orden y la cotización y las líneas se llenan solas,
                    o agrega materiales a mano.
                  </TableCell>
                </TableRow>
              ) : (
                lines.map((line) => (
                  <TableRow key={line.lineKey}>
                    <TableCell>
                      <div>{line.materialName}</div>
                      {/* Dónde MÁS hay. Solo los almacenes de otros talleres y
                          solo si no son el destino: que la tela esté en el
                          taller de al lado es justo lo que nadie ve, y desde
                          ahí se puede mandar directo eligiéndolo como origen. */}
                      {line.sources
                        .filter(
                          (source) =>
                            source.owner === "supplier" && !source.isDestination
                        )
                        .map((source) => (
                          <div
                            key={source.warehouseId}
                            className="text-warning text-xs"
                          >
                            {`Hay ${fmt(source.stock)} en ${source.warehouseName}`}
                            {source.supplierName ? ` (${source.supplierName})` : ""}
                          </div>
                        ))}
                    </TableCell>
                    <TableCell>{line.measurementUnit}</TableCell>
                    {/* Agregado a mano: no sale de ninguna receta, así que no
                        necesita nada. Un cero ahí diría otra cosa. */}
                    <TableCell className="text-right tabular-nums">
                      {line.required === null ? "—" : fmt(line.required)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {line.alreadyAtDestination > 0 ? (
                        <span className="text-success-soft-foreground">
                          {fmt(line.alreadyAtDestination)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(line.stock)}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.001"
                        max={line.stock}
                        className="h-8 text-right"
                        value={line.quantity ?? ""}
                        onChange={(e) => setLineQuantity(line.lineKey, e.target.value)}
                        disabled={line.stock <= 0}
                        aria-label={`Cantidad de ${line.materialName}`}
                      />
                      {line.stock <= 0 && (
                        <p className="text-destructive mt-1 text-xs">
                          Sin stock en el almacén de origen
                        </p>
                      )}
                      {/* El taller ya tiene de sobra. Se dice y se deja vacía;
                          mandarle igual sigue siendo posible, solo que ahora
                          es una decisión y no un descuido. */}
                      {line.suggested === 0 && line.stock > 0 && (
                        <p className="text-muted-foreground mt-1 text-xs">
                          Ya lo tiene: no hace falta enviar
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLine(line.lineKey)}
                        aria-label="Quitar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default MaterialDispatchCreate;
